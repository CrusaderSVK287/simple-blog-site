const express = require("express");
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();

const options = {
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem")
};

app.use(express.json());

// Connect to SQLite database
const db = new sqlite3.Database(
    path.join(__dirname, "comments.db")
);

// Create comments table if it does not exist
db.run(`
    CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author TEXT NOT NULL,
        content TEXT NOT NULL,
        age TEXT NOT NULL
    )
`, (error) => {
    if (error) {
        console.error("Could not create comments table:", error);
    }
});

// GET - Retrieve all comments
app.get("/api/comments", (req, res) => {
    db.all(
        "SELECT * FROM comments ORDER BY id ASC",
        [],
        (error, rows) => {
            if (error) {
                console.error(error);
                return res.status(500).json({
                    error: "Could not retrieve comments."
                });
            }

            res.status(200).json(rows);
        }
    );
});

// POST - Create a new comment
app.post("/api/comments", (req, res) => {
    const { author, content } = req.body;

    if (
        typeof author !== "string" ||
        typeof content !== "string" ||
        !author.trim() ||
        !content.trim()
    ) {
        return res.status(400).json({
            error: "Author and comment are required."
        });
    }

    const age = new Date().toISOString();

    db.run(
        `INSERT INTO comments (author, content, age)
        VALUES (?, ?, ?)`,
        [author.trim(), content.trim(), age],
        (error) => {
            if (error) {
                console.error(error);
                return res.status(500).json({
                    error: "Could not save comment."
                });
            }

            res.status(201).json({
                message: "Comment saved."
            });
        }
    );
});

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// 404
app.use((req, res) => {
    res.status(404).send("Not Found");
});

// HTTP -> HTTPS redirect
http.createServer((req, res) => {
    res.writeHead(308, {
        "Location": "https://localhost:8443" + req.url
    });
    res.end();
}).listen(8000);

// HTTPS server
https.createServer(options, app).listen(8443);

console.log("HTTP server running on port 8000");
console.log("HTTPS server running on port 8443");
