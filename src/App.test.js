import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import { authenticate } from './lib/auth';
jest.mock('./lib/auth', () => ({
  readSession: () => JSON.parse(global.localStorage.getItem('maua.session.v1')),
  clearSession: () => global.localStorage.removeItem('maua.session.v1'),
  authenticate: jest.fn(),
}));
jest.mock('./lib/api', () => ({
  api: async (path, options = {}) => {
    if (path === '/flowers') return require('./catalog.json');
    if (path === '/payments/mpesa') return { id: 'payment-test', amount: 50.97, phone: '254712345678', status: 'pending' };
    if (path === '/payments/mpesa/payment-test/simulate') return { payment: { status: 'approved', receipt: 'SIMTEST' } };
    const user = JSON.parse(global.localStorage.getItem('maua.session.v1'));
    const key = `test-api:${user?.email}:${path}`;
    if (path === '/wishlist') {
      if (options.method === 'PUT') global.localStorage.setItem(key, JSON.stringify(JSON.parse(options.body).ids));
      return JSON.parse(global.localStorage.getItem(key) || '[]');
    }
    if (path === '/orders') {
      const orders = JSON.parse(global.localStorage.getItem(key) || '[]');
      if (options.method === 'POST') {
        const { flowers } = require('./flowers');
        const body = JSON.parse(options.body);
        const items = body.items.map(i => ({ flower: flowers.find(f => f.id === i.flowerId), quantity: i.quantity }));
        const delivery = body.shipping === 'express' ? 9.99 : 4.99;
        const order = { id: 'order-test', date: new Date().toISOString(), items, shipping: body.shipping, delivery, total: Math.round((items.reduce((sum, i) => sum + Number(i.flower.price) * i.quantity, 0) + delivery) * 100) / 100 };
        global.localStorage.setItem(key, JSON.stringify([order, ...orders]));
        return order;
      }
      return orders;
    }
  },
}));
beforeEach(() => {
  localStorage.clear(); jest.clearAllMocks();
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
test('signup validates inputs and passes the account to the dashboard', async () => {
  authenticate.mockResolvedValue({ name: 'Amina', email: 'amina@example.com' });
  render(<App />);
  await waitFor(() => expect(screen.queryByText('Loading your account…')).not.toBeInTheDocument());
  await waitFor(() => expect(screen.queryByText('Loading your wishlist and orders…')).not.toBeInTheDocument());
  fireEvent.click(screen.getByText('Sign up'));
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Enter a name');
  fireEvent.click(screen.getByRole('button', { name: 'Close error message' }));
  fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Amina' } });
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'amina@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'flowers123' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
  expect(await screen.findByText('Hi, Amina')).toBeInTheDocument();
  expect(authenticate).toHaveBeenCalledWith({ name: 'Amina', email: 'amina@example.com', password: 'flowers123' }, true);
});
test('login errors close with the close button, outside click, or Escape and preserve inputs', async () => {
  render(<App />);
  await waitFor(() => expect(screen.queryByText('Loading your account…')).not.toBeInTheDocument());
  await waitFor(() => expect(screen.queryByText('Loading your wishlist and orders…')).not.toBeInTheDocument());
  const email = screen.getByLabelText('Email address');
  fireEvent.change(email, { target: { value: 'invalid-email' } });
  const submit = screen.getByRole('button', { name: 'Log in' });
  submit.focus();
  fireEvent.click(submit);
  let modal = screen.getByRole('dialog', { name: 'Please check your details' });
  expect(modal).toHaveAttribute('aria-describedby', 'error-message');
  expect(document.body.style.overflow).toBe('hidden');
  fireEvent.click(screen.getByRole('alert'));
  expect(modal).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Close error message' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(submit).toHaveFocus();
  expect(document.body.style.overflow).toBe('');
  fireEvent.click(submit);
  fireEvent.click(screen.getByRole('dialog'));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.click(submit);
  modal = screen.getByRole('dialog');
  fireEvent(modal, new Event('cancel', { bubbles: false, cancelable: true }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(email).toHaveValue('invalid-email');
});
test('restores a profile, filters search, and logs out through the profile menu', async () => {
  localStorage.setItem('maua.session.v1', JSON.stringify({ name: 'Amina', email: 'amina@example.com' }));
  render(<App />);
  await waitFor(() => expect(screen.queryByText('Loading your account…')).not.toBeInTheDocument());
  await waitFor(() => expect(screen.queryByText('Loading your wishlist and orders…')).not.toBeInTheDocument());
  expect(screen.getByText('Hi, Amina')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'rose' } });
  expect(screen.getAllByRole('article')).toHaveLength(1);
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'xyz123' } });
  expect(screen.getByText('No bouquets found')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Profile menu' }));
  fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
  expect(await screen.findByText('Welcome back!')).toBeInTheDocument();
  expect(localStorage.getItem('maua.session.v1')).toBeNull();
});
test('checkout calculates quantity and delivery and rejects invalid quantities', async () => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  localStorage.setItem('maua.session.v1', JSON.stringify({ name: 'Amina', email: 'amina@example.com' }));
  render(<App />);
  await waitFor(() => expect(screen.queryByText('Loading your account…')).not.toBeInTheDocument());
  await waitFor(() => expect(screen.queryByText('Loading your wishlist and orders…')).not.toBeInTheDocument());
  fireEvent.click(screen.getAllByRole('button', { name: /Add to bag/ })[0]);
  fireEvent.click(screen.getByRole('button', { name: 'Cart (1 items)' }));
  expect(screen.getByText('KES 27.98')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Dahlia quantity'), { target: { value: '-1' } });
  expect(screen.getByRole('alert')).toHaveTextContent('whole number');
  fireEvent.change(screen.getByLabelText('Dahlia quantity'), { target: { value: '2' } });
  fireEvent.change(screen.getByLabelText('Delivery'), { target: { value: 'express' } });
  expect(screen.getByText('KES 55.97')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
  expect(screen.getByRole('button', { name: 'Simulate M-Pesa payment' })).toBeDisabled();
});
test('filters by feeling and opens a bouquet detail view with a working add button', async () => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  localStorage.setItem('maua.session.v1', JSON.stringify({ name: 'Amina', email: 'amina@example.com' }));
  render(<App />);
  await waitFor(() => expect(screen.queryByText('Loading your account…')).not.toBeInTheDocument());
  await waitFor(() => expect(screen.queryByText('Loading your wishlist and orders…')).not.toBeInTheDocument());
  fireEvent.click(screen.getByText('Romantic'));
  expect(screen.getAllByRole('article')).toHaveLength(3);
  fireEvent.click(screen.getByRole('button', { name: 'View Rose bouquet' }));
  expect(screen.getByRole('dialog')).toHaveAccessibleName('Rose');
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Add to bag', exact: true }));
  expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Added ✓' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Back to bouquets' }));
  expect(screen.getByRole('button', { name: 'Cart (1 items)' })).toBeInTheDocument();
  fireEvent.click(screen.getByText('See all'));
  expect(screen.getAllByRole('article')).toHaveLength(10);
});
test('offers signup for an account missing from this browser and keeps the email', async () => {
  authenticate.mockRejectedValue(Object.assign(new Error('No account with this email is saved in this browser.'), { code: 'ACCOUNT_NOT_FOUND' }));
  render(<App />);
  await waitFor(() => expect(screen.queryByText('Loading your account…')).not.toBeInTheDocument());
  await waitFor(() => expect(screen.queryByText('Loading your wishlist and orders…')).not.toBeInTheDocument());
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'new@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'flowers123' } });
  fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Create an account with this email' }));
  expect(screen.getByLabelText('Your name')).toBeInTheDocument();
  expect(screen.getByLabelText('Email address')).toHaveValue('new@example.com');
  expect(screen.getByLabelText('Password')).toHaveValue('');
});
test('hearts save a wishlist across reloads and can remove a saved bouquet', async () => {
  localStorage.setItem('maua.session.v1', JSON.stringify({ name: 'Amina', email: 'amina@example.com' }));
  const app = render(<App />);
  await screen.findByText('Hi, Amina');
  await waitFor(() => expect(screen.queryByText('Loading your wishlist and orders…')).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: 'Save Dahlia to wishlist' }));
  expect(await screen.findByRole('button', { name: 'Remove Dahlia from wishlist' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Wishlist', exact: true }));
  expect(screen.getAllByRole('article')).toHaveLength(1);
  app.unmount();
  render(<App />);
  await waitFor(() => expect(screen.queryByText('Loading your account…')).not.toBeInTheDocument());
  await waitFor(() => expect(screen.queryByText('Loading your wishlist and orders…')).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: 'Wishlist', exact: true }));
  expect(screen.getAllByRole('article')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Remove Dahlia from wishlist' }));
  expect(await screen.findByText('Your wishlist is waiting to bloom')).toBeInTheDocument();
});
test('add feedback updates cart count, and checkout saves history across reloads', async () => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  Object.defineProperty(global, 'crypto', { configurable: true, value: { randomUUID: () => 'order-test-id' } });
  localStorage.setItem('maua.session.v1', JSON.stringify({ name: 'Amina', email: 'amina@example.com' }));
  const app = render(<App />);
  await screen.findByText('Hi, Amina');
  await waitFor(() => expect(screen.queryByText('Loading your wishlist and orders…')).not.toBeInTheDocument());
  const card = within(screen.getAllByRole('article')[0]);
  fireEvent.click(card.getByRole('button', { name: 'Add to bag' }));
  expect(card.getByRole('button', { name: 'Added ✓' })).toHaveClass('is-added');
  fireEvent.click(card.getByRole('button', { name: 'Added ✓' }));
  expect(screen.getByRole('button', { name: 'Cart (2 items)' })).toHaveTextContent('2');
  fireEvent.click(screen.getByRole('button', { name: 'Cart (2 items)' }));
  fireEvent.change(screen.getByLabelText('Kenyan mobile number'), { target: { value: '0712345678' } });
  fireEvent.click(screen.getByRole('button', { name: 'Simulate M-Pesa payment' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Approve payment' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Cart (0 items)' })).toHaveTextContent('0'));
  fireEvent.click(screen.getByRole('button', { name: 'Close shopping bag' }));
  fireEvent.click(screen.getByRole('button', { name: 'History' }));
  expect(screen.getByText('Dahlia × 2')).toBeInTheDocument();
  expect(screen.getByText('Total KES 50.97')).toBeInTheDocument();
  app.unmount();
  render(<App />);
  await waitFor(() => expect(screen.queryByText('Loading your account…')).not.toBeInTheDocument());
  await waitFor(() => expect(screen.queryByText('Loading your wishlist and orders…')).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: 'History' }));
  expect(screen.getByText('Dahlia × 2')).toBeInTheDocument();
});
test('wishlist and history are private to each local account', async () => {
  localStorage.setItem('maua.wishlist.v1:other@example.com', JSON.stringify(['m1']));
  localStorage.setItem('maua.session.v1', JSON.stringify({ name: 'Amina', email: 'amina@example.com' }));
  render(<App />);
  await waitFor(() => expect(screen.queryByText('Loading your account…')).not.toBeInTheDocument());
  await waitFor(() => expect(screen.queryByText('Loading your wishlist and orders…')).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: 'Wishlist', exact: true }));
  expect(await screen.findByText('Your wishlist is waiting to bloom')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'History' }));
  expect(screen.getByText('No orders yet')).toBeInTheDocument();
});
test('storefront shows categories and three distinct shoppable collections', async () => {
  localStorage.setItem('maua.session.v1', JSON.stringify({ name: 'Amina', email: 'amina@example.com' }));
  render(<App />);
  await waitFor(() => expect(screen.queryByText('Loading your account…')).not.toBeInTheDocument());
  await waitFor(() => expect(screen.queryByText('Loading your wishlist and orders…')).not.toBeInTheDocument());
  expect(screen.getByRole('heading', { name: 'Shop by category' })).toBeInTheDocument();
  const best = screen.getByRole('region', { name: 'Best sellers' });
  const sale = screen.getByRole('region', { name: 'On sale' });
  const arrivals = screen.getByRole('region', { name: 'New arrivals' });
  expect(within(best).getAllByRole('article')).toHaveLength(4);
  expect(within(sale).getAllByRole('article')).toHaveLength(3);
  expect(within(arrivals).getAllByRole('article')).toHaveLength(3);
  expect(within(sale).getByText('KES 20.00').tagName).toBe('DEL');
  expect(screen.getByRole('link', { name: 'New arrivals' })).toHaveAttribute('href', '#new-arrivals');
  fireEvent.click(screen.getByRole('button', { name: 'Elegant' }));
  expect(screen.getAllByRole('article')).toHaveLength(3);
  expect(screen.queryByRole('region', { name: 'Best sellers' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'See all' }));
  expect(screen.getByRole('region', { name: 'Best sellers' })).toBeInTheDocument();
});
test('sale bouquet uses its displayed discounted price in checkout', async () => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  localStorage.setItem('maua.session.v1', JSON.stringify({ name: 'Amina', email: 'amina@example.com' }));
  render(<App />);
  await waitFor(() => expect(screen.queryByText('Loading your account…')).not.toBeInTheDocument());
  await waitFor(() => expect(screen.queryByText('Loading your wishlist and orders…')).not.toBeInTheDocument());
  const sale = within(screen.getByRole('region', { name: 'On sale' }));
  const gerbera = within(sale.getAllByRole('article')[0]);
  expect(gerbera.getByText('KES 16.50')).toBeInTheDocument();
  fireEvent.click(gerbera.getByRole('button', { name: 'Add to bag' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cart (1 items)' }));
  const cart = within(screen.getByRole('dialog'));
  expect(cart.getByText('KES 16.50 each')).toBeInTheDocument();
  expect(cart.getByText('KES 21.49')).toBeInTheDocument();
});
