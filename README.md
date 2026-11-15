# Maua

React flower shop with an Express API, simulated M-Pesa checkout and protected shop administration. Node.js 22 is recommended.

## Local development

Run `npm install`. Copy `.env.example` to `.env.local` and set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of at least 12 characters. Run `npm run server` and `npm start` in separate terminals. Open http://localhost:3000 and log in with the configured administrator credentials, or sign up as a customer.

Without `DATABASE_URL`, local records persist in `server/data/store.json`. Runtime data and environment files are ignored by Git.

## Vercel deployment only

The frontend and API deploy together to Vercel using `vercel.json` and `api/index.js`. No separate backend host is needed.

1. Import this repository into your Vercel project, using Create React App, build command `npm run build` and output directory `build`.
2. Connect a PostgreSQL database through Vercel Marketplace (for example Neon). Add its pooled connection URL as the server-only `DATABASE_URL` environment variable. Vercel functions cannot persist a local JSON database. The database provider is managed through the Vercel integration; the app itself runs only on Vercel.
3. Set server-only `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `APP_ORIGIN` (the exact public HTTPS origin, no trailing slash). Never prefix credentials with `REACT_APP_`.
4. Deploy from Vercel or run `npx vercel --prod` from an authenticated CLI session. Redeploy after changing environment variables.

The API initializes `maua_store` automatically. It stores application collections in a JSONB document under row `id = 1`. Transactions and a row lock serialize writes across function instances. This is suitable for a small shop; larger deployments should use separate relational tables.

## See and manage the database

Log in as the configured administrator and choose **Admin & database** in the navigation. Tabs expose products, customers, orders, simulated payments, email previews, sessions and audit records. Search, refresh or download a JSON export. Password hashes and session tokens are excluded.

Administrators can add, edit and delete products, control availability and collection placement, change prices and product details, promote or demote other accounts, revoke sessions and move orders through allowed fulfillment statuses. Every administrative change is audited. Product deletion preserves historical order snapshots.

For a direct database view, open your database integration from the Vercel project's Storage tab and its provider's SQL console:

```sql
SELECT jsonb_pretty(data) FROM maua_store WHERE id = 1;
SELECT jsonb_array_elements(data->'flowers') AS product FROM maua_store WHERE id = 1;
```

Direct SQL access includes authentication data; keep access restricted to the database owner. Use the in-app viewer for ordinary administration.

## M-Pesa simulation

Add flowers to the bag, enter a Kenyan mobile number and select **Simulate M-Pesa payment**. Choose approval, failure or cancellation. Approval confirms the order, creates a `SIM` receipt and saves an email preview. Failed and cancelled attempts can be retried. No real STK push, PIN collection, email delivery or money transfer occurs. All displayed amounts are KES; existing numeric catalog prices are retained.

The checkout uses the M-Pesa logo downloaded from [Safaricom's published logo asset](https://safaricom-staging.scanad.com/corporate-upgrade/images/lifeimages/M-PESA-logo-pdf.pdf), rasterized and cropped locally.

## Checks

```sh
npm run test:server
CI=true npm test -- --watchAll=false --runInBand
npm run build
```
