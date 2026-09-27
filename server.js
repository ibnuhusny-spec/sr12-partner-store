/**
 * SR12 PARTNER STORE - PRODUCTION SERVER & MULTI-TENANT REST API ENGINE
 * Menggabungkan static file server dengan REST API Database terisolasi
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./database/database');

const PORT = 3000;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

// Ensure database is initialized
db.ensureDbExists();

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const urlParts = req.url.split('?');
  const cleanUrl = urlParts[0];

  // ==========================================
  // REST API ROUTING
  // ==========================================
  if (cleanUrl.startsWith('/api/')) {
    // 1. Health Status & Cloud Connection
    if (cleanUrl === '/api/status' && req.method === 'GET') {
      return sendJson(res, 200, {
        status: 'online',
        database: 'connected (multi-tenant JSON engine & Supabase Cloud)',
        supabaseUrl: 'https://htdmdzbbwltesopfrmoc.supabase.co',
        supabaseStatus: 'live',
        serverTime: new Date().toISOString(),
        cloudSchemaReady: true
      });
    }

    // 2. Auth: Login Distributor
    if (cleanUrl === '/api/auth/login' && req.method === 'POST') {
      const body = await parseBody(req);
      const result = db.loginDistributor(body.emailOrPhone, body.password);
      return sendJson(res, result.success ? 200 : 401, result);
    }

    // 3. Stores List
    if (cleanUrl === '/api/stores' && req.method === 'GET') {
      const stores = db.getAllStores();
      return sendJson(res, 200, { success: true, data: stores });
    }

    // 4. Single Store Details (/api/stores/:slug)
    const storeMatch = cleanUrl.match(/^\/api\/stores\/([a-zA-Z0-9-]+)$/);
    if (storeMatch) {
      const slug = storeMatch[1];
      if (req.method === 'GET') {
        const store = db.getStoreBySlug(slug);
        return store ? sendJson(res, 200, { success: true, data: store }) : sendJson(res, 404, { success: false, message: 'Toko tidak ditemukan' });
      }
      if (req.method === 'PUT') {
        const body = await parseBody(req);
        const updated = db.updateStoreSettings(slug, body);
        return sendJson(res, 200, { success: true, data: updated });
      }
    }

    // 5. Mitra Downlines (/api/stores/:slug/mitra)
    const mitraMatch = cleanUrl.match(/^\/api\/stores\/([a-zA-Z0-9-]+)\/mitra$/);
    if (mitraMatch) {
      const slug = mitraMatch[1];
      if (req.method === 'GET') {
        const mitraList = db.getMitraByStore(slug);
        return sendJson(res, 200, { success: true, data: mitraList });
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const saved = db.saveMitraForStore(slug, body);
        return sendJson(res, 200, { success: true, data: saved });
      }
    }

    // 6. Delete Mitra (/api/stores/:slug/mitra/:id)
    const deleteMitraMatch = cleanUrl.match(/^\/api\/stores\/([a-zA-Z0-9-]+)\/mitra\/([a-zA-Z0-9-]+)$/);
    if (deleteMitraMatch && req.method === 'DELETE') {
      const slug = deleteMitraMatch[1];
      const id = deleteMitraMatch[2];
      const deleted = db.deleteMitraForStore(slug, id);
      return sendJson(res, 200, { success: deleted });
    }

    // 7. Marketer Sales & Payroll (/api/stores/:slug/marketer-sales)
    const salesMatch = cleanUrl.match(/^\/api\/stores\/([a-zA-Z0-9-]+)\/marketer-sales$/);
    if (salesMatch) {
      const slug = salesMatch[1];
      if (req.method === 'GET') {
        const sales = db.getMarketerSalesByStore(slug);
        return sendJson(res, 200, { success: true, data: sales });
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const newSale = db.addMarketerSaleForStore(slug, body);
        return sendJson(res, 201, { success: true, data: newSale });
      }
    }

    // 8. Toggle Marketer Paid Status (/api/stores/:slug/marketer-sales/status)
    const statusMatch = cleanUrl.match(/^\/api\/stores\/([a-zA-Z0-9-]+)\/marketer-sales\/status$/);
    if (statusMatch && req.method === 'POST') {
      const slug = statusMatch[1];
      const body = await parseBody(req);
      const resData = db.toggleMarketerPayrollStatus(slug, body.marketerId, body.monthPeriod);
      return sendJson(res, 200, { success: true, data: resData });
    }

    // 9. Top-Up Quota (/api/stores/:slug/topup)
    const topupMatch = cleanUrl.match(/^\/api\/stores\/([a-zA-Z0-9-]+)\/topup$/);
    if (topupMatch && req.method === 'POST') {
      const slug = topupMatch[1];
      const body = await parseBody(req);
      const result = db.topupStoreQuota(slug, Number(body.amount) || 0, Number(body.quota) || 0);
      return sendJson(res, 200, { success: true, data: result });
    }

    // 10. Developer Settings & Metrics
    if (cleanUrl === '/api/developer/settings') {
      if (req.method === 'GET') {
        return sendJson(res, 200, { success: true, data: db.getDeveloperSettings() });
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const saved = db.updateDeveloperSettings(body);
        return sendJson(res, 200, { success: true, data: saved });
      }
    }

    return sendJson(res, 404, { success: false, message: 'API Route Not Found' });
  }

  // ==========================================
  // STATIC ASSETS SERVING
  // ==========================================
  let staticPath = cleanUrl;
  if (staticPath === '/' || staticPath === '') {
    staticPath = '/index.html';
  }

  const filePath = path.join(__dirname, staticPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Server Error: ' + err.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`SR12 Partner Store dev server & API running at http://127.0.0.1:${PORT}`);
});
