import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
const tabs = ['orders', 'users', 'flowers', 'payments', 'notifications', 'sessions', 'audit'];
const transitions = { awaiting_payment: ['cancelled'], confirmed: ['preparing', 'cancelled'], preparing: ['delivered', 'cancelled'] };
export default function Admin() {
  const [database, setDatabase] = useState(null);
  const [tab, setTab] = useState('orders');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  async function load() { setDatabase(await api('/admin/database')); }
  useEffect(() => {
    let active = true;
    api('/admin/database').then(data => { if (active) setDatabase(data); }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);
  async function update(path, body, method = 'PATCH') {
    setBusy(true); setError('');
    try { await api(`/admin/${path}`, { method, body: JSON.stringify(body) }); await load(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  function exportRecords() {
    const link = document.createElement('a');
    const url = URL.createObjectURL(new Blob([JSON.stringify(database, null, 2)], { type: 'application/json' }));
    link.href = url; link.download = 'maua-database.json'; link.click(); URL.revokeObjectURL(url);
  }
  const rows = (database?.[tab] || []).filter(row => JSON.stringify(row).toLowerCase().includes(search.toLowerCase()));
  return <main className="admin-page home"><p className="eyebrow">MAUA OPERATIONS</p><h1>Admin dashboard</h1><p>Manage the shop and browse database records. Credentials and session tokens are excluded.</p>
    {error && <p className="error" role="alert">{error}</p>}
    {!database && !error && <p role="status">Loading dashboard…</p>}
    {database && <>
      <div className="admin-metrics">{[['Customers & admins', database.summary.users], ['Orders', database.summary.orders], ['Payment approvals', database.summary.confirmed], ['Simulated sales', `KES ${database.summary.revenue.toFixed(2)}`]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      <div className="admin-toolbar"><button onClick={async () => { setError(''); try { await load(); } catch (err) { setError(err.message); } }}>Refresh records</button><button onClick={exportRecords}>Download database JSON</button><label>Filter records<input type="search" value={search} onChange={e => setSearch(e.target.value)} /></label></div>
      <nav className="admin-tabs" aria-label="Database tables">{tabs.map(name => <button key={name} aria-pressed={tab === name} onClick={() => { setTab(name); setSearch(''); }}>{name} ({database[name].length})</button>)}</nav>
      {tab === 'flowers' && <ProductForm busy={busy} onSave={body => update('flowers', body, 'POST')} />}
      <h2>{tab.charAt(0).toUpperCase() + tab.slice(1)}</h2><p>{rows.length} matching records</p>
      <div className="admin-records">{rows.map((row, index) => <article key={row.id || index} className="admin-record">
        <h3>{row.name || row.subject || row.id || row.userId}</h3>
        {tab === 'orders' && <><p>{row.status.replaceAll('_', ' ')} · KES {row.total.toFixed(2)}</p><label>Update order status<select aria-label={`Status for order ${row.id}`} disabled={busy} value="" onChange={e => { if (e.target.value) update(`orders/${row.id}`, { status: e.target.value }); }}><option value="">Choose next status</option>{(transitions[row.status] || []).map(status => <option key={status} value={status}>{status}</option>)}</select></label></>}
        {tab === 'users' && <label>Account role<select aria-label={`Role for ${row.email}`} value={row.role} disabled={busy} onChange={e => update(`users/${row.id}/role`, { role: e.target.value })}><option value="customer">Customer</option><option value="admin">Admin</option></select></label>}
        {tab === 'flowers' && <><ProductForm key={JSON.stringify(row)} flower={row} busy={busy} onSave={body => update(`flowers/${row.id}`, body)} /><button disabled={busy} onClick={() => { if (window.confirm(`Delete ${row.name}? Existing order records will be preserved.`)) update(`flowers/${row.id}`, undefined, 'DELETE'); }}>Delete product</button></>}
        {tab === 'sessions' && <button disabled={busy} onClick={() => update(`sessions/${row.userId}`, undefined, 'DELETE')}>Revoke user sessions</button>}
        <details><summary>View record</summary><pre>{JSON.stringify(row, null, 2)}</pre></details>
      </article>)}</div>
    </>}
  </main>;
}

function ProductForm({ flower, busy, onSave }) {
  return <form className="product-form" onSubmit={e => {
    e.preventDefault(); const data = new FormData(e.currentTarget);
    const body = Object.fromEntries(['name', 'description', 'image', 'family', 'origin', 'symbols'].map(key => [key, data.get(key)]));
    body.price = Number(data.get('price'));
    ['active', 'bestSeller', 'newArrival'].forEach(key => { body[key] = data.get(key) === 'on'; });
    onSave(body);
  }}><h3>{flower ? 'Edit product' : 'Add product'}</h3>
    {['name', 'description', 'image', 'family', 'origin', 'symbols'].map(key => <label key={key}>{key}<input name={key} defaultValue={flower?.[key] || ''} required={['name', 'description', 'image'].includes(key)} maxLength="2000" placeholder={key === 'image' ? '/assets/rose.jpeg or https://…' : ''} /></label>)}
    <label>Price (KES)<input name="price" type="number" min="0.01" max="1000000" step="0.01" defaultValue={flower?.price} required /></label>
    {['active', 'bestSeller', 'newArrival'].map(key => <label key={key}><input type="checkbox" name={key} defaultChecked={key === 'active' ? flower?.active !== false : !!flower?.[key]} />{key}</label>)}
    <button disabled={busy}>{flower ? 'Save product' : 'Add product'}</button>
  </form>;
}
