const http = require("http");
const https = require("https")
const fs = require("fs");
const express = require("express");

const app = express();

const html = fs.readFileSync("index.html");
const options = {
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem")
};

const httpApp = express();
httpApp.use((req, res) => {
    res.redirect(301, `https://localhost:8443${req.originalUrl}`);
})

app.get("/" ,(req, res) => {
    res.type("html").send(html);
})

app.use((req, res) => {
    res.status(404).type("text").send("Not Found");
});

http.createServer(httpApp).listen(8000, () => {
    console.log("HTTP server running on port 8000");
})

https.createServer(options, app).listen(8443, () => {
    console.log("HTTPS server running on port 8443");
});
