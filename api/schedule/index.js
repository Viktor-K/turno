import { sql } from '@vercel/postgres';

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
      // Get schedule for a year
      const year = req.query.year || new Date().getFullYear();

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
        WHERE sd.year = ${year}
        GROUP BY sd.id, sd.date, sd.is_closure
        ORDER BY sd.date
      `;

      // Transform to frontend format
      const schedule = {};
      result.rows.forEach(row => {
        const dateStr = row.date.toISOString().split('T')[0];
        schedule[dateStr] = {
          closure: row.is_closure,
          shifts: row.is_closure ? [] : row.shifts
        };
      });

      return res.status(200).json({ schedule });
    }

    if (req.method === 'POST') {
      // Bulk save schedule for a year
      const { year, schedule } = req.body;

      if (!year || !schedule) {
        return res.status(400).json({ error: 'year and schedule are required' });
      }

      // Start transaction
      await sql`BEGIN`;

      try {
        // Delete existing schedule for the year
        await sql`
          DELETE FROM schedule_days
          WHERE year = ${year}
        `;

        // Get team members lookup
        const membersResult = await sql`SELECT id, first_name FROM team_members`;
        const memberLookup = {};
        membersResult.rows.forEach(row => {
          memberLookup[row.first_name] = row.id;
        });

        let daysProcessed = 0;

        // Insert all days
        for (const [dateStr, dayData] of Object.entries(schedule)) {
          const dateYear = parseInt(dateStr.split('-')[0]);

          // Insert schedule day
          const dayResult = await sql`
            INSERT INTO schedule_days (date, year, is_closure)
            VALUES (${dateStr}::date, ${dateYear}, ${dayData.closure || false})
            RETURNING id
          `;
          const dayId = dayResult.rows[0].id;

          // Insert shift assignments
          if (!dayData.closure && dayData.shifts?.length > 0) {
            for (const shift of dayData.shifts) {
              const memberId = memberLookup[shift.member];
              if (memberId) {
                await sql`
                  INSERT INTO shift_assignments (schedule_day_id, member_id, shift_type_id)
                  VALUES (${dayId}, ${memberId}, ${shift.shift.id})
                `;
              }
            }
          }

          daysProcessed++;
        }

        await sql`COMMIT`;

        return res.status(200).json({
          success: true,
          daysProcessed
        });
      } catch (error) {
        await sql`ROLLBACK`;
        throw error;
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Schedule API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
