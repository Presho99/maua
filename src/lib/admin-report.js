export const title = value => String(value || 'Unknown').replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
export const money = value => `KES ${Number(value || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const dateTime = value => value ? new Date(value).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
export const customerFor = (db, id) => db.users.find(user => user.id === id) || { name: 'Unknown customer', email: '—' };

export function orderActivity(db, order) {
  const customer = customerFor(db, order.userId);
  const events = [{ id: `order-${order.id}`, date: order.date, event: 'Order placed', detail: `${customer.name} ordered ${order.items.reduce((sum, item) => sum + item.quantity, 0)} bouquets.`, actor: customer.email, orderId: order.id }];
  db.payments.filter(payment => payment.orderId === order.id).forEach(payment => {
    events.push({ id: `${payment.id}-started`, date: payment.date, event: 'M-Pesa payment started', detail: `${money(payment.amount)} · ${payment.phone} · Simulation`, actor: customer.email, orderId: order.id });
    if (payment.completedAt) events.push({ id: `${payment.id}-completed`, date: payment.completedAt, event: `Payment ${payment.status}`, detail: payment.receipt ? `Simulated receipt: ${payment.receipt}` : 'Customer can retry an unsuccessful payment.', actor: customer.email, orderId: order.id });
  });
  db.notifications.filter(message => message.orderId === order.id).forEach(message => events.push({ id: message.id, date: message.date, event: 'Confirmation email preview created', detail: `To ${message.to} · Simulation, no email sent`, actor: 'Maua', orderId: order.id }));
  db.audit.filter(record => record.recordId === order.id).forEach(record => events.push({ id: record.id, date: record.date, event: record.action, detail: 'Updated by administrator', actor: record.actor, orderId: order.id }));
  return events.sort((a, b) => new Date(a.date) - new Date(b.date));
}

export function shopActivity(db) {
  const events = db.orders.flatMap(order => orderActivity(db, order));
  const orderIds = new Set(db.orders.map(order => order.id));
  db.audit.filter(record => !orderIds.has(record.recordId)).forEach(record => events.push({ id: record.id, date: record.date, event: record.action, detail: db.flowers.find(flower => flower.id === record.recordId)?.name || db.users.find(user => user.id === record.recordId)?.name || 'Shop administration', actor: record.actor, orderId: '' }));
  return events.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function reportSheets(db) {
  return [
    { name: 'Orders', headers: ['Order number', 'Placed at', 'Customer', 'Email', 'Status', 'Delivery', 'Delivery KES', 'Total KES', 'Receipt', 'Payment mode'], rows: db.orders.map(order => { const user = customerFor(db, order.userId); return [order.id, order.date, user.name, user.email, title(order.status), title(order.shipping), order.delivery, order.total, order.payment?.receipt || '', 'Simulation']; }) },
    { name: 'Order items', headers: ['Order number', 'Product', 'Quantity', 'Unit price KES', 'Line total KES'], rows: db.orders.flatMap(order => order.items.map(item => [order.id, item.flower.name, item.quantity, Number(item.flower.price), Number((item.quantity * Number(item.flower.price)).toFixed(2))])) },
    { name: 'Payments', headers: ['Payment number', 'Order number', 'Customer', 'Phone', 'Amount KES', 'Status', 'Started at', 'Completed at', 'Receipt', 'Mode'], rows: db.payments.map(payment => [payment.id, payment.orderId, customerFor(db, payment.userId).name, payment.phone, payment.amount, title(payment.status), payment.date, payment.completedAt || '', payment.receipt || '', 'Simulation']) },
    { name: 'Customers', headers: ['Name', 'Email', 'Role', 'Orders', 'Saved products'], rows: db.users.map(user => [user.name, user.email, title(user.role), db.orders.filter(order => order.userId === user.id).length, user.wishlist?.length || 0]) },
    { name: 'Products', headers: ['Product', 'Description', 'Price KES', 'Available', 'Best seller', 'New arrival', 'Image'], rows: db.flowers.map(flower => [flower.name, flower.description, Number(flower.price), flower.active !== false ? 'Yes' : 'No', flower.bestSeller ? 'Yes' : 'No', flower.newArrival ? 'Yes' : 'No', flower.image]) },
    { name: 'Email previews', headers: ['Order number', 'Date', 'Recipient', 'Subject', 'Message', 'Delivery'], rows: db.notifications.map(message => [message.orderId, message.date, message.to, message.subject, message.body, 'Preview only — not sent']) },
    { name: 'Activity', headers: ['Date', 'Event', 'Details', 'Person', 'Order number'], rows: shopActivity(db).map(event => [event.date, event.event, event.detail, event.actor, event.orderId]) },
  ];
}

export async function createWorkbook(db) {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Maua';
  workbook.created = new Date();
  reportSheets(db).forEach(({ name, headers, rows }) => {
    const sheet = workbook.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] });
    sheet.addRow(headers);
    // Strings remain literal cells, including user-entered values starting with = or +.
    rows.forEach(row => sheet.addRow(row.map(value => value ?? '')));
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF315C54' } };
    sheet.getRow(1).height = 26;
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, rows.length + 1), column: headers.length } };
    sheet.columns.forEach((column, index) => {
      column.width = Math.min(48, Math.max(18, headers[index].length + 4));
      column.alignment = { vertical: 'top', wrapText: true };
      if (headers[index].includes('KES')) column.numFmt = '#,##0.00';
    });
  });
  return workbook;
}

export async function downloadReport(db) {
  const workbook = await createWorkbook(db);
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `maua-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
