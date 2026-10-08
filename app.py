from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import json
import urllib.request
import sqlite3

app = Flask(__name__)
CORS(app)
def init_db():
    conn = sqlite3.connect("content.db")
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS content_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_content TEXT,
            generated_content TEXT,
            content_type TEXT,
            tone TEXT,
            language TEXT
        )
    """)

    conn.commit()
    conn.close()


@app.route("/")
def home():
    return send_file("static/index.html")


@app.route("/history", methods=["GET"])
def history():

    conn = sqlite3.connect("content.db")
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, original_content, generated_content,
               content_type, tone, language
        FROM content_history
        ORDER BY id DESC
    """)

    rows = cursor.fetchall()
    conn.close()

    history_data = []

    for row in rows:
        history_data.append({
            "id": row[0],
            "original_content": row[1],
            "generated_content": row[2],
            "content_type": row[3],
            "tone": row[4],
            "language": row[5]
        })

    return jsonify(history_data)
@app.route("/generate", methods=["POST"])
def generate():

    data = request.get_json()

    original = data.get("content", "")
    content_type = data.get("type", "Blog Post")
    tone = data.get("tone", "Professional")
    language = data.get("language", "English")

    prompt = f"""
Rewrite the following content into a new, unique version.

Content type: {content_type}
Tone: {tone}
Language: {language}

Original content:
{original}

Keep the main meaning, but use different wording and sentence structure.
Return only the rewritten content.
"""

    api_key = os.environ.get("GEMINI_API_KEY")

    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent"

    body = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt
                    }
                ]
            }
        ]
    }

    request_data = json.dumps(body).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=request_data,
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": api_key
        },
        method="POST"
    )

    try:

        result = None

        for attempt in range(3):

            try:
                with urllib.request.urlopen(req, timeout=60) as response:
                    result = json.loads(response.read().decode("utf-8"))
                break

            except urllib.error.HTTPError as error:

                if error.code == 503 and attempt < 2:
                    import time
                    wait_time = 2 ** attempt
                    print(f"Gemini busy. Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                    continue

                raise

        generated_text = result["candidates"][0]["content"]["parts"][0]["text"]
        conn = sqlite3.connect("content.db")
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO content_history
            (original_content, generated_content, content_type, tone, language)
            VALUES (?, ?, ?, ?, ?)
        """, (original, generated_text, content_type, tone, language))

        conn.commit()
        conn.close()

        return jsonify({
            "result": generated_text
        })

    except Exception as error:

        print("GEMINI ERROR:", error)

        if hasattr(error, "read"):
            details = error.read().decode("utf-8")
            print("GEMINI DETAILS:", details)

        return jsonify({
            "error": "Gemini request failed. Please check Render logs."
        }), 500

@app.route("/save", methods=["POST"])
def save_content():

    data = request.get_json()

    original = data.get("content", "")
    generated = data.get("generated", "")
    content_type = data.get("type", "Blog Post")
    tone = data.get("tone", "Professional")
    language = data.get("language", "English")

    conn = sqlite3.connect("content.db")
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS saved_content (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_content TEXT,
            generated_content TEXT,
            content_type TEXT,
            tone TEXT,
            language TEXT
        )
    """)

    cursor.execute("""
        INSERT INTO saved_content
        (original_content, generated_content, content_type, tone, language)
        VALUES (?, ?, ?, ?, ?)
    """, (original, generated, content_type, tone, language))

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Content saved successfully!"
    })
@app.route("/saved", methods=["GET"])
def get_saved_content():

    conn = sqlite3.connect("content.db")
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, original_content, generated_content,
               content_type, tone, language
        FROM saved_content
        ORDER BY id DESC
    """)

    rows = cursor.fetchall()
    conn.close()

    saved_data = []

    for row in rows:
        saved_data.append({
            "id": row[0],
            "original_content": row[1],
            "generated_content": row[2],
            "content_type": row[3],
            "tone": row[4],
            "language": row[5]
        })

    return jsonify(saved_data)
if __name__ == "__main__":
    init_db()
    app.run(debug=True)
