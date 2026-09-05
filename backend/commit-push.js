const { execSync } = require('child_process');

try {
  execSync('git commit -m "fix(auth): resolve authorization token overwrite and double-login bug" -m "- Remove localStorage manual header overrides in services" -m "- Remove double api.post(\'/auth/login\') call in Login.tsx" -m "- Proxy Vite requests to /api to resolve SameSite=strict issues" -m "- Clean XSS/SQL test fixture pollution in DB"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  const hash = execSync('git rev-parse HEAD').toString().trim();
  console.log('\\nSUCCESS: Pushed commit ' + hash);
} catch (e) {
  console.error('FAILED:', e.message);
}
