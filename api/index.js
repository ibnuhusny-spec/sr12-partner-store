/**
 * SR12 PARTNER STORE - VERCEL SERVERLESS API HANDLER
 */

const db = require('../database/database');

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
    if (req.body && typeof req.body === 'object') {
      return resolve(req.body);
    }
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

try {
  db.ensureDbExists();
} catch (e) {
  console.warn('DB init in serverless warning:', e);
}

module.exports = async function handler(req, res) {
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

  const urlParts = (req.url || '').split('?');
  const cleanUrl = urlParts[0];

  // 1. Health Status & Cloud Connection
  if ((cleanUrl === '/api/status' || cleanUrl === '/status') && req.method === 'GET') {
    return sendJson(res, 200, {
      status: 'online',
      environment: 'vercel-serverless',
      database: 'connected (multi-tenant JSON engine & Supabase Cloud)',
      supabaseUrl: 'https://htdmdzbbwltesopfrmoc.supabase.co',
      supabaseStatus: 'live',
      serverTime: new Date().toISOString(),
      cloudSchemaReady: true
    });
  }

  // 2. Auth: Login Distributor
  if ((cleanUrl === '/api/auth/login' || cleanUrl === '/auth/login') && req.method === 'POST') {
    const body = await parseBody(req);
    const result = db.loginDistributor(body.emailOrPhone, body.password);
    return sendJson(res, result.success ? 200 : 401, result);
  }

  // 3. Stores List
  if ((cleanUrl === '/api/stores' || cleanUrl === '/stores') && req.method === 'GET') {
    const stores = db.getAllStores();
    return sendJson(res, 200, { success: true, data: stores });
  }

  // 4. Single Store Details (/api/stores/:slug)
  const storeMatch = cleanUrl.match(/(?:\/api)?\/stores\/([a-zA-Z0-9-]+)$/);
  if (storeMatch) {
    const slug = storeMatch[1];
    if (req.method === 'GET') {
      const store = db.getStoreBySlug(slug);
      if (!store) return sendJson(res, 404, { success: false, message: 'Toko tidak ditemukan' });
      return sendJson(res, 200, { success: true, data: store });
    }
    if (req.method === 'PUT' || req.method === 'POST') {
      const body = await parseBody(req);
      const updated = db.updateStoreSettings(slug, body);
      return sendJson(res, 200, { success: true, data: updated });
    }
  }

  // 5. Products List (/api/stores/:slug/products)
  const prodMatch = cleanUrl.match(/(?:\/api)?\/stores\/([a-zA-Z0-9-]+)\/products$/);
  if (prodMatch) {
    const slug = prodMatch[1];
    if (req.method === 'GET') {
      const products = db.getStoreProducts(slug);
      return sendJson(res, 200, { success: true, data: products });
    }
    if (req.method === 'POST') {
      const body = await parseBody(req);
      const added = db.addProductToStore(slug, body);
      return sendJson(res, 201, { success: true, data: added });
    }
  }

  // 6. Update Product (/api/stores/:slug/products/:id)
  const updateProdMatch = cleanUrl.match(/(?:\/api)?\/stores\/([a-zA-Z0-9-]+)\/products\/([a-zA-Z0-9-_]+)$/);
  if (updateProdMatch && (req.method === 'PUT' || req.method === 'POST')) {
    const slug = updateProdMatch[1];
    const prodId = updateProdMatch[2];
    const body = await parseBody(req);
    const updated = db.updateProduct(slug, prodId, body);
    return sendJson(res, 200, { success: true, data: updated });
  }

  // 7. Mitra Downlines (/api/stores/:slug/mitra)
  const mitraMatch = cleanUrl.match(/(?:\/api)?\/stores\/([a-zA-Z0-9-]+)\/mitra$/);
  if (mitraMatch) {
    const slug = mitraMatch[1];
    if (req.method === 'GET') {
      const mitra = db.getStoreMitra(slug);
      return sendJson(res, 200, { success: true, data: mitra });
    }
    if (req.method === 'POST') {
      const body = await parseBody(req);
      const added = db.addMitraDownline(slug, body);
      return sendJson(res, 201, { success: true, data: added });
    }
  }

  // 8. Marketer Sales & Payroll (/api/stores/:slug/marketer-sales)
  const marketerSalesMatch = cleanUrl.match(/(?:\/api)?\/stores\/([a-zA-Z0-9-]+)\/marketer-sales$/);
  if (marketerSalesMatch) {
    const slug = marketerSalesMatch[1];
    if (req.method === 'GET') {
      const sales = db.getStoreMarketerSales(slug);
      return sendJson(res, 200, { success: true, data: sales });
    }
    if (req.method === 'POST') {
      const body = await parseBody(req);
      const added = db.recordMarketerSale(slug, body);
      return sendJson(res, 201, { success: true, data: added });
    }
  }

  // 8b. Toggle Marketer Payroll Status
  const statusMatch = cleanUrl.match(/(?:\/api)?\/stores\/([a-zA-Z0-9-]+)\/marketer-sales\/status$/);
  if (statusMatch && req.method === 'POST') {
    const slug = statusMatch[1];
    const body = await parseBody(req);
    const resData = db.toggleMarketerPayrollStatus(slug, body.marketerId, body.monthPeriod);
    return sendJson(res, 200, { success: true, data: resData });
  }

  // 9. Top-Up Quota (/api/stores/:slug/topup)
  const topupMatch = cleanUrl.match(/(?:\/api)?\/stores\/([a-zA-Z0-9-]+)\/topup$/);
  if (topupMatch && req.method === 'POST') {
    const slug = topupMatch[1];
    const body = await parseBody(req);
    const result = db.topupStoreQuota(slug, Number(body.amount) || 0, Number(body.quota) || 0);
    return sendJson(res, 200, { success: true, data: result });
  }

  // 10. Developer Settings
  if (cleanUrl === '/api/developer/settings' || cleanUrl === '/developer/settings') {
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
};
