AI DUPLICATE CONTENT CREATOR
============================

PROJECT DESCRIPTION
-------------------
AI Duplicate Content Creator is a web-based AI application that
rewrites existing content into a new and unique version using
Google Gemini AI.

TECHNOLOGIES USED
-----------------
Frontend:
- HTML
- CSS
- JavaScript

Backend:
- Python
- Flask

AI:
- Google Gemini API

Database:
- SQLite


PROJECT STRUCTURE
-----------------

AI - Duplicated-Content-Creator
│
├── app.py
├── content.db
├── README.txt
│
└── static
    ├── index.html
    ├── style.css
    └── script.js


HOW TO RUN THE PROJECT
----------------------

1. Open PowerShell.

2. Go to the project folder:

cd "C:\Users\Shree\Desktop\AI - Duplicated-Content-Creator"

3. Install Flask:

pip install flask flask-cors

4. Set the Gemini API key as an environment variable:

$env:GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

NOTE:
The API key should be provided separately and should NOT be stored
inside the project files.

5. Start the backend:

python app.py

6. Open the application in a browser:

http://127.0.0.1:5000


MAIN FEATURES
--------------

1. AI Content Generation
   - Generates rewritten content using Gemini AI.

2. Multiple Languages
   - English
   - Hindi
   - Marathi

3. Multiple Tones
   - Professional
   - Friendly
   - Casual
   - Formal

4. Content History
   - Stores generated content in SQLite.

5. Saved Content
   - Allows generated content to be saved.

6. Copy Content
   - Copies generated content.

7. Download Content
   - Downloads generated content as a text file.

8. Clear Content
   - Clears the input and generated content.

9. Dashboard
   - Shows total generations.
   - Shows content created.
   - Shows saved content.

10. Settings
    - Default language selection.
    - Default tone selection.


IMPORTANT
---------

Do not open index.html directly using file:///.

Always start the Flask backend using:

python app.py

Then open:

http://127.0.0.1:5000


DATABASE
--------

The file content.db contains the project's SQLite database.

Do not delete content.db if you want to keep the existing
history and saved-content records.


CURRENT DATABASE DATA
---------------------

History records: 12
Saved content records: 5


STOPPING THE SERVER
-------------------

To stop Flask, press:

Ctrl + C