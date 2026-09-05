const http = require('http');
setTimeout(() => {
  http.get('http://localhost:9222/json/version', (r) => {
    let d = '';
    r.on('data', c => d += c);
    r.on('end', () => console.log('CDP OK:', d.substring(0,200)));
  }).on('error', e => console.log('CDP NOT READY:', e.message));
}, 3000);
