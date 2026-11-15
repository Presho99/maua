import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
export default function Notifications() {
  const [messages, setMessages] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api('/notifications').then(data => { if (active) setMessages(data); }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);
  return <main className="home"><h1>Email notifications</h1><p>Preview your simulated order confirmation emails. Nothing is sent to an external inbox.</p>
    {error && <p role="alert" className="error">{error}</p>}
    {!messages && !error && <p role="status">Loading notifications…</p>}
    {messages?.length === 0 && <p>No email previews yet. Approve a demo M-Pesa payment to receive one.</p>}
    {messages?.map(message => <article className="notification-card" key={message.id}><small>SIMULATED EMAIL · {new Date(message.date).toLocaleString()}</small><h2>{message.subject}</h2><p>To: {message.to}</p><p>{message.body}</p></article>)}
  </main>;
}
