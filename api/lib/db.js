import { sql as vercelSql } from '@vercel/postgres';
import pg from 'pg';

const { Pool } = pg;

// Local PostgreSQL pool (for development)
let localPool = null;

function getLocalPool() {
  if (!localPool) {
    localPool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });
  }
  return localPool;
}

// Check if we're in Vercel environment
function isVercelEnv() {
  return process.env.VERCEL === '1' || process.env.VERCEL_ENV;
}

// Create a sql template tag function that works with both environments
export async function query(strings, ...values) {
  if (isVercelEnv()) {
    // Use Vercel Postgres in production
    return vercelSql(strings, ...values);
  } else {
    // Use local pg pool in development
    const pool = getLocalPool();

    // Convert template literal to parameterized query
    let text = '';
    const params = [];

    strings.forEach((string, i) => {
      text += string;
      if (i < values.length) {
        params.push(values[i]);
        text += `$${params.length}`;
      }
    });

    const result = await pool.query(text, params);
    return { rows: result.rows, rowCount: result.rowCount };
  }
}

// For raw SQL execution (useful for migrations)
export async function execute(sqlText) {
  if (isVercelEnv()) {
    return vercelSql.query(sqlText);
  } else {
    const pool = getLocalPool();
    const result = await pool.query(sqlText);
    return { rows: result.rows, rowCount: result.rowCount };
  }
}

// Transaction support
export async function transaction(callback) {
  if (isVercelEnv()) {
    // Vercel Postgres handles transactions differently
    await vercelSql`BEGIN`;
    try {
      await callback(query);
      await vercelSql`COMMIT`;
    } catch (error) {
      await vercelSql`ROLLBACK`;
      throw error;
    }
  } else {
    const pool = getLocalPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create a query function for this transaction
      const txQuery = async (strings, ...values) => {
        let text = '';
        const params = [];
        strings.forEach((string, i) => {
          text += string;
          if (i < values.length) {
            params.push(values[i]);
            text += `$${params.length}`;
          }
        });
        const result = await client.query(text, params);
        return { rows: result.rows, rowCount: result.rowCount };
      };

      await callback(txQuery);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default { query, execute, transaction };
