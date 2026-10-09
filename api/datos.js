// Stores the expense data for "Mi semana de plata" in Upstash Redis (Vercel Storage).
// The first device that saves sets the password; after that every request must send it.
const crypto = require('crypto');

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const K_HASH = 'mi-semana:clave';
const K_DATA = 'mi-semana:datos';
const K_VER = 'mi-semana:version';

async function redis(...cmd) {
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

const hash = s => crypto.createHash('sha256').update('mi-semana:' + s).digest('hex');
const sameHash = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_ || !TOKEN) return res.status(503).json({ error: 'sin_base' });

  const clave = String(req.headers['x-clave'] || '');
  if (clave.length < 4) return res.status(401).json({ error: 'clave' });

  const stored = await redis('GET', K_HASH);
  if (stored && !sameHash(stored, hash(clave))) return res.status(401).json({ error: 'clave' });

  if (req.method === 'GET') {
    const [data, version] = await Promise.all([redis('GET', K_DATA), redis('GET', K_VER)]);
    return res.status(200).json({ data: data ? JSON.parse(data) : null, version: Number(version || 0), nueva: !stored });
  }

  if (req.method === 'PUT') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (!body.data || typeof body.data !== 'object') return res.status(400).json({ error: 'datos' });
    const current = Number((await redis('GET', K_VER)) || 0);
    if (Number(body.version || 0) !== current) return res.status(409).json({ error: 'version', version: current });
    if (!stored) await redis('SET', K_HASH, hash(clave));
    await redis('SET', K_DATA, JSON.stringify(body.data));
    await redis('SET', K_VER, String(current + 1));
    return res.status(200).json({ version: current + 1 });
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ error: 'metodo' });
};
