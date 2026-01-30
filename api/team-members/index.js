import { query } from '../lib/db.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Get all team members
      const result = await query`
        SELECT id, first_name, last_name, email, color, created_at, updated_at
        FROM team_members
        ORDER BY first_name
      `;

      const teamMembers = result.rows.map(row => ({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        color: row.color
      }));

      return res.status(200).json({ teamMembers });
    }

    if (req.method === 'POST') {
      // Create new team member
      const { id, firstName, lastName, email, color } = req.body;

      if (!id || !firstName || !color) {
        return res.status(400).json({ error: 'id, firstName, and color are required' });
      }

      await query`
        INSERT INTO team_members (id, first_name, last_name, email, color)
        VALUES (${id}, ${firstName}, ${lastName || ''}, ${email || ''}, ${color})
      `;

      return res.status(201).json({
        success: true,
        teamMember: { id, firstName, lastName, email, color }
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Team members API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
