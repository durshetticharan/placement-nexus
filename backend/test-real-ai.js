const http = require('http');
const req = http.request('http://localhost:5000/api/v1/ai/career/guidance', { 
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' } 
}, (res) => { 
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log(res.statusCode, data));
});
req.write(JSON.stringify({ goal: 'Software Engineer', skills: ['JavaScript'] }));
req.end();
