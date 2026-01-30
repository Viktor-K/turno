import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Date is required' });
  }

  try {
    if (req.method === 'GET') {
      const result = await sql`
        SELECT
          sd.date,
          sd.is_closure,
          COALESCE(
            json_agg(
              json_build_object(
                'member', tm.first_name,
                'shift', json_build_object(
                  'id', st.id,
                  'name', st.name,
                  'start', st.start_time,
                  'end', st.end_time,
                  'color', st.color
                )
              )
            ) FILTER (WHERE sa.id IS NOT NULL),
            '[]'
          ) as shifts
        FROM schedule_days sd
        LEFT JOIN shift_assignments sa ON sd.id = sa.schedule_day_id
        LEFT JOIN team_members tm ON sa.member_id = tm.id
        LEFT JOIN shift_types st ON sa.shift_type_id = st.id
        WHERE sd.date = ${date}::date
        GROUP BY sd.id, sd.date, sd.is_closure
      `;

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Schedule not found for this date' });
      }

      const row = result.rows[0];
      return res.status(200).json({
        date: row.date.toISOString().split('T')[0],
        closure: row.is_closure,
        shifts: row.is_closure ? [] : row.shifts
      });
    }

    if (req.method === 'PUT') {
      const { closure, shifts } = req.body;
      const dateYear = parseInt(date.split('-')[0]);

      // Get team members lookup
      const membersResult = await sql`SELECT id, first_name FROM team_members`;
      const memberLookup = {};
      membersResult.rows.forEach(row => {
        memberLookup[row.first_name] = row.id;
      });

      // Start transaction
      await sql`BEGIN`;

      try {
        // Upsert schedule day
        const dayResult = await sql`
          INSERT INTO schedule_days (date, year, is_closure, updated_at)
          VALUES (${date}::date, ${dateYear}, ${closure || false}, CURRENT_TIMESTAMP)
          ON CONFLICT (date)
          DO UPDATE SET is_closure = ${closure || false}, updated_at = CURRENT_TIMESTAMP
          RETURNING id
        `;
        const dayId = dayResult.rows[0].id;

        // Delete existing assignments for this day
        await sql`
          DELETE FROM shift_assignments
          WHERE schedule_day_id = ${dayId}
        `;

        // Insert new assignments
        if (!closure && shifts?.length > 0) {
          for (const shift of shifts) {
            const memberId = memberLookup[shift.member];
            if (memberId) {
              await sql`
                INSERT INTO shift_assignments (schedule_day_id, member_id, shift_type_id)
                VALUES (${dayId}, ${memberId}, ${shift.shift.id})
              `;
            }
          }
        }

        await sql`COMMIT`;

        return res.status(200).json({
          success: true,
          date,
          closure: closure || false,
          shiftsCount: shifts?.length || 0
        });
      } catch (error) {
        await sql`ROLLBACK`;
        throw error;
      }
    }

    if (req.method === 'DELETE') {
      const result = await sql`
        DELETE FROM schedule_days
        WHERE date = ${date}::date
        RETURNING id
      `;

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Schedule not found for this date' });
      }

      return res.status(200).json({ success: true, deletedDate: date });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Schedule day API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
