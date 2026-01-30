import { query, execute, transaction } from '../lib/db.js';

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

      const result = await query`
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

      const scheduleEntries = Object.entries(schedule);
      if (scheduleEntries.length === 0) {
        return res.status(200).json({ success: true, daysProcessed: 0 });
      }

      // Get team members lookup first
      const membersResult = await query`SELECT id, first_name FROM team_members`;
      const memberLookup = {};
      membersResult.rows.forEach(row => {
        memberLookup[row.first_name] = row.id;
      });

      // Prepare batch data
      const daysToInsert = [];
      const shiftsToInsert = [];

      for (const [dateStr, dayData] of scheduleEntries) {
        const dateYear = parseInt(dateStr.split('-')[0]);
        daysToInsert.push({
          date: dateStr,
          year: dateYear,
          isClosure: dayData.closure || false,
          shifts: dayData.shifts || []
        });
      }

      // Use transaction for atomicity
      await transaction(async (txQuery) => {
        // Delete existing schedule for the year (only for dates we're inserting)
        const datesToDelete = daysToInsert.map(d => d.date);
        if (datesToDelete.length > 0) {
          // Delete in batches to avoid parameter limit
          const batchSize = 100;
          for (let i = 0; i < datesToDelete.length; i += batchSize) {
            const batch = datesToDelete.slice(i, i + batchSize);
            const placeholders = batch.map((_, idx) => `$${idx + 1}::date`).join(', ');
            await execute(`DELETE FROM schedule_days WHERE date IN (${placeholders})`, batch);
          }
        }

        // Batch insert schedule_days - use execute with raw SQL for better performance
        const daysBatchSize = 50;
        const insertedDays = new Map(); // date -> id

        for (let i = 0; i < daysToInsert.length; i += daysBatchSize) {
          const batch = daysToInsert.slice(i, i + daysBatchSize);

          // Build VALUES clause
          const values = [];
          const params = [];
          batch.forEach((day, idx) => {
            const offset = idx * 3;
            values.push(`($${offset + 1}::date, $${offset + 2}, $${offset + 3})`);
            params.push(day.date, day.year, day.isClosure);
          });

          const insertSql = `
            INSERT INTO schedule_days (date, year, is_closure)
            VALUES ${values.join(', ')}
            RETURNING id, date
          `;

          const result = await execute(insertSql, params);
          result.rows.forEach(row => {
            const dateStr = row.date.toISOString().split('T')[0];
            insertedDays.set(dateStr, row.id);
          });
        }

        // Prepare shift assignments
        for (const day of daysToInsert) {
          if (!day.isClosure && day.shifts.length > 0) {
            const dayId = insertedDays.get(day.date);
            if (dayId) {
              for (const shift of day.shifts) {
                const memberId = memberLookup[shift.member];
                if (memberId) {
                  shiftsToInsert.push({
                    dayId,
                    memberId,
                    shiftTypeId: shift.shift.id
                  });
                }
              }
            }
          }
        }

        // Batch insert shift_assignments
        if (shiftsToInsert.length > 0) {
          const shiftsBatchSize = 100;
          for (let i = 0; i < shiftsToInsert.length; i += shiftsBatchSize) {
            const batch = shiftsToInsert.slice(i, i + shiftsBatchSize);

            const values = [];
            const params = [];
            batch.forEach((sa, idx) => {
              const offset = idx * 3;
              values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3})`);
              params.push(sa.dayId, sa.memberId, sa.shiftTypeId);
            });

            const insertSql = `
              INSERT INTO shift_assignments (schedule_day_id, member_id, shift_type_id)
              VALUES ${values.join(', ')}
            `;

            await execute(insertSql, params);
          }
        }
      });

      return res.status(200).json({
        success: true,
        daysProcessed: daysToInsert.length,
        shiftsProcessed: shiftsToInsert.length
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Schedule API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
