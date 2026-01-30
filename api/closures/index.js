import { query } from '../lib/db.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Get closures for a year
      const year = req.query.year || new Date().getFullYear();

      const result = await query`
        SELECT closure_date
        FROM closures
        WHERE year = ${year}
        ORDER BY closure_date
      `;

      const closures = result.rows.map(row =>
        row.closure_date.toISOString().split('T')[0]
      );

      return res.status(200).json({ closures });
    }

    if (req.method === 'POST') {
      // Add a closure
      const { date } = req.body;

      if (!date) {
        return res.status(400).json({ error: 'date is required' });
      }

      const dateYear = parseInt(date.split('-')[0]);

      await query`
        INSERT INTO closures (closure_date, year)
        VALUES (${date}::date, ${dateYear})
        ON CONFLICT (closure_date) DO NOTHING
      `;

      // Also update schedule_days if exists
      await query`
        UPDATE schedule_days
        SET is_closure = true, updated_at = CURRENT_TIMESTAMP
        WHERE date = ${date}::date
      `;

      return res.status(201).json({ success: true, date });
    }

    if (req.method === 'DELETE') {
      // Clear all closures for a year
      const year = req.query.year;

      if (!year) {
        return res.status(400).json({ error: 'year query parameter is required' });
      }

      const result = await query`
        DELETE FROM closures
        WHERE year = ${year}
        RETURNING id
      `;

      return res.status(200).json({
        success: true,
        deletedCount: result.rows.length
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Closures API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
