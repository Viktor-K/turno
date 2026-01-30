import { execute } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create team_members table
    await execute(`
      CREATE TABLE IF NOT EXISTS team_members (
        id VARCHAR(50) PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) DEFAULT '',
        email VARCHAR(255) DEFAULT '',
        color VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create shift_types table
    await execute(`
      CREATE TABLE IF NOT EXISTS shift_types (
        id VARCHAR(20) PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        color VARCHAR(100) NOT NULL
      )
    `);

    // Create closures table
    await execute(`
      CREATE TABLE IF NOT EXISTS closures (
        id SERIAL PRIMARY KEY,
        closure_date DATE NOT NULL UNIQUE,
        year INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create schedule_days table
    await execute(`
      CREATE TABLE IF NOT EXISTS schedule_days (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        year INTEGER,
        is_closure BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create shift_assignments table
    await execute(`
      CREATE TABLE IF NOT EXISTS shift_assignments (
        id SERIAL PRIMARY KEY,
        schedule_day_id INTEGER REFERENCES schedule_days(id) ON DELETE CASCADE,
        member_id VARCHAR(50) REFERENCES team_members(id) ON DELETE CASCADE,
        shift_type_id VARCHAR(20) REFERENCES shift_types(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(schedule_day_id, member_id)
      )
    `);

    // Create indexes
    await execute(`CREATE INDEX IF NOT EXISTS idx_schedule_days_year ON schedule_days(year)`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_schedule_days_date ON schedule_days(date)`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_closures_year ON closures(year)`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_closures_date ON closures(closure_date)`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_shift_assignments_day ON shift_assignments(schedule_day_id)`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_shift_assignments_member ON shift_assignments(member_id)`);

    // Seed shift types
    await execute(`
      INSERT INTO shift_types (id, name, start_time, end_time, color)
      VALUES
        ('early', '8:00 - 17:00', '08:00', '17:00', 'bg-sky-100 text-sky-700'),
        ('standard', '9:00 - 18:00', '09:00', '18:00', 'bg-emerald-100 text-emerald-700'),
        ('late', '12:00 - 21:00', '12:00', '21:00', 'bg-violet-100 text-violet-700'),
        ('weekend', 'Weekend', '09:00', '18:00', 'bg-amber-100 text-amber-700')
      ON CONFLICT (id) DO NOTHING
    `);

    // Seed default team members
    await execute(`
      INSERT INTO team_members (id, first_name, last_name, email, color)
      VALUES
        ('gabriela', 'Gabriela', '', '', 'bg-pink-100 text-pink-700 border-pink-200'),
        ('usfar', 'Usfar', '', '', 'bg-sky-100 text-sky-700 border-sky-200'),
        ('fabio', 'Fabio', '', '', 'bg-emerald-100 text-emerald-700 border-emerald-200'),
        ('elisa', 'Elisa', '', '', 'bg-amber-100 text-amber-700 border-amber-200'),
        ('marina', 'Marina', '', '', 'bg-violet-100 text-violet-700 border-violet-200'),
        ('stefania', 'Stefania', '', '', 'bg-rose-100 text-rose-700 border-rose-200'),
        ('virginia', 'Virginia', '', '', 'bg-indigo-100 text-indigo-700 border-indigo-200'),
        ('silvia', 'Silvia', '', '', 'bg-cyan-100 text-cyan-700 border-cyan-200')
      ON CONFLICT (id) DO NOTHING
    `);

    return res.status(200).json({
      success: true,
      message: 'Database migrated successfully',
      tables: ['team_members', 'shift_types', 'closures', 'schedule_days', 'shift_assignments']
    });
  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({ error: error.message });
  }
}
