import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { useCartContext } from '../App';
import Cart from './Cart';
import AddToBagButton from './AddToBagButton';
import HeartButton from './HeartButton';
import History from './History';
import './Home.css';

const categories = [
  { name: 'All flowers', image: '/assets/peonies.jpeg', ids: null },
  { name: 'Romantic', image: '/assets/rose.jpeg', ids: ['m4', 'm5', 'm8'] },
  { name: 'Cheerful', image: '/assets/Sunflower.jpeg', ids: ['m1', 'm2', 'm6', 'm7'] },
  { name: 'Elegant', image: '/assets/orchids.jpeg', ids: ['m3', 'm9', 'm10'] },
];

function BouquetDetails({ flower, onClose, onAdd }) {
  const { wishlist, toggleWishlist } = useCartContext();
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const modal = dialog.current;
    modal.showModal();
    return () => { modal.close(); previous?.focus(); };
  }, []);
  return <dialog ref={dialog} className="bouquet-details" aria-labelledby="bouquet-title" onCancel={onClose} onClick={e => { if (e.target === dialog.current) onClose(); }}>
    <div className="detail-photo"><img src={flower.image} alt={`${flower.name} bouquet`} /><button className="detail-back" onClick={onClose} aria-label="Back to bouquets">←</button><HeartButton flower={flower} liked={wishlist.includes(flower.id)} onToggle={toggleWishlist} /></div>
    <div className="detail-copy"><p className="eyebrow">THOUGHTFULLY GATHERED</p><h2 id="bouquet-title">{flower.name}</h2><BouquetPrice flower={flower} /><p>{flower.description}</p><div className="detail-note">A beautiful gesture, for someone you love.</div><AddToBagButton className="primary" onAdd={() => onAdd(flower)} /></div>
  </dialog>;
}

function BouquetPrice({ flower }) {
  return <span className="bouquet-price">
    <strong>KES {Number(flower.price).toFixed(2)}</strong>
    {flower.originalPrice && <><span className="sr-only">Original price </span><del>KES {Number(flower.originalPrice).toFixed(2)}</del></>}
  </span>;
}

function BouquetCard({ flower, onSelect, onAdd }) {
  const { wishlist, toggleWishlist } = useCartContext();
  const badge = flower.originalPrice ? 'On sale' : flower.newArrival ? 'New arrival' : flower.bestSeller ? 'Best seller' : null;
  return <article className="bouquet-card">
    <div className="bouquet-image">
      <button className="bouquet-photo" aria-label={`View ${flower.name} bouquet`} onClick={() => onSelect(flower)}><img src={flower.image} alt={`${flower.name} bouquet`} loading="lazy" /></button>
      {badge && <span className={`product-badge ${flower.originalPrice ? 'sale-badge' : ''}`}>{badge}</span>}
      <HeartButton flower={flower} liked={wishlist.includes(flower.id)} onToggle={toggleWishlist} />
    </div>
    <div><h3>{flower.name}</h3><p>{flower.description}</p><footer><BouquetPrice flower={flower} /><AddToBagButton onAdd={() => onAdd(flower)} /></footer></div>
  </article>;
}

const collections = [
  { id: 'best-sellers', title: 'Best sellers', description: 'Our signature picks for a beautiful gesture.', includes: flower => flower.bestSeller },
  { id: 'on-sale', title: 'On sale', description: 'A little more beauty for a little less.', includes: flower => flower.originalPrice },
  { id: 'new-arrivals', title: 'New arrivals', description: 'Fresh additions to fall in love with.', includes: flower => flower.newArrival || (!flower.bestSeller && !flower.originalPrice) },
];

export default function Home({ user, search, view, onViewChange, cartIsShown, hideCartHandler }) {
  const { setItems, wishlist, history } = useCartContext();
  const [flowers, setFlowers] = useState([]);
  useEffect(() => { let active = true; api('/flowers').then(data => { if (active) setFlowers(data); }).catch(err => { if (active) setNotice(err.message); }); return () => { active = false; }; }, [view]);
  const [notice, setNotice] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [selected, setSelected] = useState(null);
  const collection = useRef(null);
  const results = flowers.filter(f => (view !== 'wishlist' || wishlist.includes(f.id)) && (view === 'wishlist' || !category.ids || category.ids.includes(f.id)) && `${f.name} ${f.description} ${f.symbols}`.toLowerCase().includes(search.trim().toLowerCase()));
  const showCollections = view === 'shop' && !search.trim() && !category.ids;
  function add(flower) {
    setItems(items => items.some(i => i.flower.id === flower.id) ? items.map(i => i.flower.id === flower.id ? { ...i, quantity: Math.min(99, i.quantity + 1) } : i) : [...items, { flower, quantity: 1 }]);
    setNotice(`${flower.name} added to your bag.`);
  }
  return <main className="home">
    {cartIsShown && <Cart hideCartHandler={hideCartHandler} />}
    {selected && <BouquetDetails flower={selected} onClose={() => setSelected(null)} onAdd={add} />}
    <section className="shop-intro"><p className="eyebrow">FRESH FLOWERS, THOUGHTFULLY CHOSEN</p><h1>Hi, {user.name}</h1><p>Find a bouquet that says it beautifully.</p></section>
    {view === 'shop' && <section className="shop-discovery" aria-label="Discover our flowers">
      <div className="collection-banner"><div><p>NEW COLLECTION</p><h2>Little blooms.<br />Big feelings.</h2><button onClick={() => { setCategory(categories[0]); collection.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>Shop bouquets <span aria-hidden="true">↗</span></button></div><img src="/assets/hydrangea.jpeg" alt="Soft hydrangea blooms" /></div>
      <div className="category-heading"><div><p className="eyebrow">FIND YOUR PERFECT GESTURE</p><h2>Shop by category</h2></div><button onClick={() => setCategory(categories[0])}>See all</button></div>
      <div className="flower-categories">{categories.map(c => <button key={c.name} aria-pressed={category.name === c.name} onClick={() => setCategory(c)}><span><img src={c.image} alt="" /></span>{c.name}</button>)}</div>
    </section>}
    {view === 'history' ? <History orders={history} search={search} onShop={() => onViewChange('shop')} /> : <>
    <div ref={collection} className="store-collections">
      <p className="bag-notice" role="status">{notice}</p>
      {showCollections ? <>
        <nav className="collection-links" aria-label="Bouquet collections">{collections.map(group => <a href={`#${group.id}`} key={group.id}>{group.title}<span aria-hidden="true"> ↗</span></a>)}</nav>
        {collections.map(group => <section className="product-section" id={group.id} key={group.id} aria-labelledby={`${group.id}-title`}>
          <div className="collection-heading"><div><h2 id={`${group.id}-title`}>{group.title}</h2><p>{group.description}</p></div><span>{flowers.filter(group.includes).length} bouquets</span></div>
          <div className="bouquet-grid">{flowers.filter(group.includes).map(flower => <BouquetCard key={flower.id} flower={flower} onSelect={setSelected} onAdd={add} />)}</div>
        </section>)}
      </> : <>
        <div className="collection-heading"><h2>{view === 'wishlist' ? 'Your wishlist' : search.trim() ? 'Search results' : category.name + ' bouquets'}</h2><span>{results.length} bouquets</span></div>
        {results.length ? <div className="bouquet-grid">{results.map(flower => <BouquetCard key={flower.id} flower={flower} onSelect={setSelected} onAdd={add} />)}</div> : <div className="empty-state"><h2>{view === 'wishlist' && !search.trim() ? 'Your wishlist is waiting to bloom' : 'No bouquets found'}</h2><p>{view === 'wishlist' && !search.trim() ? 'Tap the heart on a bouquet to save it here.' : 'Try another category or a flower name such as rose, lily or tulips.'}</p></div>}
      </>}
    </div></>}

  </main>;
}
