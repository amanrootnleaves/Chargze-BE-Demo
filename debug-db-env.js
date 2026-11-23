// debug-db-env.js (temporary)
const fs = require('fs');
const path = require('path');

const raw = process.env.DATABASE_POSTGRES_WRITE_URL;
if (!raw) {
  console.log('[dbdebug] env MISSING');
} else {
  try {
    const u = new URL(raw);
    const p = u.searchParams;
    console.log('[dbdebug]', {
      commit: process.env.RENDER_GIT_COMMIT,
      branch: process.env.RENDER_GIT_BRANCH,
      cwd: process.cwd(),
      nodeOpenssl: process.versions.openssl,
      host: u.hostname, port: u.port, db: u.pathname,
      paramKeys: [...p.keys()],
      sslmode: p.get('sslmode'), sslaccept: p.get('sslaccept'), sslcert: p.get('sslcert'),
    });
  } catch (e) {
    console.log('[dbdebug] URL parse FAILED');
  }
}

for (const c of [path.resolve(process.cwd(), 'ca.pem'), '/opt/render/project/src/ca.pem', '/etc/secrets/ca.pem']) {
  try {
    const t = fs.readFileSync(c, 'utf8');
    console.log('[dbdebug] cert', c, { exists: true, certCount: (t.match(/BEGIN CERTIFICATE/g) || []).length });
  } catch (e) {
    console.log('[dbdebug] cert', c, { exists: false });
  }
}
