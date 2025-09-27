const fs = require('fs');
const b = fs.readFileSync('./test-export.pdf').slice(0,16);
console.log(b.toString('hex'));
