const http = require('http');

const req = http.get('http://localhost:5000/api/health', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Backend running! Status: ${res.statusCode}`);
    console.log(`Response: ${data}`);
  });
}).on('error', (err) => {
  console.log(`Backend NOT running or error: ${err.message}`);
});
