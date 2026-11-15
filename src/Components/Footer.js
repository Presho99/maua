import React from 'react';
export default function Footer() {
  return <footer className="site-footer">
    <div><a className="brand" href="/">Maua</a><p>Flowers with feeling. A little beauty for every day.</p></div>
    <div><strong>Thoughtfully gathered</strong><p>Romantic, cheerful and elegant bouquets.</p><small>© {new Date().getFullYear()} Maua</small></div>
    <div><strong>A safe space to try</strong><p>M-Pesa and email notifications are simulated.<br />No money is charged and no emails are sent.</p></div>
  </footer>;
}
