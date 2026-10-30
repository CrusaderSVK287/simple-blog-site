const http = require("http");
const https = require("https");
const fs = require("fs");

const html = fs.readFileSync("index.html");
const options = {
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem")
};

http.createServer((req, res) => {
    res.writeHead(301, {
        "Location": "https://localhost:8443" + req.url
    });
    res.end();
}).listen(8000);

https.createServer(options, (req, res) => {
    if (req.method === "GET" && req.url === "/") {
        res.writeHead(200, {
            "Content-Type": "text/html"
        });
        res.end(html);
    } else {
        res.writeHead(404, {
            "Content-Type": "text/plain"
        });
        res.end("Not Found");
    }
}).listen(8443);

console.log("HTTP server running on port 8000");
console.log("HTTPS server running on port 8443");