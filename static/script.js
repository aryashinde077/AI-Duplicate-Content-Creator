async function generateContent() {

    const original = document.getElementById("originalContent").value;
    const type = document.getElementById("contentType").value;
    const tone = document.getElementById("tone").value;
    const language = document.getElementById("language").value;

    const output = document.getElementById("generatedContent");
    const status = document.getElementById("status");

    if (original.trim() === "") {
        alert("Please enter some original content first.");
        return;
    }

    status.textContent = "Generating...";

    try {

        const response = await fetch("/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                content: original,
                type: type,
                tone: tone,
                language: language
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Generation failed");
        }

        output.innerHTML = `
            <div style="line-height:1.7; font-size:13px; white-space:pre-wrap;">
                ${data.result}
            </div>
        `;

        status.textContent = "Content generated";
        loadTotalGenerations();
        loadContentCreated();
        loadRecentGenerations();

    } catch (error) {

        console.error(error);
        status.textContent = "Error";

        alert("Could not generate content. Please make sure the Python backend is running.");

    }
}


function copyContent() {

    const output = document.getElementById("generatedContent");

    if (output.innerText.trim() === "") {
        alert("There is no generated content to copy.");
        return;
    }

    navigator.clipboard.writeText(output.innerText);

    alert("Content copied successfully!");
}


function downloadContent() {

    const output = document.getElementById("generatedContent");

    if (output.innerText.trim() === "") {
        alert("There is no generated content to download.");
        return;
    }

    const file = new Blob([output.innerText], {
        type: "text/plain"
    });

    const link = document.createElement("a");

    link.href = URL.createObjectURL(file);
    link.download = "AI-Generated-Content.txt";

    link.click();

    URL.revokeObjectURL(link.href);
}


// SIDEBAR MENU

const menuItems = document.querySelectorAll("nav a");

menuItems.forEach(function(item) {

    item.addEventListener("click", function() {

        menuItems.forEach(function(menu) {
            menu.classList.remove("active");
        });

        this.classList.add("active");

        const page = this.getAttribute("data-page");


        if (page === "dashboard") {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }


        if (page === "create") {

            document.querySelector(".creator-card").scrollIntoView({
                behavior: "smooth"
            });

        }


        if (page === "history") {

    const history = document.querySelector("#historyPage");

    if (history) {

        history.style.display = "block";

        history.scrollIntoView({
            behavior: "smooth"
        });

        fetch("/history")
            .then(response => response.json())
            .then(data => {

                history.innerHTML = `
                    <div class="creator-card"
                        style="
                            background:#111118;
                            color:#ffffff;
                            border:1px solid #292633;
                            border-radius:20px;
                            padding:26px;
                        ">

                        <h2 style="color:#ffffff;">
                            Content History
                        </h2>

                        <p style="color:#aaa5b8;">
                            Your previously generated content
                        </p>

                        ${
                            data.length === 0
                            ?
                            `<p style="color:#aaa5b8;">
                                No generated content yet.
                            </p>`
                            :
                            data.map(item => `
                                <div class="history-item"
                                    style="
                                        padding:18px;
                                        margin-top:15px;
                                        background:#15141d;
                                        color:#eeeaff;
                                        border:1px solid #292633;
                                        border-radius:14px;
                                    ">

                                    <strong style="color:#ffffff;">
                                        ${item.content_type}
                                    </strong>

                                    <p style="
                                        color:#ddd8eb;
                                        line-height:1.6;
                                    ">
                                        <b style="color:#ffffff;">
                                            Original:
                                        </b>
                                        ${item.original_content}
                                    </p>

                                    <p style="
                                        color:#ddd8eb;
                                        line-height:1.6;
                                    ">
                                        <b style="color:#ffffff;">
                                            Generated:
                                        </b>
                                        ${item.generated_content}
                                    </p>

                                    <small style="color:#9e98ad;">
                                        ${item.tone} • ${item.language}
                                    </small>

                                </div>
                            `).join("")
                        }

                    </div>
                `;

            })
            .catch(error => {

                console.error(error);

                history.innerHTML = `
                    <div class="creator-card"
                        style="
                            background:#111118;
                            color:#ffffff;
                            border:1px solid #292633;
                            border-radius:20px;
                            padding:26px;
                        ">

                        <h2 style="color:#ffffff;">
                            Content History
                        </h2>

                        <p style="color:#aaa5b8;">
                            Could not load content history.
                        </p>

                    </div>
                `;

            });

    }

}

        if (page === "saved") {

    const saved = document.querySelector("#savedPage");

    if (saved) {

        saved.style.display = "block";

        saved.scrollIntoView({
            behavior: "smooth"
        });

        fetch("/saved")
            .then(response => response.json())
            .then(data => {

                saved.innerHTML = `
                    <div class="creator-card"
                        style="
                            background:#111118;
                            color:#ffffff;
                            border:1px solid #292633;
                            border-radius:20px;
                            padding:26px;
                        ">

                        <h2 style="color:#ffffff;">
                            Saved Content
                        </h2>

                        <p style="color:#aaa5b8;">
                            Your saved AI-generated content
                        </p>

                        ${
                            data.length === 0
                            ?
                            `<p style="color:#aaa5b8;">
                                No saved content yet.
                            </p>`
                            :
                            data.map(item => `
                                <div class="saved-item"
                                    style="
                                        background:#15141d;
                                        color:#eeeaff;
                                        border:1px solid #292633;
                                        border-radius:14px;
                                        padding:18px;
                                        margin-top:15px;
                                    ">

                                    <strong style="color:#ffffff;">
                                        ${item.content_type}
                                    </strong>

                                    <p style="
                                        color:#ddd8eb;
                                        line-height:1.6;
                                    ">
                                        <b style="color:#ffffff;">
                                            Generated Content:
                                        </b>
                                        <br>
                                        ${item.generated_content}
                                    </p>

                                    <small style="color:#9e98ad;">
                                        ${item.tone} • ${item.language}
                                    </small>

                                </div>
                            `).join("")
                        }

                    </div>
                `;

            })
            .catch(error => {

                console.error(error);

                saved.innerHTML = `
                    <div class="creator-card"
                        style="
                            background:#111118;
                            color:#ffffff;
                            border:1px solid #292633;
                            border-radius:20px;
                            padding:26px;
                        ">

                        <h2 style="color:#ffffff;">
                            Saved Content
                        </h2>

                        <p style="color:#aaa5b8;">
                            Could not load saved content.
                        </p>

                    </div>
                `;

            });

    }

}
        if (page === "settings") {

            const settings = document.querySelector("#settingsPage");

            if (settings) {

                settings.style.display = "block";

                settings.scrollIntoView({
                    behavior: "smooth"
                });

            }

        }

    });

});
async function saveContent() {

    const original = document.getElementById("originalContent").value;
    const generated = document.getElementById("generatedContent").innerText;

    const type = document.getElementById("contentType").value;
    const tone = document.getElementById("tone").value;
    const language = document.getElementById("language").value;

    if (generated.trim() === "") {
        alert("Please generate content first.");
        return;
    }

    try {

        const response = await fetch("/save", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                content: original,
                generated: generated,
                type: type,
                tone: tone,
                language: language
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Save failed");
        }

        alert("Content saved successfully!");
        loadSavedContentCount();

    } catch (error) {

        console.error(error);
        alert("Could not save content.");

    }
}
async function loadRecentGenerations() {

    const recent = document.getElementById("recentGenerations");

    if (!recent) {
        return;
    }

    try {

        const response = await fetch("/history");

        const data = await response.json();

        const recentItems = data.slice(0, 3);

        recent.innerHTML = `
            <div class="recent-heading">
                <div>
                    <h2>Recent Generations</h2>
                    <p>Your latest AI-generated content</p>
                </div>
            </div>

            ${
                recentItems.length === 0
                ? "<p>No generated content yet.</p>"
                : recentItems.map(item => `
                    <div class="recent-item">

                        <div class="recent-icon">✨</div>

                        <div>
                            <strong>${item.content_type}</strong>
                            <span>Generated recently</span>
                        </div>

                        <span class="tag">${item.tone}</span>

                    </div>
                `).join("")
            }
        `;

    } catch (error) {

        console.error("Could not load recent generations:", error);

    }
}


document.addEventListener("DOMContentLoaded", function() {
    loadRecentGenerations();
});

async function loadRecentGenerations() {

    const recent = document.getElementById("recentGenerations");

    if (!recent) {
        return;
    }

    try {

        const response = await fetch("/history");
        const data = await response.json();

        const recentItems = data.slice(0, 3);

        recent.innerHTML = recentItems.length === 0
            ? <p style="color:#888;">No generated content yet.</p>
            : recentItems.map(item => `
                
                <div class="recent-item">

                    <div class="recent-icon">
                        ✨
                    </div>

                    <div class="recent-content">
                        <strong>${item.content_type}</strong>
                        <span>Generated recently</span>
                    </div>

                    <span class="tag">
                        ${item.tone}
                    </span>

                </div>

            `).join("");

    } catch (error) {

        console.error("Could not load recent generations:", error);

    }
}

document.addEventListener("DOMContentLoaded", function() {
    loadTotalGenerations();
});
async function loadContentCreated() {

    const contentCreated = document.getElementById("contentCreated");

    if (!contentCreated) {
        return;
    }

    try {

        const response = await fetch("/history");

        const data = await response.json();

        contentCreated.textContent = data.length;

    } catch (error) {

        console.error("Could not load content created:", error);

    }
}


document.addEventListener("DOMContentLoaded", function() {
    loadContentCreated();
});
async function loadSavedContentCount() {

    const savedCount = document.getElementById("savedContent");

    if (!savedCount) {
        return;
    }

    try {

        const response = await fetch("/saved");

        const data = await response.json();

        savedCount.textContent = data.length;
        console.log("Saved count updated:", data.length);

    } catch (error) {

        console.error("Could not load saved content count:", error);

    }
}


document.addEventListener("DOMContentLoaded", function() {
    loadSavedContentCount();
});
document.addEventListener("DOMContentLoaded", function() {

    const defaultLanguage = document.getElementById("defaultLanguage");
    const language = document.getElementById("language");

    if (defaultLanguage && language) {

        defaultLanguage.addEventListener("change", function() {

            language.value = defaultLanguage.value;

        });

    }

});
document.addEventListener("DOMContentLoaded", function() {

    const defaultTone = document.getElementById("defaultTone");
    const tone = document.getElementById("tone");

    if (defaultTone && tone) {

        defaultTone.addEventListener("change", function() {

            tone.value = defaultTone.value;

        });

    }

});
function clearContent() {
    document.getElementById("originalContent").value = "";
    document.getElementById("generatedContent").innerHTML = "";
    document.getElementById("status").textContent = "Ready";
}
// =========================
// AUTHENTICATION
// =========================

function showSignup() {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("signupForm").style.display = "block";
    document.getElementById("authMessage").textContent = "";
}

function showLogin() {
    document.getElementById("signupForm").style.display = "none";
    document.getElementById("loginForm").style.display = "block";
    document.getElementById("authMessage").textContent = "";
}

async function signupUser() {

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;

    const message = document.getElementById("authMessage");

    if (!name || !email || !password) {
        message.textContent = "Please fill all fields.";
        return;
    }

    try {

        const response = await fetch("/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok) {

            message.textContent = "Account created successfully!";

            setTimeout(() => {
                showLogin();
            }, 1000);

        } else {

            message.textContent = data.error || "Signup failed.";

        }

    } catch (error) {

        message.textContent = "Unable to connect to server.";

    }
}


async function loginUser() {

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const message = document.getElementById("authMessage");

    if (!email || !password) {
        message.textContent = "Please enter email and password.";
        return;
    }

    try {

        const response = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok) {

            message.textContent = "Login successful!";

            setTimeout(() => {
                document.getElementById("authScreen").style.display = "none";
            }, 500);

        } else {

            message.textContent = data.error || "Invalid email or password.";

        }

    } catch (error) {

        message.textContent = "Unable to connect to server.";

    }
}
// =========================
// CHECK LOGIN STATUS
// =========================

async function checkAuthStatus() {

    try {

        const response = await fetch("/auth-status");
        const data = await response.json();

        const authScreen = document.getElementById("authScreen");

        if (data.logged_in) {

            authScreen.style.display = "none";

        } else {

            authScreen.style.display = "flex";

        }

    } catch (error) {

        console.log("Authentication check failed:", error);

    }
}

document.addEventListener("DOMContentLoaded", function () {
    checkAuthStatus();
});
function showPage(page) {

    const menuItem = document.querySelector(
        'nav a[data-page="' + page + '"]'
    );

    if (menuItem) {
        menuItem.click();
    }

}
