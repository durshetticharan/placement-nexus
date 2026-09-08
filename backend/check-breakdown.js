const BASE = 'http://localhost:5000/api/v1';

async function main() {
  const login = await fetch(BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'reca_1788693757633@test.com', password: 'Recruiter@123' })
  });
  const d = await login.json();
  const t = d.data.accessToken;

  const drives = await fetch(BASE + '/recruiters/drives', { headers: { Authorization: 'Bearer ' + t } });
  const dd = await drives.json();
  const driveId = dd.data[0].id;

  const apps = await fetch(BASE + '/recruiters/me/drives/' + driveId + '/applications', { headers: { Authorization: 'Bearer ' + t } });
  const ad = await apps.json();
  const appId = ad.data[0].id;

  const bd = await fetch(BASE + '/recruiters/me/applications/' + appId + '/match-breakdown', { headers: { Authorization: 'Bearer ' + t } });
  const bdData = await bd.json();
  console.log('Match Breakdown Response:');
  console.log(JSON.stringify(bdData.data, null, 2));
}
main().catch(console.error);
