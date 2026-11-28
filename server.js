
const express = require("express");
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sqlite3 = require("sqlite3").verbose();

const app = express();

const options = {
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem")
};

app.use(express.json());

// Sessions
const sessions = new Map();
const SESSION_DURATION = 60 * 1000;

// Connect to SQLite database
const db = new sqlite3.Database(
    path.join(__dirname, "comments.db")
);

// Create comments table
db.run(`
    CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author TEXT NOT NULL,
        content TEXT NOT NULL,
        age TEXT NOT NULL
    )
`);

// Create users table
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
    )
`);

// REGISTER - Create a new account
app.post("/api/register", (req, res) => {
    const { username, password } = req.body || {};

    if (
        typeof username !== "string" ||
        typeof password !== "string" ||
        !username.trim() ||
        !password
    ) {
        return res.status(400).json({
            error: "Username and password are required."
        });
    }

    db.run(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        [username.trim(), password],
        function(error) {
            if (error) {
                if (error.message.includes("UNIQUE")) {
                    return res.status(409).json({
                        error: "Username already exists."
                    });
                }

                console.error(error);
                return res.status(500).json({
                    error: "Could not create account."
                });
            }

            const user = {
                id: this.lastID,
                username: username.trim()
            };

            const token = crypto.randomBytes(32).toString("hex");

            sessions.set(token, {
                userId: user.id,
                username: user.username,
                expires: Date.now() + SESSION_DURATION
            });

            res.status(201).json({
                token: token,
                user: user
            });
        }
    );
});

// LOGIN - Authenticate an existing user
app.post("/api/login", (req, res) => {
    const { username, password } = req.body || {};

    if (
        typeof username !== "string" ||
        typeof password !== "string" ||
        !username.trim() ||
        !password
    ) {
        return res.status(400).json({
            error: "Username and password are required."
        });
    }

    db.get(
        `SELECT id, username FROM users
         WHERE username = ? AND password = ?`,
        [username.trim(), password],
        (error, user) => {
            if (error) {
                console.error(error);
                return res.status(500).json({
                    error: "Could not log in."
                });
            }

            if (!user) {
                return res.status(401).json({
                    error: "Invalid username or password."
                });
            }

            const token = crypto.randomBytes(32).toString("hex");

            sessions.set(token, {
                userId: user.id,
                username: user.username,
                expires: Date.now() + SESSION_DURATION
            });

            res.json({
                token: token,
                user: user
            });
        }
    );
});

// AUTHENTICATION MIDDLEWARE
app.use("/api", (req, res, next) => {
    const token = req.headers["x-session-token"];
    const session = sessions.get(token);

    // Check whether the session exists and is still valid
    if (!session || session.expires <= Date.now()) {
        sessions.delete(token);

        return res.status(401).json({
            error: "Invalid or expired session."
        });
    }

    // Renew session expiration
    session.expires = Date.now() + SESSION_DURATION;

    // Make username available to endpoints
    req.username = session.username;

    next();
});

// LOGOUT
app.post("/api/logout", (req, res) => {
    const token = req.headers["x-session-token"];

    sessions.delete(token);

    res.sendStatus(200);
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
    const { content } = req.body;
    const author = req.username;

    if (
        typeof content !== "string" ||
        !content.trim()
    ) {
        return res.status(400).json({
            error: "Comment is required."
        });
    }

    const age = new Date().toISOString();

    db.run(
        `INSERT INTO comments (author, content, age)
         VALUES (?, ?, ?)`,
        [author, content.trim(), age],
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
