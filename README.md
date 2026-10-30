# simple-blog-site
npm install

openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 365 \
  -keyout key.pem \
  -out cert.pem \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

node server.js
