
const commentsList = document.getElementById("comments-list");
const commentsStatus = document.getElementById("comments-status");
const commentForm = document.getElementById("comment-form");
const formStatus = document.getElementById("form-status");

// GET - Retrieve comments from the backend
async function loadComments() {
    commentsList.replaceChildren();
    commentsStatus.textContent = "Loading comments...";

    try {
        const response = await fetch("/api/comments");

        if (!response.ok) {
            throw new Error("Failed to load comments.");
        }

        const comments = await response.json();

        if (comments.length === 0) {
            commentsStatus.textContent = "No comments yet.";
            return;
        }

        commentsStatus.textContent = "";

        // Rebuild the entire comment section
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

    const author = document.getElementById("author").value.trim();
    const content = document.getElementById("content").value.trim();

    const button = commentForm.querySelector("button");

    button.disabled = true;
    formStatus.textContent = "";

    try {
        const response = await fetch("/api/comments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                author: author,
                content: content
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to post comment.");
        }

        commentForm.reset();
        formStatus.textContent = "Comment posted!";

        // Retrieve comments again and rebuild the section
        await loadComments();

    } catch (error) {
        formStatus.textContent = error.message;
    } finally {
        button.disabled = false;
    }
});

// Load comments when the page is opened
loadComments();
