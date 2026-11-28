
const app = document.getElementById("app");
const loginOverlay = document.getElementById("login-overlay");

const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const authSubmit = document.getElementById("auth-submit");
const authToggle = document.getElementById("auth-toggle");
const authStatus = document.getElementById("auth-status");

const currentUser = document.getElementById("current-user");
const logoutButton = document.getElementById("logout-button");

const commentsList = document.getElementById("comments-list");
const commentsStatus = document.getElementById("comments-status");
const commentForm = document.getElementById("comment-form");
const formStatus = document.getElementById("form-status");

let sessionToken = null;
let authMode = "login";

// Show login screen
function showLogin(message = "") {
    sessionToken = null;

    app.hidden = true;
    loginOverlay.hidden = false;

    authStatus.textContent = message;
}

// Show blog
function showApp(user) {
    loginOverlay.hidden = true;
    app.hidden = false;

    currentUser.textContent = "Logged in as " + user.username;
}

// Wrapper for authenticated API requests
function apiFetch(url, options = {}) {
    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            "X-Session-Token": sessionToken
        }
    });
}

// Switch between login and registration
authToggle.addEventListener("click", () => {
    authMode = authMode === "login" ? "register" : "login";

    authTitle.textContent =
        authMode === "login" ? "Log in" : "Register";

    authSubmit.textContent =
        authMode === "login" ? "Log in" : "Register";

    authToggle.textContent =
        authMode === "login"
            ? "Need an account? Register"
            : "Already have an account? Log in";

    authStatus.textContent = "";
});

// REGISTER / LOGIN
authForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    authSubmit.disabled = true;
    authStatus.textContent = "";

    try {
        const response = await fetch("/api/" + authMode, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error);
        }

        // Save the session token in memory
        sessionToken = result.token;

        authForm.reset();

        showApp(result.user);

        await loadComments();

    } catch (error) {
        authStatus.textContent = error.message || "Could not connect to server.";
    } finally {
        authSubmit.disabled = false;
    }
});

// LOGOUT
logoutButton.addEventListener("click", async () => {
    try {
        await apiFetch("/api/logout", {
            method: "POST"
        });
    } catch (error) {
        console.error(error);
    }

    showLogin("You have been logged out.");
});

// GET - Retrieve comments from the backend
async function loadComments() {
    commentsList.replaceChildren();
    commentsStatus.textContent = "Loading comments...";

    try {
        const response = await apiFetch("/api/comments");

        if (response.status === 401) {
            showLogin("Your session has expired. Please log in again.");
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to load comments.");
        }

        const comments = await response.json();

        if (comments.length === 0) {
            commentsStatus.textContent = "No comments yet.";
            return;
        }

        commentsStatus.textContent = "";

        comments.forEach(comment => {
            const commentElement = document.createElement("div");
            commentElement.className = "comment";

            const author = document.createElement("h3");
            author.textContent = comment.author;

            const content = document.createElement("p");
            content.textContent = comment.content;

            const date = document.createElement("small");
            date.className = "comment-date";
            date.textContent =
                "Posted on " + new Date(comment.age).toLocaleString();

            commentElement.append(author, content, date);
            commentsList.append(commentElement);
        });

    } catch (error) {
        commentsStatus.textContent = "Could not load comments.";
        console.error(error);
    }
}

// POST - Submit a new comment
commentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const content = document.getElementById("content").value.trim();
    const button = commentForm.querySelector("button");

    button.disabled = true;
    formStatus.textContent = "";

    try {
        const response = await apiFetch("/api/comments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                content: content
            })
        });

        if (response.status === 401) {
            showLogin("Your session has expired. Please log in again.");
            return;
        }

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to post comment.");
        }

        commentForm.reset();
        formStatus.textContent = "Comment posted!";

        await loadComments();

    } catch (error) {
        formStatus.textContent = error.message;
    } finally {
        button.disabled = false;
    }
});

// Show login screen when the page loads
showLogin();
