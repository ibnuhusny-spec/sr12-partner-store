/**
 * Vercel Serverless Function: RajaOngkir / Komerce API Proxy
 * Mengatasi CORS browser dan menjaga keamanan request API Key
 */

const RAJAONGKIR_API_KEY = process.env.VITE_RAJAONGKIR_API_KEY || 'wMxAz9EG29338d2b95870bc2RbD8OZol';
const KOMERCE_BASE_URL = 'https://rajaongkir.komerce.id/api/v1';

export default async function handler(req, res) {
  // Izinkan CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = req.query.action || 'destination';

  try {
    // 1. Pencarian Destinasi Kota / Kecamatan / Kelurahan
    if (action === 'destination') {
      const search = (req.query.search || '').trim();
      if (!search || search.length < 3) {
        return res.status(200).json({ success: true, data: [] });
      }

      const apiUrl = `${KOMERCE_BASE_URL}/destination/domestic-destination?search=${encodeURIComponent(search)}&limit=15`;
      const response = await fetch(apiUrl, {
        headers: {
          'key': RAJAONGKIR_API_KEY
        }
      });

      const json = await response.json();
      return res.status(200).json(json);
    }

    // 2. Kalkulasi Biaya Ongkir Real-time
    if (action === 'cost') {
      const origin = req.query.origin || (req.body && req.body.origin) || '17473'; // Default origin Jakarta
      const destination = req.query.destination || (req.body && req.body.destination);
      const weight = req.query.weight || (req.body && req.body.weight) || 1000;
      const courier = req.query.courier || (req.body && req.body.courier) || 'jne:sicepat:jnt';

      if (!destination) {
        return res.status(400).json({ success: false, message: 'Destination ID required' });
      }

      const params = new URLSearchParams();
      params.append('origin', String(origin));
      params.append('destination', String(destination));
      params.append('weight', String(weight));
      params.append('courier', String(courier));

      const response = await fetch(`${KOMERCE_BASE_URL}/calculate/domestic-cost`, {
        method: 'POST',
        headers: {
          'key': RAJAONGKIR_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const json = await response.json();
      return res.status(200).json(json);
    }

    return res.status(400).json({ success: false, message: 'Invalid action' });
  } catch (error) {
    console.error('RajaOngkir Proxy Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to contact RajaOngkir server' });
  }
}
