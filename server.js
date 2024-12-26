const { createServer } = require('node:http');

const hostname = '127.0.0.1'; //localhost 1-255
const port = 3000;

const server = createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Home Page\nWelcome to Tax Calculator\n');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
