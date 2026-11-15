import React from 'react';
import './Loader.css';

export default function Loader({ label = 'Loading…', fullPage = false, inline = false }) {
  const Tag = inline ? 'span' : 'div';
  return <Tag className={`app-loader${fullPage ? ' app-loader-page' : ''}${inline ? ' app-loader-inline' : ''}`} role="status" aria-live="polite">
    <span className="app-spinner" aria-hidden="true" />
    <span>{label}</span>
  </Tag>;
}
