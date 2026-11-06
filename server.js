const express = require("express");
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const app = express();

const options = {
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem")
};

app.use(express.json());

let comments = [
    {
        id: 1,
        username: "Alice",
        body: "Really nice blog post!"
    },
    {
        id: 2,
        username: "Bob",
        body: "Looking forward to reading more."
    }
];

let nextCommentId = 3;

// GET - Retrieve all comments
app.get("/api/comments", (req, res) => {
    res.status(200).json(comments);
});

// POST - Create a new comment
app.post("/api/comments", (req, res) => {
    const { username, body } = req.body;

    if (!username || !body) {
        return res.status(400).json({
            error: "Username and comment are required."
        });
    }

    const comment = {
        id: nextCommentId++,
        username: username,
        body: body
    };

    comments.push(comment);

    res.status(201).json(comment);
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