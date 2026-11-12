const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://roezaobiexlmhxpuvfds.supabase.co';

const SUPABASE_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvZXphb2JpZXhsbWh4cHV2ZmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NjM4MjAsImV4cCI6MjEwNzIzOTgyMH0.o-H8qNxBT4D88VTxcJNPTVr1xN7ajL-VE_jwtyggRNc';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/stores?select=slug&limit=1`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!response.ok) {
      return res.status(502).json({
        ok: false,
        status: response.status,
        message: 'Supabase keep-alive query returned non-OK status',
        checkedAt: new Date().toISOString()
      });
    }

    const rows = await response.json();
    return res.status(200).json({
      ok: true,
      active: true,
      rows: Array.isArray(rows) ? rows.length : 0,
      checkedAt: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: err instanceof Error ? err.message : 'Keep-alive failed',
      checkedAt: new Date().toISOString()
    });
  }
}
