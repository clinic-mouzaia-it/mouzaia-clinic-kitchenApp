const fs = require("fs");
const https = require("https");
const next = require("next");
const path = require("path");

// Replace with your local IP address
const localIp = "172.16.1.71";

const cert = fs.readFileSync(path.join(__dirname, `${localIp}.pem`));
const key = fs.readFileSync(path.join(__dirname, `${localIp}-key.pem`));

const app = next({ dev: true });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  https
    .createServer({ key, cert }, (req, res) => {
      handle(req, res);
    })
    .listen(3000, () => {
      console.log(`✅ App running at https://${localIp}:3000`);
    });
});
