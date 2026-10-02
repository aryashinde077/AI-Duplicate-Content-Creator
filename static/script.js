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

                        const historyList = document.querySelector("#historyPage");

                        historyList.innerHTML = `
                            <div class="creator-card">
                                <h2>Content History</h2>
                                <p>Your previously generated content</p>

                                ${data.map(item => `
                                    <div style="padding:15px; margin-top:15px; border:1px solid #ddd; border-radius:10px;">
                                        <strong>${item.content_type}</strong>
                                        <p><b>Original:</b> ${item.original_content}</p>
                                        <p><b>Generated:</b> ${item.generated_content}</p>
                                        <small>${item.tone} • ${item.language}</small>
                                    </div>
                                `).join("")}
                            </div>
                        `;

                    })
                    .catch(error => {

                        console.error(error);

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
                    <div class="creator-card">

                        <h2>Saved Content</h2>

                        <p>Your saved AI-generated content</p>

                        ${data.length === 0
                            ? "<p>No saved content yet.</p>"
                            : data.map(item => `
                                <div style="padding:15px; margin-top:15px; border:1px solid #ddd; border-radius:10px;">

                                    <strong>${item.content_type}</strong>

                                    <p>
                                        <b>Generated Content:</b><br>
                                        ${item.generated_content}
                                    </p>

                                    <small>
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
                    <div class="creator-card">
                        <h2>Saved Content</h2>
                        <p>Could not load saved content.</p>
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

async function loadTotalGenerations() {

    const total = document.getElementById("totalGenerations");

    if (!total) {
        return;
    }

    try {

        const response = await fetch("/history");

        const data = await response.json();

        total.textContent = data.length;
        console.log("TOTAL FROM DATABASE:", data.length);

    } catch (error) {

        console.error("Could not load total generations:", error);

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
