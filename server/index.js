const express = require('express');
const { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } = require('node:crypto');
const path = require('node:path');
const { createStore } = require('./store');

const fail = (status, message) => Object.assign(new Error(message), { status });
const hashToken = token => createHash('sha256').update(token).digest('hex');
const profile = u => ({ id: u.id, name: u.name, email: u.email, role: u.role || 'customer' });
const publicOrder = ({ userId, ...order }) => order;
const phoneNumber = value => {
  const phone = String(value || '').replace(/[\s+-]/g, '').replace(/^0/, '254');
  if (!/^254[17]\d{8}$/.test(phone)) throw fail(400, 'Enter a Kenyan mobile number, for example 0712345678.');
  return phone;
};

function createApp({
  dataFile = process.env.DATA_FILE || path.join(__dirname, 'data/store.json'),
  databaseUrl = process.env.DATABASE_URL,
  secureCookies = process.env.NODE_ENV === 'production',
  adminEmail = process.env.ADMIN_EMAIL,
  adminPassword = process.env.ADMIN_PASSWORD,
} = {}) {
  if ((adminEmail && !adminPassword) || (!adminEmail && adminPassword)) throw new Error('Set both ADMIN_EMAIL and ADMIN_PASSWORD.');
  if (adminPassword && adminPassword.length < 12) throw new Error('ADMIN_PASSWORD must contain at least 12 characters.');
  const store = createStore({ dataFile, databaseUrl });
  const app = express();
  app.locals.store = store;
  app.disable('x-powered-by');
  const cookie = token => `maua_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${token ? 604800 : 0}${secureCookies ? '; Secure' : ''}`;
  app.use((req, res, next) => {
    res.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    if (!['GET', 'HEAD'].includes(req.method) && req.headers.origin) {
      let origin;
      try { origin = new URL(req.headers.origin); } catch { return next(fail(403, 'Origin is not allowed.')); }
      if (origin.host !== req.headers.host && origin.origin !== (process.env.APP_ORIGIN || 'http://localhost:3000')) return next(fail(403, 'Origin is not allowed.'));
    }
    next();
  });
  app.use(express.json({ limit: '16kb' }));
  app.use((req, res, next) => {
    if (req.body !== undefined && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) return next(fail(400, 'Expected a JSON object.'));
    next();
  });

  // The configured admin is created with a server-controlled password, never by public signup.
  function bootstrapAdmin(db) {
    if (!adminEmail) return;
    const email = adminEmail.trim().toLowerCase();
    let admin = db.users.find(u => u.email === email);
    if (!admin || admin.role !== 'admin' || !timingSafeEqual(scryptSync(adminPassword, admin.salt, 64), Buffer.from(admin.hash, 'hex'))) {
      const salt = randomBytes(16).toString('hex');
      if (!admin) { admin = { id: randomUUID(), email, name: 'Maua Admin', wishlist: [] }; db.users.push(admin); }
      Object.assign(admin, { role: 'admin', salt, hash: scryptSync(adminPassword, salt, 64).toString('hex') });
      db.sessions = db.sessions.filter(s => s.userId !== admin.id);
    }
  }
  function route(method, url, access, action) {
    app[method](url, (req, res, next) => {
      store.run(async db => {
        bootstrapAdmin(db);
        const token = (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith('maua_session='))?.slice(13);
        const session = token && db.sessions.find(s => (s.tokenHash === hashToken(token) || s.token === token) && s.expires > Date.now());
        const user = session && db.users.find(u => u.id === session.userId);
        if (access !== 'public' && !user) throw fail(401, 'Please log in to continue.');
        if (access === 'admin' && user.role !== 'admin') throw fail(403, 'Administrator access is required.');
        return action({ req, db, user, token, body: req.body || {} });
      }).then(({ status = 200, data, sessionCookie }) => {
        if (sessionCookie !== undefined) res.setHeader('Set-Cookie', cookie(sessionCookie));
        res.status(status).json(data);
      }).catch(next);
    });
  }
  const audit = (db, user, action, recordId) => db.audit.unshift({ id: randomUUID(), date: new Date().toISOString(), actor: user.email, action, recordId });
  const notify = (db, user, order) => {
    const notification = {
      id: randomUUID(), userId: user.id, orderId: order.id, date: new Date().toISOString(),
      to: user.email, subject: 'Your Maua demo order is confirmed', status: 'simulated',
      body: `Hi ${user.name}, your demo order ${order.id} is confirmed. Simulated M-Pesa receipt: ${order.payment.receipt}. Total: KES ${order.total.toFixed(2)}. This is an email preview only. No email was sent and no money was charged.`,
    };
    db.notifications.unshift(notification);
    return notification;
  };

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  route('get', '/api/flowers', 'public', ({ db }) => ({ data: db.flowers.filter(f => f.active !== false) }));
  route('post', ['/api/auth/signup', '/api/auth/login'], 'public', ({ req, db, body }) => {
    const signup = req.path.endsWith('signup');
    const key = req.ip;
    db.attempts = db.attempts.filter(a => a.until > Date.now());
    let attempt = db.attempts.find(a => a.key === key);
    if (!attempt) { attempt = { key, count: 0, until: Date.now() + 60000 }; db.attempts.push(attempt); }
    if (++attempt.count > 20) return { status: 429, data: { message: 'Too many attempts. Please try again in a minute.' } };
    const reject = (status, message) => ({ status, data: { message } });
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = body.password;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || typeof password !== 'string' || password.trim().length < 8 || password.length > 128) return reject(400, 'Enter a valid email and a password of 8–128 characters.');
    let account = db.users.find(u => u.email === email);
    if (signup) {
      if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.trim().length > 60) return reject(400, 'Enter a name between 2 and 60 characters.');
      if (account) return reject(409, 'An account with this email already exists. Please log in.');
      const salt = randomBytes(16).toString('hex');
      account = { id: randomUUID(), name: body.name.trim(), email, role: 'customer', salt, hash: scryptSync(password, salt, 64).toString('hex'), wishlist: [] };
      db.users.push(account);
    } else {
      const hash = scryptSync(password, account?.salt || 'missing-account', 64);
      if (!account || !timingSafeEqual(hash, Buffer.from(account.hash, 'hex'))) return reject(401, 'Email or password is incorrect.');
    }
    const token = randomBytes(32).toString('hex');
    db.sessions = db.sessions.filter(s => s.expires > Date.now());
    db.sessions.push({ tokenHash: hashToken(token), userId: account.id, expires: Date.now() + 604800000 });
    return { status: signup ? 201 : 200, data: profile(account), sessionCookie: token };
  });
  route('post', '/api/auth/logout', 'public', ({ db, token }) => {
    db.sessions = db.sessions.filter(s => s.tokenHash !== hashToken(token || '') && s.token !== token);
    return { data: { ok: true }, sessionCookie: '' };
  });
  route('get', '/api/auth/me', 'user', ({ user }) => ({ data: profile(user) }));
  route('get', '/api/wishlist', 'user', ({ user }) => ({ data: user.wishlist }));
  route('put', '/api/wishlist', 'user', ({ user, db, body }) => {
    if (!Array.isArray(body.ids) || body.ids.length > db.flowers.length || body.ids.some(id => !db.flowers.some(f => f.id === id))) throw fail(400, 'Wishlist contains an invalid flower.');
    user.wishlist = [...new Set(body.ids)]; return { data: user.wishlist };
  });
  route('get', '/api/orders', 'user', ({ db, user }) => ({ data: db.orders.filter(o => o.userId === user.id).map(publicOrder) }));
  route('get', '/api/notifications', 'user', ({ db, user }) => ({ data: db.notifications.filter(n => n.userId === user.id) }));
  route('post', '/api/orders', 'user', ({ db, user, body }) => {
    if (!['standard', 'express'].includes(body.shipping) || !Array.isArray(body.items) || !body.items.length || body.items.length > db.flowers.length) throw fail(400, 'Choose delivery and at least one bouquet.');
    const seen = new Set();
    const items = body.items.map(item => {
      const flower = db.flowers.find(f => f.id === item?.flowerId && f.active !== false);
      if (!flower || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99 || seen.has(flower.id)) throw fail(400, 'Invalid bouquet or quantity.');
      seen.add(flower.id); return { flower: structuredClone(flower), quantity: item.quantity };
    });
    const delivery = body.shipping === 'express' ? 9.99 : 4.99;
    const cents = items.reduce((sum, i) => sum + Math.round(Number(i.flower.price) * 100) * i.quantity, Math.round(delivery * 100));
    const order = { id: randomUUID(), userId: user.id, date: new Date().toISOString(), items, shipping: body.shipping, delivery, total: cents / 100, currency: 'KES', status: 'awaiting_payment' };
    db.orders.unshift(order);
    return { status: 201, data: publicOrder(order) };
  });
  route('post', '/api/payments/mpesa', 'user', ({ db, user, body }) => {
    const order = db.orders.find(o => o.id === body.orderId && o.userId === user.id);
    if (!order) throw fail(404, 'Order not found.');
    if (order.status !== 'awaiting_payment') throw fail(409, 'This order is not awaiting payment.');
    const phone = phoneNumber(body.phone);
    const existing = db.payments.find(p => p.orderId === order.id && p.status === 'pending');
    if (existing) return { data: existing };
    const payment = { id: randomUUID(), orderId: order.id, userId: user.id, phone, amount: order.total, currency: 'KES', status: 'pending', simulated: true, date: new Date().toISOString() };
    db.payments.unshift(payment);
    return { status: 201, data: payment };
  });
  route('post', '/api/payments/mpesa/:id/simulate', 'user', ({ req, db, user, body }) => {
    const payment = db.payments.find(p => p.id === req.params.id && p.userId === user.id);
    if (!payment) throw fail(404, 'Payment not found.');
    if (!['approved', 'failed', 'cancelled'].includes(body.outcome)) throw fail(400, 'Choose an approved, failed or cancelled simulation.');
    const order = db.orders.find(o => o.id === payment.orderId);
    if (payment.status !== 'pending') {
      if (payment.status !== body.outcome) throw fail(409, 'This payment simulation is already complete.');
      return { data: { payment, order: publicOrder(order), notification: db.notifications.find(n => n.orderId === order.id) || null } };
    }
    if (order.status !== 'awaiting_payment') throw fail(409, 'This order is not awaiting payment.');
    payment.status = body.outcome;
    payment.completedAt = new Date().toISOString();
    let notification = null;
    if (body.outcome === 'approved') {
      payment.receipt = `SIM${randomBytes(5).toString('hex').toUpperCase()}`;
      order.status = 'confirmed';
      order.payment = { id: payment.id, receipt: payment.receipt, simulated: true };
      notification = notify(db, user, order);
    }
    return { data: { payment, order: publicOrder(order), notification } };
  });

  route('get', '/api/admin/database', 'admin', ({ db }) => ({ data: {
    users: db.users.map(u => ({ ...profile(u), wishlist: u.wishlist })),
    orders: db.orders, payments: db.payments, notifications: db.notifications,
    flowers: db.flowers, audit: db.audit,
    sessions: db.sessions.map(s => ({ userId: s.userId, expires: new Date(s.expires).toISOString() })),
    summary: { users: db.users.length, orders: db.orders.length, confirmed: db.orders.filter(o => o.payment).length, revenue: Number(db.orders.filter(o => o.payment && o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0).toFixed(2)) },
  } }));
  route('patch', '/api/admin/users/:id/role', 'admin', ({ req, db, user, body }) => {
    const target = db.users.find(u => u.id === req.params.id);
    if (!target) throw fail(404, 'User not found.');
    if (!['admin', 'customer'].includes(body.role)) throw fail(400, 'Invalid role.');
    if (target.id === user.id || target.email === adminEmail?.trim().toLowerCase()) throw fail(409, 'You cannot change your own role or the configured administrator role.');
    target.role = body.role;
    db.sessions = db.sessions.filter(s => s.userId !== target.id);
    audit(db, user, `Set role to ${body.role}`, target.id);
    return { data: profile(target) };
  });
  route('patch', '/api/admin/orders/:id', 'admin', ({ req, db, user, body }) => {
    const order = db.orders.find(o => o.id === req.params.id);
    if (!order) throw fail(404, 'Order not found.');
    const transitions = { awaiting_payment: ['cancelled'], confirmed: ['preparing', 'cancelled'], preparing: ['delivered', 'cancelled'], delivered: [], cancelled: [] };
    if (!transitions[order.status]?.includes(body.status)) throw fail(409, 'This order status transition is not allowed.');
    order.status = body.status;
    audit(db, user, `Order ${body.status}`, order.id);
    return { data: order };
  });
  function product(body, previous = {}) {
    const value = { ...previous };
    for (const key of ['name', 'description', 'image', 'family', 'origin', 'symbols']) {
      if (body[key] !== undefined) {
        if (typeof body[key] !== 'string' || body[key].length > 2000) throw fail(400, `Invalid ${key}.`);
        value[key] = body[key].trim();
      }
    }
    if (!value.name || !value.description || !value.image) throw fail(400, 'Name, description and image are required.');
    if (!/^\/assets\/[a-zA-Z0-9_.-]+$/.test(value.image) && !/^https:\/\/[^\s]+$/.test(value.image)) throw fail(400, 'Use a local /assets/ image or an HTTPS image URL.');
    const price = body.price === undefined ? Number(value.price) : body.price;
    if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0 || price > 1000000) throw fail(400, 'Price must be between 0 and 1,000,000 KES.');
    value.price = price.toFixed(2);
    for (const key of ['active', 'bestSeller', 'newArrival']) {
      if (body[key] !== undefined) {
        if (typeof body[key] !== 'boolean') throw fail(400, `Invalid ${key}.`);
        value[key] = body[key];
      }
    }
    if (value.originalPrice && Number(value.originalPrice) <= price) delete value.originalPrice;
    return value;
  }
  route('post', '/api/admin/flowers', 'admin', ({ db, user, body }) => {
    const flower = { ...product(body), id: randomUUID() };
    db.flowers.push(flower);
    audit(db, user, 'Created flower', flower.id);
    return { status: 201, data: flower };
  });
  route('patch', '/api/admin/flowers/:id', 'admin', ({ req, db, user, body }) => {
    const flower = db.flowers.find(f => f.id === req.params.id);
    if (!flower) throw fail(404, 'Flower not found.');
    Object.assign(flower, product(body, flower));
    audit(db, user, 'Updated flower', flower.id);
    return { data: flower };
  });
  route('delete', '/api/admin/flowers/:id', 'admin', ({ req, db, user }) => {
    if (!db.flowers.some(f => f.id === req.params.id)) throw fail(404, 'Flower not found.');
    db.flowers = db.flowers.filter(f => f.id !== req.params.id);
    db.users.forEach(u => { u.wishlist = u.wishlist.filter(id => id !== req.params.id); });
    audit(db, user, 'Deleted flower', req.params.id);
    return { data: { ok: true } };
  });
  route('delete', '/api/admin/sessions/:userId', 'admin', ({ req, db, user }) => {
    db.sessions = db.sessions.filter(s => s.userId !== req.params.userId);
    audit(db, user, 'Revoked sessions', req.params.userId);
    return { data: { ok: true } };
  });
  app.use((req, res, next) => next(fail(404, 'Endpoint not found.')));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (!error.status) console.error(error.message);
    let message = error.status ? error.message : 'Unable to save your request. Please try again.';
    if (error.type === 'entity.parse.failed') message = 'Invalid JSON.';
    if (error.type === 'entity.too.large') message = 'Request is too large.';
    res.status(error.status || 500).json({ message });
  });
  return app;
}
if (require.main === module) {
  // Optional local environment file, kept out of Git.
  require('dotenv').config({ path: '.env.local' });
  createApp().listen(Number(process.env.PORT) || 3001, process.env.HOST || '127.0.0.1', () => console.log(`Maua Express API listening on port ${process.env.PORT || 3001}`));
}
module.exports = { createApp };
