from flask import Flask, request, jsonify, send_file, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import os
import json
import time
import urllib.request
import urllib.error
import sqlite3

app = Flask(__name__)
CORS(app)
app.secret_key = os.environ.get("SECRET_KEY", "ai-content-secret-key")
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
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
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
@app.route("/signup", methods=["POST"])
def signup():

    data = request.get_json()

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({
            "error": "All fields are required."
        }), 400

    if len(password) < 6:
        return jsonify({
            "error": "Password must be at least 6 characters."
        }), 400

    hashed_password = generate_password_hash(password)

    try:
        conn = sqlite3.connect("content.db")
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO users (name, email, password)
            VALUES (?, ?, ?)
        """, (name, email, hashed_password))

        conn.commit()
        conn.close()

        return jsonify({
            "message": "Account created successfully!"
        }), 201

    except sqlite3.IntegrityError:

        return jsonify({
            "error": "Email already registered."
        }), 409


@app.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "error": "Email and password are required."
        }), 400

    conn = sqlite3.connect("content.db")
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, name, email, password
        FROM users
        WHERE email = ?
    """, (email,))

    user = cursor.fetchone()
    conn.close()

    if user and check_password_hash(user[3], password):

        session["user_id"] = user[0]
        session["user_name"] = user[1]
        session["user_email"] = user[2]

        return jsonify({
            "message": "Login successful!",
            "name": user[1]
        })

    return jsonify({
        "error": "Invalid email or password."
    }), 401


@app.route("/logout", methods=["POST"])
def logout():

    session.clear()

    return jsonify({
        "message": "Logged out successfully."
    })


@app.route("/auth-status", methods=["GET"])
def auth_status():

    if "user_id" in session:
        return jsonify({
            "logged_in": True,
            "name": session.get("user_name"),
            "email": session.get("user_email")
        })

    return jsonify({
        "logged_in": False
    })
@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json(silent=True) or {}

    original = data.get("content", "").strip()
    content_type = data.get("type", "Blog Post")
    tone = data.get("tone", "Professional")
    language = data.get("language", "English")

    if not original:
        return jsonify({"error": "Please enter content to rewrite."}), 400

    api_key = os.environ.get("GEMINI_API_KEY")

    if not api_key:
        print("GEMINI ERROR: GEMINI_API_KEY is missing.")
        return jsonify({"error": "Server API configuration is missing."}), 500

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

   models = [
        "gemini-3.8-flash",
        "gemini-3.5-flash-lite"
    ]

    body = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ]
    }

    request_data = json.dumps(body).encode("utf-8")
    result = None

    for model in models:
        url = (
            "https://generativelanguage.googleapis.com/"
            f"v1beta/models/{model}:generateContent"
        )

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
            with urllib.request.urlopen(req, timeout=25) as response:
                result = json.loads(response.read().decode("utf-8"))
            break

        except urllib.error.HTTPError as error:
            details = error.read().decode("utf-8", errors="replace")
            print(f"GEMINI {model} HTTP ERROR {error.code}: {details}")

            if error.code == 503:
                continue

            if error.code == 429:
                return jsonify({
                    "error": "Gemini quota or rate limit reached. Please try again later."
                }), 429

            return jsonify({
                "error": f"Gemini API request failed with status {error.code}."
            }), 502

        except (TimeoutError, urllib.error.URLError) as error:
            print(f"GEMINI {model} CONNECTION ERROR:", str(error))
            continue

    if not result:
        return jsonify({
            "error": "Gemini is temporarily unavailable. Please try again later."
        }), 503
    if not result:
        return jsonify({
            "error": "Gemini did not return a response. Please try again."
        }), 502

    candidates = result.get("candidates", [])
    if not candidates:
        print("GEMINI EMPTY RESPONSE:", json.dumps(result)[:2000])
        return jsonify({
            "error": "Gemini could not generate content for this request."
        }), 502

    parts = candidates[0].get("content", {}).get("parts", [])
    generated_text = "\n".join(
        part["text"] for part in parts if part.get("text")
    ).strip()

    if not generated_text:
        return jsonify({
            "error": "Gemini returned empty content. Please try again."
        }), 502

    try:
        with sqlite3.connect("content.db", timeout=10) as conn:
            conn.execute("""
                INSERT INTO content_history
                (original_content, generated_content, content_type, tone, language)
                VALUES (?, ?, ?, ?, ?)
            """, (
                original, generated_text, content_type, tone, language
            ))
    except sqlite3.Error as error:
        print("DATABASE ERROR:", str(error))
        return jsonify({
            "error": "Content was generated, but saving history failed."
        }), 500

    return jsonify({"result": generated_text}), 200
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
# Initialize database when application starts
init_db()

if __name__ == "__main__":
    app.run(debug=True)
