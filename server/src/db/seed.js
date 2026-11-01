const bcrypt = require('bcryptjs');
const { pool, testConnection } = require('./index');

async function seedDatabase() {
  console.log('[Seed] Starting database seeding with realistic South African PHC clinic data...');
  const connected = await testConnection();
  if (!connected) {
    console.error('[Seed] Aborted: Cannot connect to PostgreSQL. Please check DATABASE_URL in server/.env');
    process.exit(1);
  }

  try {
    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Seed Staff Users
    console.log('[Seed] Seeding staff user accounts...');
    const userRes = await pool.query(`
      INSERT INTO users (username, password_hash, full_name, role, staff_code)
      VALUES 
        ('receptionist', $1, 'Sister Thandi Sithole', 'RECEPTIONIST', 'REC-01'),
        ('nurse', $1, 'Staff Nurse Sipho Dlamini', 'NURSE', 'NUR-01'),
        ('doctor', $1, 'Dr. Lesedi Khumalo', 'DOCTOR', 'DOC-01'),
        ('admin', $1, 'Bonga Manzini (Health Informatics Admin)', 'ADMIN', 'ADM-01')
      ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id, username, role;
    `, [passwordHash]);

    const usersMap = {};
    userRes.rows.forEach(u => { usersMap[u.username] = u.id; });

    // 2. Seed Patients
    console.log('[Seed] Seeding South African clinic patient files...');
    const patientRes = await pool.query(`
      INSERT INTO patients (file_number, national_id, first_name, last_name, date_of_birth, gender, phone_number, residential_address, emergency_contact_name, emergency_contact_phone, known_allergies, chronic_conditions)
      VALUES 
        ('PHC-4928', '8904125021085', 'Nandi', 'Khumalo', '1989-04-12', 'Female', '0821234567', '2445 Vilakazi St, Orlando West, Soweto', 'Sibusiso Khumalo', '0829991122', 'Penicillin', 'Hypertension (Stage 2)'),
        ('PHC-5102', '7611055812083', 'Kagiso', 'Ndlovu', '1976-11-05', 'Male', '0719876543', 'Stand 481, Ext 2, Diepsloot', 'Nomsa Ndlovu', '0714443322', 'Sulpha drugs', 'Type 2 Diabetes Mellitus, Hyperlipidemia'),
        ('PHC-5219', '9508200341088', 'Zandile', 'Mthembu', '1995-08-20', 'Female', '0834567890', '78 12th Avenue, Alexandra', 'Gogo Mthembu', '0831110099', 'None', 'None (Well-baby child health visit)'),
        ('PHC-5344', '8203155799081', 'Bheki', 'Moyo', '1982-03-15', 'Male', '0735551234', '12 Hospital View, Tembisa', 'Dumisani Moyo', '0732228899', 'Aspirin', 'Chronic Asthma'),
        ('PHC-5401', '9812040192080', 'Lerato', 'Kgosi', '1998-12-04', 'Female', '0791112233', '104 Motaung Section, Katlehong', 'Tshepo Kgosi', '0793334455', 'None', 'Antenatal care (28 weeks gestation)')
      ON CONFLICT (file_number) DO UPDATE SET first_name = EXCLUDED.first_name
      RETURNING id, file_number, first_name, last_name;
    `);

    const patientsMap = {};
    patientRes.rows.forEach(p => { patientsMap[p.file_number] = p.id; });

    // 3. Seed Active Clinic Visits & Queue Tickets
    console.log('[Seed] Seeding live visits, triage vitals, and queue tickets...');

    // Visit 1: Nandi Khumalo (In consultation with Doctor)
    const v1 = await pool.query(`
      INSERT INTO visits (patient_id, visit_type, status, arrival_time)
      VALUES ($1, 'GENERAL', 'IN_CONSULTATION', NOW() - INTERVAL '35 minutes')
      RETURNING id;
    `, [patientsMap['PHC-4928']]);

    await pool.query(`
      INSERT INTO queue_tickets (visit_id, ticket_number, service_stream, priority_level, current_status, estimated_wait_mins, called_at, called_by)
      VALUES ($1, 'T-108', 'GENERAL', 'NORMAL', 'SERVING', 0, NOW() - INTERVAL '8 minutes', $2);
    `, [v1.rows[0].id, usersMap['doctor']]);

    await pool.query(`
      INSERT INTO vitals (visit_id, recorded_by, blood_pressure_sys, blood_pressure_dia, heart_rate, respiratory_rate, temperature, blood_glucose, weight_kg, height_cm, sats_triage_color, triage_notes)
      VALUES ($1, $2, 142, 92, 78, 16, 36.6, 5.8, 74.5, 163.0, 'YELLOW', 'Elevated BP reading, mild headache reported.');
    `, [v1.rows[0].id, usersMap['nurse']]);

    // Visit 2: Kagiso Ndlovu (Fast track chronic collection - Waiting)
    const v2 = await pool.query(`
      INSERT INTO visits (patient_id, visit_type, status, arrival_time)
      VALUES ($1, 'CHRONIC_MEDS', 'REGISTERED', NOW() - INTERVAL '15 minutes')
      RETURNING id;
    `, [patientsMap['PHC-5102']]);

    await pool.query(`
      INSERT INTO queue_tickets (visit_id, ticket_number, service_stream, priority_level, current_status, estimated_wait_mins)
      VALUES ($1, 'T-109', 'CHRONIC', 'FAST_TRACK', 'WAITING', 12);
    `, [v2.rows[0].id]);

    // Visit 3: Zandile Mthembu (Child Health - Waiting)
    const v3 = await pool.query(`
      INSERT INTO visits (patient_id, visit_type, status, arrival_time)
      VALUES ($1, 'PEDIATRIC', 'TRIAGED', NOW() - INTERVAL '20 minutes')
      RETURNING id;
    `, [patientsMap['PHC-5219']]);

    await pool.query(`
      INSERT INTO queue_tickets (visit_id, ticket_number, service_stream, priority_level, current_status, estimated_wait_mins)
      VALUES ($1, 'T-110', 'PEDIATRIC', 'NORMAL', 'WAITING', 18);
    `, [v3.rows[0].id]);

    await pool.query(`
      INSERT INTO vitals (visit_id, recorded_by, heart_rate, respiratory_rate, temperature, weight_kg, height_cm, sats_triage_color, triage_notes)
      VALUES ($1, $2, 110, 26, 36.8, 8.4, 72.0, 'GREEN', '6-month immunization & growth check. Vitals stable.');
    `, [v3.rows[0].id, usersMap['nurse']]);

    // Visit 4: Bheki Moyo (High priority triage / emergency)
    const v4 = await pool.query(`
      INSERT INTO visits (patient_id, visit_type, status, arrival_time)
      VALUES ($1, 'EMERGENCY_TRIAGE', 'TRIAGED', NOW() - INTERVAL '5 minutes')
      RETURNING id;
    `, [patientsMap['PHC-5344']]);

    await pool.query(`
      INSERT INTO queue_tickets (visit_id, ticket_number, service_stream, priority_level, current_status, estimated_wait_mins)
      VALUES ($1, 'T-111', 'TRIAGE_URGENT', 'EMERGENCY', 'WAITING', 2);
    `, [v4.rows[0].id]);

    await pool.query(`
      INSERT INTO vitals (visit_id, recorded_by, blood_pressure_sys, blood_pressure_dia, heart_rate, respiratory_rate, temperature, sats_triage_color, triage_notes)
      VALUES ($1, $2, 130, 85, 118, 28, 37.1, 'ORANGE', 'Acute wheezing and shortness of breath. SpO2 91%. Priority doctor consult required.');
    `, [v4.rows[0].id, usersMap['nurse']]);

    console.log('[Seed] Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
