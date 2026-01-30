import { query } from '../lib/db.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Date is required' });
  }

  try {
    if (req.method === 'DELETE') {
      // Remove a specific closure
      const result = await query`
        DELETE FROM closures
        WHERE closure_date = ${date}::date
        RETURNING id
      `;

      // Also update schedule_days if exists
      await query`
        UPDATE schedule_days
        SET is_closure = false, updated_at = CURRENT_TIMESTAMP
        WHERE date = ${date}::date
      `;

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Closure not found for this date' });
      }

      return res.status(200).json({ success: true, deletedDate: date });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Closure API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
