# simple-blog-site
```
npm install

openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 365 \
  -keyout key.pem \
  -out cert.pem \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

node server.js
```
## Lecture 1 — Endpoints and requests
> "How do we make the server do something other than say hello?"

HTTP methods, URLs, request parameters, JSON request bodies, responses and status codes. Difference between GET, POST, PATCH and DELETE.

Practical exercise: Build a small API that stores a list of objects in a JavaScript array. Retrieve the list, retrieve one object, create one, and delete one.

By the end, know how to create endpoints and test them using a browser or an API client such as Postman.

```
npm install express
```
