// webhook.js
const http = require('http');
const { exec } = require('child_process');

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    exec('cd ~/public_html/dev_taptapenterprise && npm install', (err, stdout, stderr) => {
      if (err) {
        console.error(`exec error: ${err}`);
        res.statusCode = 500;
        res.end(`Error: ${err.message}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
      res.statusCode = 200;
      res.end('Dependencies installed');
    });
  } else {
    res.statusCode = 404;
    res.end('Not found');
  }
});

server.listen(3000, () => {
  console.log('Server running at https://de.taptapenterprise.blackbucks.me:4004/');
});
