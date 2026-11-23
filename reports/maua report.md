# maua report

Application Review and Technical Report

Prepared: 17 November 2026

## 1. Executive summary

Maua is a web application for a flower shop. It combines an account-based storefront with product discovery, saved wishlists, a shopping bag, order history, simulated M-Pesa payments and an administrator dashboard. Its purpose is to demonstrate how customers can select bouquets and place orders while shop staff manage products and monitor fulfillment.

The application uses React for the interface, an Express API for business rules and authentication, and either a local JSON file or PostgreSQL for persistence. Deployment configuration is provided for hosting the frontend and API together on Vercel.

The current implementation provides substantial demonstration functionality, but requires corrective work before a successful production build. During this review, both backend integration tests passed, 13 of 14 frontend tests passed, and the production build failed because the Excel export code imports an undeclared and unavailable dependency, exceljs. Payments and email confirmations are explicitly simulated; the application does not transfer money or send email.

## 2. Purpose, scope and users

The application supports flower discovery and a complete demonstration ordering journey. Customers create an account, browse available bouquets, save favorites, select quantities and delivery, and simulate payment approval or failure. Administrators maintain the catalog, inspect shop records and progress orders through fulfillment.

The two principal roles are customers and administrators. Public signup creates customer accounts. The configured administrator is established through server environment variables. The interface requires login before showing the shopping experience, although the catalog API itself permits public access.

This report is based on the repository source, configuration, documentation and checks executed locally. It does not establish live deployment status, production database health, measured performance or results from a manual browser accessibility audit. No private customer database or environment secrets were used to prepare it.

## 3. Customer functionality

### Accounts and access

Customers can sign up, log in, restore an existing session and log out. Input validation checks names, email addresses and password length. The application loads the signed-in profile before displaying the shop, and reports account or network errors through the interface.

### Product discovery

The storefront presents bouquet images, descriptions and prices in Kenyan shillings. Customers can browse best sellers, sale items and new arrivals, or choose Romantic, Cheerful and Elegant categories. Search matches product names, descriptions and symbolism. A bouquet details dialog supports viewing an item, saving it to a wishlist and adding it to the bag.

Category membership currently uses predefined product IDs in the interface. New administrator-created products will therefore need a more flexible category model to participate reliably in the themed categories.

### Wishlist and shopping bag

Wishlists are saved against the customer account through the API. Bag contents are held in React state and are not persisted across a full reload. Customers can adjust quantities from 1 to 99, remove items and choose standard or express delivery. Current delivery charges are KES 4.99 and KES 9.99 respectively; these are implemented values and should be reviewed against the shop's intended pricing.

### Checkout and payment simulation

The server creates an order from product IDs and quantities, retrieving current catalog prices and calculating the total itself. It snapshots product details into each order so subsequent product edits or deletion do not erase the historical purchase record.

Customers enter a Kenyan mobile number and start a simulated M-Pesa payment. They can select approval, failure or cancellation. Approval generates a receipt beginning with SIM, confirms the order and creates an email preview. Failed or cancelled attempts can be retried. No real STK push, PIN collection, money transfer or email delivery takes place.

Repeated completion of the same simulated payment with the same outcome returns the existing result. A conflicting outcome is rejected. Customers can view their own order history and notification previews.

## 4. Administration and reporting

The administrator dashboard provides order counts, awaiting-payment counts, fulfillment workload and simulated sales totals. Its tabs cover orders, payments, customers and administrators, products, email previews, activity and sign-in sessions. Search, order-status filtering, manual refresh and periodic refresh help staff review records.

Administrators can create, edit and delete products; change pricing and availability; mark products as best sellers or new arrivals; change other users' roles; revoke sessions; and update order status. The server prevents an administrator from changing their own role or the configured administrator's role. Administrative mutations create audit records.

The order lifecycle is awaiting_payment → confirmed → preparing → delivered. Approved simulation advances an awaiting order to confirmed. Administrators can cancel awaiting, confirmed or preparing orders. Delivered and cancelled orders are terminal under the current transition rules. Cancellation does not represent a real refund workflow.

The reporting module is designed to produce an Excel workbook containing Orders, Order items, Payments, Customers, Products, Email previews and Activity sheets. It includes headings, filters, frozen header rows and currency formatting. This feature is currently blocked by the missing exceljs dependency, which also prevents the full frontend production build.

## 5. Technical architecture

The frontend uses React 18 and Create React App through react-scripts 5. App.js coordinates account restoration, navigation, wishlist state, orders and the shopping bag. Components implement the storefront, dialogs, authentication and administration. Shared API and authentication utilities connect the interface to the backend.

The backend uses Node.js and Express 4. server/index.js defines authentication, authorization, validation, order totals, simulated payment processing and administrator operations. server/store.js abstracts persistence. api/index.js exposes the server for Vercel, while vercel.json configures API rewrites and frontend hosting.

The main request path is: React interface → Express API → storage layer → JSON file or PostgreSQL. Business rules such as product availability, item quantity, payment ownership and order transitions are enforced on the server.

The repository recommends Node.js 22; this review ran with Node.js 20.19.5. The build failure observed was specifically an unresolved exceljs import, rather than evidence of a Node version incompatibility.

## 6. Data storage and integrity

The application maintains users, sessions, flowers, orders, payments, notifications, audit records and authentication attempts. User records contain authentication information and wishlists. Orders contain product snapshots, quantities, delivery charges, totals and fulfillment status. Payment and notification records connect back to the customer and order.

For local development without DATABASE_URL, records persist in server/data/store.json. Operations are serialized within the process, and writes use a temporary file followed by a rename. This design suits local use with a single application process.

With DATABASE_URL configured, PostgreSQL stores the collections together in one JSONB document in the maua_store table. Each storage operation starts a transaction, locks the shared row, runs the action, rewrites the document and commits. This also serializes ordinary reads through the same storage path. The approach simplifies consistency for a small demonstration, but a single shared row can become a bottleneck as data and concurrent traffic grow.

Vercel deployment requires PostgreSQL because the local JSON file cannot provide persistent serverless storage. For larger operation, separate relational tables, targeted queries, indexes and explicit retention policies would improve scalability and maintainability.

## 7. Security controls observed

Passwords are hashed with scrypt and individual salts. Newly created session tokens are random, and their SHA-256 hashes are stored. Session cookies use HttpOnly and SameSite=Strict, with Secure enabled when the backend is configured for production. Sessions expire after seven days and can be revoked.

API authorization separates public, signed-in and administrator routes. Customer order, payment and notification queries are scoped to the authenticated user. The server validates quantities, delivery options, product fields and mobile numbers; caps JSON requests at 16 KB; checks request origins when supplied; and limits authentication attempts by request IP within a one-minute window.

The administrator database response excludes password hashes, salts and session tokens. Audit records provide visibility into administrator changes. These are source-level observations and do not constitute a penetration test or a guarantee of production security. Deployment-specific proxy behavior, backup access and credential handling should be verified during release preparation.

## 8. Verification results

Checks were run on 17 November 2026 against the available working tree.

- Backend: npm run test:server passed both integration tests. Coverage includes account/session persistence, private wishlists, authoritative order totals, administrator product operations and isolated, idempotent payment simulation. The sandbox run initially failed; the rerun outside the sandbox passed.
- Frontend: CI=true npm test -- --watchAll=false --runInBand completed with 13 passing tests and 1 failing test across two suites. The failure occurs in the wishlist reload scenario: the test expects an article immediately after navigation while the catalog loading state is present. Async act warnings also appeared. The test and loading behavior require investigation before classifying this as a customer-facing defect.
- Production build: npm run build failed with “Can't resolve 'exceljs'” from src/lib/admin-report.js. The module is imported by the reporting implementation but is absent from package.json.
- Toolchain output also reported outdated browser compatibility data and an undeclared Babel plugin dependency associated with the existing build tooling.

Passing backend tests validate the exercised local storage paths. They do not independently validate a live PostgreSQL deployment, serverless concurrency, browser behavior or real external integrations.

## 9. Recommendations

1. Restore a clean build by declaring and installing the Excel workbook dependency, updating the lockfile and verifying export behavior and the production bundle.
2. Investigate the failing wishlist test and ensure assertions await asynchronous catalog loading. Confirm wishlist navigation and persistence manually in the browser.
3. Reconcile the README with the current dashboard, including its Excel export workflow. Review bouquet and delivery prices for the intended KES market.
4. Replace hardcoded category product IDs with category metadata managed through the catalog. Consider persisted bags and a clear path to resume payment on an existing unpaid order.
5. Before live selling, implement and independently test real payment-provider integration, server-verified payment notifications, email delivery, delivery-address collection and operational refund handling.
6. Validate the Vercel/PostgreSQL deployment, backup and restore procedures, configuration and access restrictions. Add representative PostgreSQL integration and end-to-end browser checks.
7. Plan build-tool maintenance, accessibility checks and performance measurement. If usage grows, normalize the shared JSONB store into relational tables and avoid rewriting the entire dataset for routine reads.

## 10. Overall assessment

Maua demonstrates the core customer and shop-management workflows of a flower-commerce application, with server-enforced order calculations, account-specific records and controlled simulated payment transitions. Its immediate delivery priorities are resolving the missing export dependency and investigating the failing frontend test. A verified production deployment and real operational integrations remain necessary before it can support live commercial transactions.

## Source references

Repository evidence reviewed: README.md; package.json; vercel.json; api/index.js; server/index.js; server/store.js; server/server.test.js; src/App.js; src/App.test.js; src/Components/Home.js; src/Components/Cart.js; src/Components/Admin.js; src/Components/History.js; src/Components/Notifications.js; src/lib/admin-report.js; src/lib/auth.test.js.
