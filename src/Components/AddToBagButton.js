import React, { useEffect, useRef, useState } from 'react';

export default function AddToBagButton({ onAdd, className = '' }) {
  const [added, setAdded] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  function add() {
    onAdd();
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1500);
  }
  return <button className={`add-to-bag ${added ? 'is-added' : ''} ${className}`} onClick={add}>
    {added ? 'Added ✓' : <>Add to bag <span aria-hidden="true">+</span></>}
  </button>;
}
