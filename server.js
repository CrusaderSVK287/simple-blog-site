const http = require("http");
const https = require("https")
const fs = require("fs");
const express = require("express");
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

app.get("/api/comments", (req, res) => {
    res.status(200).json(comments);
})

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
})



const httpApp = express();
httpApp.use((req, res) => {
    res.redirect(301, `https://localhost:8443${req.originalUrl}`);
})

app.use(express.static(path.join(__dirname, "public")));

app.use((req, res) => {
    res.status(404).type("text").send("Not Found");
});

http.createServer(httpApp).listen(8000, () => {
    console.log("HTTP server running on port 8000");
})

https.createServer(options, app).listen(8443, () => {
    console.log("HTTPS server running on port 8443");
});
