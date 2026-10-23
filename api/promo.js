// Vercel Function: принимает промокод из игры и присылает его в Telegram.
// Переменные окружения в Vercel: BOT_TOKEN, CHAT_ID

const AL = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function valid(c) {
  const m = /^VINI-([A-Z2-9]{3})-([A-Z2-9]{3})-([A-Z2-9]{2})$/.exec(c);
  if (!m) return false;
  let h = 2166136261;
  for (const ch of m[1] + m[2] + 'vini-sugar-10') {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  h >>>= 0;
  return m[3] === AL[h % 32] + AL[(h >>> 5) % 32];
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).send('Only POST is allowed');

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const code = String((body && body.code) || '').toUpperCase();
  if (!valid(code)) return res.status(400).send('Invalid promo code');

  const { BOT_TOKEN, CHAT_ID } = process.env;
  if (!BOT_TOKEN || !CHAT_ID) return res.status(500).send('Missing BOT_TOKEN or CHAT_ID');

  try {
    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: 'Vini Sugar: выдан промокод на скидку 10%\n' + code,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return res.status(502).send('Telegram error');
    return res.status(200).send('Sent');
  } catch (e) {
    return res.status(502).send('Telegram unreachable');
  }
};
  
