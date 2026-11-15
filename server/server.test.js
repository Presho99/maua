const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { createApp } = require('./index');

test('accounts, sessions, private wishlists and authoritative demo orders persist', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'maua-'));
  const dataFile = path.join(dir, 'store.json');
  let server;
  let base;
  async function start() {
    const app = createApp({ dataFile });
    await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
    base = `http://127.0.0.1:${server.address().port}`;
  }
  async function request(route, method = 'GET', body, cookie) {
    const response = await fetch(base + '/api' + route, { method, headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
  }
  const details = { name: 'Amina', email: ' Amina@example.com ', password: 'flowers123' };
  try {
    await start();
    const malformed = await fetch(base + '/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
    assert.equal(malformed.status, 400);
    assert.deepEqual(await malformed.json(), { message: 'Invalid JSON.' });
    const oversized = await request('/auth/signup', 'POST', { padding: 'x'.repeat(17000) });
    assert.equal(oversized.status, 413);
    assert.equal(oversized.data.message, 'Request is too large.');
    assert.equal((await request('/health')).data.status, 'ok');
    assert.equal((await request('/orders')).status, 401);
    assert.equal((await request('/flowers')).data.length, 10);
    assert.equal((await request('/auth/signup', 'POST', { ...details, password: 'short' })).status, 400);
    const signup = await request('/auth/signup', 'POST', details);
    assert.equal(signup.status, 201);
    assert.equal(signup.data.name, 'Amina');
    assert.equal(signup.data.role, 'customer');
    const cookie = signup.cookie;
    assert.equal((await request('/auth/signup', 'POST', details)).status, 409);
    assert.equal((await request('/auth/login', 'POST', { ...details, password: 'wrong-password' })).status, 401);
    assert.equal((await request('/auth/me', 'GET', undefined, cookie)).status, 200);
    assert.equal((await request('/wishlist', 'PUT', { ids: ['unknown'] }, cookie)).status, 400);
    assert.deepEqual((await request('/wishlist', 'PUT', { ids: ['m1'] }, cookie)).data, ['m1']);
    assert.equal((await request('/orders', 'POST', { shipping: 'express', items: [{ flowerId: 'm1', quantity: -1 }] }, cookie)).status, 400);
    const order = await request('/orders', 'POST', { shipping: 'express', total: 0, items: [{ flowerId: 'm1', quantity: 2, price: 0 }] }, cookie);
    assert.equal(order.status, 201);
    assert.equal(order.data.total, 55.97);
    const other = await request('/auth/signup', 'POST', { ...details, email: 'other@example.com' });
    assert.deepEqual((await request('/orders', 'GET', undefined, other.cookie)).data, []);
    assert.deepEqual((await request('/wishlist', 'GET', undefined, other.cookie)).data, []);
    await new Promise(resolve => server.close(resolve));
    await start();
    assert.deepEqual((await request('/wishlist', 'GET', undefined, cookie)).data, ['m1']);
    assert.equal((await request('/orders', 'GET', undefined, cookie)).data[0].id, order.data.id);
    await request('/auth/logout', 'POST', {}, cookie);
    assert.equal((await request('/auth/me', 'GET', undefined, cookie)).status, 401);
    assert.equal((await request('/auth/login', 'POST', details)).status, 200);
    const crossOrigin = await fetch(base + '/api/auth/logout', { method: 'POST', headers: { Origin: 'https://example.org' } });
    assert.equal(crossOrigin.status, 403);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    rmSync(dir, { recursive: true, force: true });
  }
});

test('admin product management and isolated, idempotent M-Pesa simulation', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'maua-admin-'));
  const app = createApp({ dataFile: path.join(dir, 'store.json'), adminEmail: 'admin@example.com', adminPassword: 'admin-test-password' });
  const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  async function request(route, method = 'GET', body, cookie) {
    const res = await fetch(base + route, { method, headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: res.status, data: await res.json(), cookie: res.headers.get('set-cookie')?.split(';')[0] };
  }
  try {
    const admin = (await request('/auth/login', 'POST', { email: 'admin@example.com', password: 'admin-test-password' })).cookie;
    const customer = (await request('/auth/signup', 'POST', { name: 'Amina', email: 'amina@example.com', password: 'flowers123' })).cookie;
    assert.equal((await request('/admin/database', 'GET', undefined, customer)).status, 403);
    const product = { name: 'Test bouquet', description: 'Fresh flowers', image: '/assets/rose.jpeg', price: 1500 };
    assert.equal((await request('/admin/flowers', 'POST', product, customer)).status, 403);
    assert.equal((await request('/admin/flowers', 'POST', { ...product, image: 'javascript:bad' }, admin)).status, 400);
    const created = await request('/admin/flowers', 'POST', product, admin);
    assert.equal(created.status, 201);
    const id = created.data.id;
    assert.equal((await request(`/admin/flowers/${id}`, 'PATCH', { name: 'Updated bouquet', price: 1200 }, admin)).data.name, 'Updated bouquet');
    const order = (await request('/orders', 'POST', { shipping: 'standard', items: [{ flowerId: id, quantity: 2 }] }, customer)).data;
    assert.equal(order.total, 2404.99);
    assert.equal((await request('/payments/mpesa', 'POST', { orderId: order.id, phone: 'invalid' }, customer)).status, 400);
    const payment = (await request('/payments/mpesa', 'POST', { orderId: order.id, phone: '0712345678' }, customer)).data;
    assert.equal(payment.phone, '254712345678');
    assert.equal((await request(`/payments/mpesa/${payment.id}/simulate`, 'POST', { outcome: 'approved' }, admin)).status, 404);
    const confirmed = await request(`/payments/mpesa/${payment.id}/simulate`, 'POST', { outcome: 'approved' }, customer);
    assert.equal(confirmed.data.order.status, 'confirmed');
    assert.match(confirmed.data.payment.receipt, /^SIM/);
    await request(`/payments/mpesa/${payment.id}/simulate`, 'POST', { outcome: 'approved' }, customer);
    assert.equal((await request('/notifications', 'GET', undefined, customer)).data.length, 1);
    assert.equal((await request(`/payments/mpesa/${payment.id}/simulate`, 'POST', { outcome: 'failed' }, customer)).status, 409);
    assert.equal((await request(`/admin/flowers/${id}`, 'DELETE', undefined, admin)).status, 200);
    assert.equal((await request('/flowers')).data.some(f => f.id === id), false);
    assert.equal((await request('/orders', 'GET', undefined, customer)).data[0].items[0].flower.name, 'Updated bouquet');
    assert.equal((await request(`/admin/orders/${order.id}`, 'PATCH', { status: 'delivered' }, admin)).status, 409);
    assert.equal((await request(`/admin/orders/${order.id}`, 'PATCH', { status: 'preparing' }, admin)).status, 200);
    const database = (await request('/admin/database', 'GET', undefined, admin)).data;
    assert.ok(database.audit.length >= 4);
    assert.equal(JSON.stringify(database).includes('tokenHash'), false);
    assert.equal(database.users.some(u => u.hash || u.salt), false);
  } finally {
    await new Promise(resolve => server.close(resolve));
    rmSync(dir, { recursive: true, force: true });
  }
});
