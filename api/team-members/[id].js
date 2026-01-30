import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Member ID is required' });
  }

  try {
    if (req.method === 'GET') {
      const result = await sql`
        SELECT id, first_name, last_name, email, color
        FROM team_members
        WHERE id = ${id}
      `;

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Team member not found' });
      }

      const row = result.rows[0];
      return res.status(200).json({
        teamMember: {
          id: row.id,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          color: row.color
        }
      });
    }

    if (req.method === 'PUT') {
      const { firstName, lastName, email, color } = req.body;

      // Build dynamic update query
      const updates = [];
      const values = [];

      if (firstName !== undefined) {
        updates.push('first_name');
        values.push(firstName);
      }
      if (lastName !== undefined) {
        updates.push('last_name');
        values.push(lastName);
      }
      if (email !== undefined) {
        updates.push('email');
        values.push(email);
      }
      if (color !== undefined) {
        updates.push('color');
        values.push(color);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      // Use individual update for each field to avoid SQL injection
      if (firstName !== undefined) {
        await sql`UPDATE team_members SET first_name = ${firstName}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
      }
      if (lastName !== undefined) {
        await sql`UPDATE team_members SET last_name = ${lastName}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
      }
      if (email !== undefined) {
        await sql`UPDATE team_members SET email = ${email}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
      }
      if (color !== undefined) {
        await sql`UPDATE team_members SET color = ${color}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
      }

      // Fetch updated record
      const result = await sql`
        SELECT id, first_name, last_name, email, color
        FROM team_members
        WHERE id = ${id}
      `;

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Team member not found' });
      }

      const row = result.rows[0];
      return res.status(200).json({
        success: true,
        teamMember: {
          id: row.id,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          color: row.color
        }
      });
    }

    if (req.method === 'DELETE') {
      const result = await sql`
        DELETE FROM team_members
        WHERE id = ${id}
        RETURNING id
      `;

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Team member not found' });
      }

      return res.status(200).json({ success: true, deletedId: id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Team member API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
