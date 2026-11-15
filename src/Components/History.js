import React from 'react';

export default function History({ orders, search, onShop }) {
  const results = orders.filter(order => order.items.some(item =>
    item.flower.name.toLowerCase().includes(search.trim().toLowerCase())
  ));
  return <section className="history-view">
    <h2>Order history</h2>
    <p className="history-note">Your completed demo checkouts. No payments were taken or orders sent.</p>
    {!orders.length && <div className="empty-state">
      <h3>No orders yet</h3><p>Complete a demo checkout to see it here.</p>
      <button className="text-button" onClick={onShop}>Explore bouquets</button>
    </div>}
    {orders.length > 0 && !results.length && <p className="empty-state">No matching orders found.</p>}
    {results.map(order => <article className="history-card" key={order.id}>
      <header><h3>{order.status?.replaceAll('_', ' ')}</h3><time dateTime={order.date}>{new Date(order.date).toLocaleString()}</time></header>
      {order.payment && <p>Simulated M-Pesa receipt: {order.payment.receipt}</p>}
      {order.items.map(item => <div className="history-item" key={item.flower.id}>
        <img src={item.flower.image} alt="" /><span>{item.flower.name} × {item.quantity}</span>
        <strong>KES {(Number(item.flower.price) * item.quantity).toFixed(2)}</strong>
      </div>)}
      <footer><span>{order.shipping === 'express' ? 'Express' : 'Standard'} delivery · KES {order.delivery.toFixed(2)}</span><strong>Total KES {order.total.toFixed(2)}</strong></footer>
    </article>)}
  </section>;
}
