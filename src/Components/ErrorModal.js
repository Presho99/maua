import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './ErrorModal.css';

export default function ErrorModal({ title = 'Please check your details', message, onClose, children }) {
  const dialog = useRef(null);
  const returnFocus = useRef(document.activeElement);
  useEffect(() => {
    const modal = dialog.current;
    const previousFocus = returnFocus.current;
    const previousOverflow = document.body.style.overflow;
    modal.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      modal.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  return createPortal(
    <dialog ref={dialog} className="error-dialog" aria-labelledby="error-title" aria-describedby="error-message"
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="error-dialog-card">
        <header><h2 id="error-title">{title}</h2><button type="button" className="error-dialog-close" aria-label="Close error message" onClick={onClose} autoFocus>×</button></header>
        <p id="error-message" role="alert">{message}</p>
        {children}
        <button type="button" className="primary" onClick={onClose}>Got it</button>
      </section>
    </dialog>, document.body
  );
}
