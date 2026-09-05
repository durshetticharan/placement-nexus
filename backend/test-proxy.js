const http = require('http');

// Test that Vite proxy forwards /api calls to backend
http.get('http://localhost:5173/api/v1/health', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Proxy health check: status=' + res.statusCode + ' body=' + d.substring(0, 200));
  });
}).on('error', e => console.log('PROXY ERROR:', e.message));
