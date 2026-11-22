const fs = require('node:fs');
const path = require('node:path');
const catalog = require('../src/catalog.json');

function normalize(db = {}) {
  return { users: [], sessions: [], orders: [], payments: [], notifications: [], audit: [], attempts: [], flowers: structuredClone(catalog), ...db };
}

function createStore({ dataFile, databaseUrl }) {
  if (databaseUrl) {
    const { Pool } = require('pg');
    const options = { connectionString: databaseUrl, max: 2, connectionTimeoutMillis: 10000, idleTimeoutMillis: 10000 };
    const ca = process.env.DATABASE_SSL_CA?.trim().replace(/\\n/g, '\n');
    if (ca) {
      const url = new URL(databaseUrl);
      // pg applies URL SSL settings after pool options, replacing the CA if present.
      for (const key of ['ssl', 'sslmode', 'sslcert', 'sslkey', 'sslrootcert']) {
        url.searchParams.delete(key);
      }
      options.connectionString = url.toString();
      options.ssl = { ca, rejectUnauthorized: true };
    }
    const pool = new Pool(options);
    let initialized;
    async function initialize() {
      await pool.query('CREATE TABLE IF NOT EXISTS maua_store (id INTEGER PRIMARY KEY CHECK (id = 1), data JSONB NOT NULL)');
      await pool.query('INSERT INTO maua_store (id, data) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING', [JSON.stringify(normalize())]);
    }
    return {
      async run(action) {
        if (!initialized) initialized = initialize().catch(error => { initialized = undefined; throw error; });
        await initialized;
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          // Serialize mutations across serverless instances, including payment confirmation.
          const result = await client.query('SELECT data FROM maua_store WHERE id = 1 FOR UPDATE');
          const db = normalize(result.rows[0].data);
          const value = await action(db);
          await client.query('UPDATE maua_store SET data = $1::jsonb WHERE id = 1', [JSON.stringify(db)]);
          await client.query('COMMIT');
          return value;
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally { client.release(); }
      },
      close: () => pool.end(),
    };
  }
  if (process.env.VERCEL) throw new Error('Set DATABASE_URL to a persistent PostgreSQL database before deploying to Vercel.');
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  let queue = Promise.resolve();
  return {
    run(action) {
      const operation = queue.then(async () => {
        const db = normalize(fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile, 'utf8')) : {});
        const value = await action(db);
        fs.writeFileSync(`${dataFile}.tmp`, JSON.stringify(db), { mode: 0o600 });
        fs.renameSync(`${dataFile}.tmp`, dataFile);
        return value;
      });
      queue = operation.catch(() => {});
      return operation;
    },
    close: async () => {},
  };
}
module.exports = { createStore };
