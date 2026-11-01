const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool, getIsConnected, testConnection } = require('./index');

// In-Memory Fallback Collections (seeded with realistic SA clinic data)
let mockUsers = [];
let mockPatients = [];
let mockVisits = [];
let mockQueueTickets = [];
let mockVitals = [];
let mockConsultations = [];
let mockAttachments = [];
let mockPrescriptions = [];

let ticketCounter = 114;

async function initMockData() {
  const passwordHash = await bcrypt.hash('password123', 10);
  
  mockUsers = [
    { id: 'u-rec-1', username: 'receptionist', password_hash: passwordHash, full_name: 'Sister Thandi Sithole', role: 'RECEPTIONIST', staff_code: 'REC-01' },
    { id: 'u-nur-1', username: 'nurse', password_hash: passwordHash, full_name: 'Staff Nurse Sipho Dlamini', role: 'NURSE', staff_code: 'NUR-01' },
    { id: 'u-doc-1', username: 'doctor', password_hash: passwordHash, full_name: 'Dr. Lesedi Khumalo', role: 'DOCTOR', staff_code: 'DOC-01' },
    { id: 'u-adm-1', username: 'admin', password_hash: passwordHash, full_name: 'Bonga Manzini (Health Informatics Admin)', role: 'ADMIN', staff_code: 'ADM-01' }
  ];

  mockPatients = [
    {
      id: 'p-1',
      file_number: 'PHC-4928',
      national_id: '8904125021085',
      first_name: 'Nandi',
      last_name: 'Khumalo',
      date_of_birth: '1989-04-12',
      gender: 'Female',
      phone_number: '082 123 4567',
      residential_address: '2445 Vilakazi St, Orlando West, Soweto',
      emergency_contact_name: 'Sibusiso Khumalo',
      emergency_contact_phone: '082 999 1122',
      known_allergies: 'Penicillin',
      chronic_conditions: 'Hypertension (Stage 2)',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString()
    },
    {
      id: 'p-2',
      file_number: 'PHC-5102',
      national_id: '7611055812083',
      first_name: 'Kagiso',
      last_name: 'Ndlovu',
      date_of_birth: '1976-11-05',
      gender: 'Male',
      phone_number: '071 987 6543',
      residential_address: 'Stand 481, Ext 2, Diepsloot',
      emergency_contact_name: 'Nomsa Ndlovu',
      emergency_contact_phone: '071 444 3322',
      known_allergies: 'Sulpha drugs',
      chronic_conditions: 'Type 2 Diabetes Mellitus, Hyperlipidemia',
      created_at: new Date(Date.now() - 60 * 86400000).toISOString()
    },
    {
      id: 'p-3',
      file_number: 'PHC-5219',
      national_id: '9508200341088',
      first_name: 'Zandile',
      last_name: 'Mthembu',
      date_of_birth: '1995-08-20',
      gender: 'Female',
      phone_number: '083 456 7890',
      residential_address: '78 12th Avenue, Alexandra',
      emergency_contact_name: 'Gogo Mthembu',
      emergency_contact_phone: '083 111 0099',
      known_allergies: 'None',
      chronic_conditions: 'Well-baby child health visit',
      created_at: new Date(Date.now() - 10 * 86400000).toISOString()
    },
    {
      id: 'p-4',
      file_number: 'PHC-5344',
      national_id: '8203155799081',
      first_name: 'Bheki',
      last_name: 'Moyo',
      date_of_birth: '1982-03-15',
      gender: 'Male',
      phone_number: '073 555 1234',
      residential_address: '12 Hospital View, Tembisa',
      emergency_contact_name: 'Dumisani Moyo',
      emergency_contact_phone: '073 222 8899',
      known_allergies: 'Aspirin',
      chronic_conditions: 'Chronic Asthma',
      created_at: new Date(Date.now() - 45 * 86400000).toISOString()
    },
    {
      id: 'p-5',
      file_number: 'PHC-5401',
      national_id: '9812040192080',
      first_name: 'Lerato',
      last_name: 'Kgosi',
      date_of_birth: '1998-12-04',
      gender: 'Female',
      phone_number: '079 111 2233',
      residential_address: '104 Motaung Section, Katlehong',
      emergency_contact_name: 'Tshepo Kgosi',
      emergency_contact_phone: '079 333 4455',
      known_allergies: 'None',
      chronic_conditions: 'Antenatal care (28 weeks gestation)',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString()
    }
  ];

  mockVisits = [
    {
      id: 'v-1',
      patient_id: 'p-1',
      visit_type: 'GENERAL',
      status: 'IN_CONSULTATION',
      arrival_time: new Date(Date.now() - 35 * 60000).toISOString()
    },
    {
      id: 'v-2',
      patient_id: 'p-2',
      visit_type: 'CHRONIC_MEDS',
      status: 'REGISTERED',
      arrival_time: new Date(Date.now() - 15 * 60000).toISOString()
    },
    {
      id: 'v-3',
      patient_id: 'p-3',
      visit_type: 'PEDIATRIC',
      status: 'TRIAGED',
      arrival_time: new Date(Date.now() - 20 * 60000).toISOString()
    },
    {
      id: 'v-4',
      patient_id: 'p-4',
      visit_type: 'EMERGENCY_TRIAGE',
      status: 'TRIAGED',
      arrival_time: new Date(Date.now() - 5 * 60000).toISOString()
    }
  ];

  mockQueueTickets = [
    {
      id: 't-1',
      visit_id: 'v-1',
      ticket_number: 'T-108',
      service_stream: 'GENERAL',
      priority_level: 'NORMAL',
      current_status: 'SERVING',
      estimated_wait_mins: 0,
      called_at: new Date(Date.now() - 8 * 60000).toISOString(),
      called_by: 'u-doc-1'
    },
    {
      id: 't-2',
      visit_id: 'v-2',
      ticket_number: 'T-109',
      service_stream: 'CHRONIC',
      priority_level: 'FAST_TRACK',
      current_status: 'WAITING',
      estimated_wait_mins: 12,
      called_at: null,
      called_by: null
    },
    {
      id: 't-3',
      visit_id: 'v-3',
      ticket_number: 'T-110',
      service_stream: 'PEDIATRIC',
      priority_level: 'NORMAL',
      current_status: 'WAITING',
      estimated_wait_mins: 18,
      called_at: null,
      called_by: null
    },
    {
      id: 't-4',
      visit_id: 'v-4',
      ticket_number: 'T-111',
      service_stream: 'TRIAGE_URGENT',
      priority_level: 'EMERGENCY',
      current_status: 'WAITING',
      estimated_wait_mins: 2,
      called_at: null,
      called_by: null
    }
  ];

  mockVitals = [
    {
      id: 'vit-1',
      visit_id: 'v-1',
      recorded_by: 'u-nur-1',
      blood_pressure_sys: 142,
      blood_pressure_dia: 92,
      heart_rate: 78,
      respiratory_rate: 16,
      temperature: 36.6,
      blood_glucose: 5.8,
      weight_kg: 74.5,
      height_cm: 163.0,
      sats_triage_color: 'YELLOW',
      triage_notes: 'Elevated BP reading, mild tension headache reported.',
      recorded_at: new Date(Date.now() - 25 * 60000).toISOString()
    },
    {
      id: 'vit-3',
      visit_id: 'v-3',
      recorded_by: 'u-nur-1',
      blood_pressure_sys: null,
      blood_pressure_dia: null,
      heart_rate: 110,
      respiratory_rate: 26,
      temperature: 36.8,
      blood_glucose: null,
      weight_kg: 8.4,
      height_cm: 72.0,
      sats_triage_color: 'GREEN',
      triage_notes: '6-month immunization check, thriving well.',
      recorded_at: new Date(Date.now() - 15 * 60000).toISOString()
    },
    {
      id: 'vit-4',
      visit_id: 'v-4',
      recorded_by: 'u-nur-1',
      blood_pressure_sys: 130,
      blood_pressure_dia: 85,
      heart_rate: 118,
      respiratory_rate: 28,
      temperature: 37.1,
      blood_glucose: 6.1,
      weight_kg: 68.0,
      height_cm: 172.0,
      sats_triage_color: 'ORANGE',
      triage_notes: 'Acute wheezing and shortness of breath. SpO2 91%. Priority doctor consult required.',
      recorded_at: new Date(Date.now() - 4 * 60000).toISOString()
    }
  ];

  mockConsultations = [
    {
      id: 'c-1',
      visit_id: 'v-1',
      doctor_id: 'u-doc-1',
      subjective_notes: 'Patient attends complaining of 3-day occipital headache and dizziness. Compliant with Enalapril 10mg.',
      objective_notes: 'BP 142/92 mmHg, HR 78 bpm regular. Chest clear, heart sounds normal. Fundoscopy normal.',
      assessment_notes: 'Essential Hypertension - inadequately controlled on monotherapy.',
      plan_notes: 'Add Hydrochlorothiazide (HCTZ) 12.5mg mane. Review in 1 month. Routine U&E and eGFR requested.',
      icd10_code: 'I10',
      diagnosis_text: 'Essential (primary) hypertension',
      form_template: 'ADULT_PHC',
      custom_template_data: { lifestyleCounseling: true, saltReductionAdvised: true },
      canvas_drawing_data: null,
      created_at: new Date(Date.now() - 5 * 60000).toISOString()
    }
  ];

  mockPrescriptions = [
    {
      id: 'rx-1',
      consultation_id: 'c-1',
      medication_name: 'Enalapril 10mg Tablets',
      dosage: '10mg',
      frequency: 'Once daily in the morning',
      duration_days: 30,
      is_ccmdd_repeat: true,
      ccmdd_pickup_point: 'Orlando West Community Hall Pickup Point',
      dispensing_status: 'PENDING'
    },
    {
      id: 'rx-2',
      consultation_id: 'c-1',
      medication_name: 'Hydrochlorothiazide 12.5mg Tablets',
      dosage: '12.5mg',
      frequency: 'Once daily in the morning',
      duration_days: 30,
      is_ccmdd_repeat: true,
      ccmdd_pickup_point: 'Orlando West Community Hall Pickup Point',
      dispensing_status: 'PENDING'
    }
  ];
}

initMockData();

// Repository layer methods
const store = {
  // Check if real Postgres is active
  isPg: () => getIsConnected(),

  // Users
  findUserByUsername: async (username) => {
    if (getIsConnected()) {
      const res = await pool.query('SELECT * FROM users WHERE username = $1 AND is_active = TRUE', [username]);
      return res.rows[0];
    }
    return mockUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
  },

  findUserById: async (id) => {
    if (getIsConnected()) {
      const res = await pool.query('SELECT id, username, full_name, role, staff_code FROM users WHERE id = $1', [id]);
      return res.rows[0];
    }
    const u = mockUsers.find(u => u.id === id);
    if (!u) return null;
    const { password_hash, ...safeUser } = u;
    return safeUser;
  },

  getAllUsers: async () => {
    if (getIsConnected()) {
      const res = await pool.query('SELECT id, username, full_name, role, staff_code, created_at FROM users ORDER BY full_name');
      return res.rows;
    }
    return mockUsers.map(({ password_hash, ...u }) => u);
  },

  // Patients
  searchPatients: async (query) => {
    if (getIsConnected()) {
      const q = `%${query}%`;
      const res = await pool.query(`
        SELECT * FROM patients 
        WHERE file_number ILIKE $1 
           OR national_id ILIKE $1 
           OR first_name ILIKE $1 
           OR last_name ILIKE $1
           OR phone_number ILIKE $1
        ORDER BY last_name, first_name LIMIT 20
      `, [q]);
      return res.rows;
    }
    const cleanQ = (query || '').toLowerCase().trim();
    if (!cleanQ) return mockPatients.slice(0, 20);
    return mockPatients.filter(p => 
      p.file_number.toLowerCase().includes(cleanQ) ||
      (p.national_id && p.national_id.includes(cleanQ)) ||
      p.first_name.toLowerCase().includes(cleanQ) ||
      p.last_name.toLowerCase().includes(cleanQ) ||
      (p.phone_number && p.phone_number.includes(cleanQ))
    );
  },

  getPatientById: async (id) => {
    if (getIsConnected()) {
      const pRes = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
      if (!pRes.rows.length) return null;
      const patient = pRes.rows[0];

      // Fetch visit history
      const vRes = await pool.query(`
        SELECT v.*, qt.ticket_number, qt.service_stream, qt.priority_level, qt.current_status as ticket_status
        FROM visits v
        LEFT JOIN queue_tickets qt ON qt.visit_id = v.id
        WHERE v.patient_id = $1
        ORDER BY v.arrival_time DESC
      `, [id]);

      patient.visits = vRes.rows;
      return patient;
    }

    const patient = mockPatients.find(p => p.id === id);
    if (!patient) return null;

    const visits = mockVisits
      .filter(v => v.patient_id === id)
      .map(v => {
        const ticket = mockQueueTickets.find(t => t.visit_id === v.id);
        const vit = mockVitals.find(vit => vit.visit_id === v.id);
        const consult = mockConsultations.find(c => c.visit_id === v.id);
        return {
          ...v,
          ticket_number: ticket ? ticket.ticket_number : null,
          service_stream: ticket ? ticket.service_stream : null,
          priority_level: ticket ? ticket.priority_level : null,
          ticket_status: ticket ? ticket.current_status : null,
          vitals: vit || null,
          consultation: consult || null
        };
      })
      .sort((a, b) => new Date(b.arrival_time) - new Date(a.arrival_time));

    return { ...patient, visits };
  },

  createPatient: async (data) => {
    if (getIsConnected()) {
      const res = await pool.query(`
        INSERT INTO patients (
          file_number, national_id, first_name, last_name, date_of_birth,
          gender, phone_number, residential_address, emergency_contact_name,
          emergency_contact_phone, known_allergies, chronic_conditions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        data.file_number, data.national_id, data.first_name, data.last_name,
        data.date_of_birth, data.gender, data.phone_number, data.residential_address,
        data.emergency_contact_name, data.emergency_contact_phone,
        data.known_allergies, data.chronic_conditions
      ]);
      return res.rows[0];
    }

    const newPatient = {
      id: `p-${Date.now()}`,
      file_number: data.file_number || `PHC-${Math.floor(1000 + Math.random() * 9000)}`,
      national_id: data.national_id || '',
      first_name: data.first_name,
      last_name: data.last_name,
      date_of_birth: data.date_of_birth,
      gender: data.gender,
      phone_number: data.phone_number || '',
      residential_address: data.residential_address || '',
      emergency_contact_name: data.emergency_contact_name || '',
      emergency_contact_phone: data.emergency_contact_phone || '',
      known_allergies: data.known_allergies || 'None',
      chronic_conditions: data.chronic_conditions || 'None',
      created_at: new Date().toISOString()
    };
    mockPatients.unshift(newPatient);
    return newPatient;
  },

  updatePatient: async (id, data) => {
    if (getIsConnected()) {
      const res = await pool.query(`
        UPDATE patients SET
          national_id = COALESCE($2, national_id),
          first_name = COALESCE($3, first_name),
          last_name = COALESCE($4, last_name),
          date_of_birth = COALESCE($5, date_of_birth),
          gender = COALESCE($6, gender),
          phone_number = COALESCE($7, phone_number),
          residential_address = COALESCE($8, residential_address),
          emergency_contact_name = COALESCE($9, emergency_contact_name),
          emergency_contact_phone = COALESCE($10, emergency_contact_phone),
          known_allergies = COALESCE($11, known_allergies),
          chronic_conditions = COALESCE($12, chronic_conditions),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [
        id, data.national_id, data.first_name, data.last_name, data.date_of_birth,
        data.gender, data.phone_number, data.residential_address,
        data.emergency_contact_name, data.emergency_contact_phone,
        data.known_allergies, data.chronic_conditions
      ]);
      return res.rows[0];
    }

    const idx = mockPatients.findIndex(p => p.id === id);
    if (idx === -1) return null;
    mockPatients[idx] = { ...mockPatients[idx], ...data, updated_at: new Date().toISOString() };
    return mockPatients[idx];
  },

  // Queue and Visits
  getLiveQueue: async () => {
    if (getIsConnected()) {
      const res = await pool.query(`
        SELECT 
          qt.id as ticket_id,
          qt.ticket_number,
          qt.service_stream,
          qt.priority_level,
          qt.current_status,
          qt.estimated_wait_mins,
          qt.called_at,
          v.id as visit_id,
          v.visit_type,
          v.status as visit_status,
          v.arrival_time,
          p.id as patient_id,
          p.file_number,
          p.first_name,
          p.last_name,
          p.phone_number,
          p.known_allergies,
          p.chronic_conditions,
          vit.id as vitals_id,
          vit.sats_triage_color,
          vit.blood_pressure_sys,
          vit.blood_pressure_dia,
          vit.heart_rate,
          vit.temperature,
          vit.triage_notes
        FROM queue_tickets qt
        JOIN visits v ON qt.visit_id = v.id
        JOIN patients p ON v.patient_id = p.id
        LEFT JOIN vitals vit ON vit.visit_id = v.id
        WHERE qt.current_status IN ('WAITING', 'CALLING', 'SERVING')
        ORDER BY 
          CASE WHEN qt.priority_level = 'EMERGENCY' THEN 1 
               WHEN qt.priority_level = 'FAST_TRACK' THEN 2 
               ELSE 3 END,
          qt.created_at ASC
      `);
      return res.rows;
    }

    return mockQueueTickets
      .filter(t => ['WAITING', 'CALLING', 'SERVING'].includes(t.current_status))
      .map(t => {
        const v = mockVisits.find(v => v.id === t.visit_id) || {};
        const p = mockPatients.find(p => p.id === v.patient_id) || {};
        const vit = mockVitals.find(vit => vit.visit_id === v.id) || {};
        return {
          ticket_id: t.id,
          ticket_number: t.ticket_number,
          service_stream: t.service_stream,
          priority_level: t.priority_level,
          current_status: t.current_status,
          estimated_wait_mins: t.estimated_wait_mins,
          called_at: t.called_at,
          visit_id: v.id,
          visit_type: v.visit_type,
          visit_status: v.status,
          arrival_time: v.arrival_time,
          patient_id: p.id,
          file_number: p.file_number,
          first_name: p.first_name,
          last_name: p.last_name,
          phone_number: p.phone_number,
          known_allergies: p.known_allergies,
          chronic_conditions: p.chronic_conditions,
          vitals_id: vit.id || null,
          sats_triage_color: vit.sats_triage_color || null,
          blood_pressure_sys: vit.blood_pressure_sys || null,
          blood_pressure_dia: vit.blood_pressure_dia || null,
          heart_rate: vit.heart_rate || null,
          temperature: vit.temperature || null,
          triage_notes: vit.triage_notes || null
        };
      })
      .sort((a, b) => {
        const priorityOrder = { EMERGENCY: 1, FAST_TRACK: 2, NORMAL: 3 };
        const diff = (priorityOrder[a.priority_level] || 3) - (priorityOrder[b.priority_level] || 3);
        if (diff !== 0) return diff;
        return a.estimated_wait_mins - b.estimated_wait_mins;
      });
  },

  createQueueTicket: async ({ patientId, visitType, serviceStream, priorityLevel = 'NORMAL' }) => {
    let waitMins = 25;
    if (serviceStream === 'CHRONIC') waitMins = 12;
    if (serviceStream === 'PEDIATRIC') waitMins = 18;
    if (serviceStream === 'MATERNITY') waitMins = 20;
    if (serviceStream === 'TRIAGE_URGENT' || priorityLevel === 'EMERGENCY') waitMins = 2;

    const ticketNumber = `T-${ticketCounter++}`;

    if (getIsConnected()) {
      const vRes = await pool.query(`
        INSERT INTO visits (patient_id, visit_type, status, arrival_time)
        VALUES ($1, $2, 'REGISTERED', NOW())
        RETURNING *
      `, [patientId, visitType || 'GENERAL']);

      const visit = vRes.rows[0];

      const tRes = await pool.query(`
        INSERT INTO queue_tickets (visit_id, ticket_number, service_stream, priority_level, current_status, estimated_wait_mins)
        VALUES ($1, $2, $3, $4, 'WAITING', $5)
        RETURNING *
      `, [visit.id, ticketNumber, serviceStream, priorityLevel, waitMins]);

      return { visit, ticket: tRes.rows[0] };
    }

    const newVisitId = `v-${Date.now()}`;
    const newTicketId = `t-${Date.now()}`;

    const newVisit = {
      id: newVisitId,
      patient_id: patientId,
      visit_type: visitType || 'GENERAL',
      status: 'REGISTERED',
      arrival_time: new Date().toISOString()
    };
    mockVisits.push(newVisit);

    const newTicket = {
      id: newTicketId,
      visit_id: newVisitId,
      ticket_number: ticketNumber,
      service_stream: serviceStream,
      priority_level: priorityLevel,
      current_status: 'WAITING',
      estimated_wait_mins: waitMins,
      called_at: null,
      called_by: null
    };
    mockQueueTickets.push(newTicket);

    return { visit: newVisit, ticket: newTicket };
  },

  callNextTicket: async ({ ticketId, staffUserId, roomNumber = 'Room 1' }) => {
    if (getIsConnected()) {
      const tRes = await pool.query(`
        UPDATE queue_tickets SET
          current_status = 'SERVING',
          called_at = NOW(),
          called_by = $2
        WHERE id = $1
        RETURNING *
      `, [ticketId, staffUserId]);

      if (tRes.rows.length) {
        await pool.query(`
          UPDATE visits SET status = 'IN_CONSULTATION' WHERE id = $1
        `, [tRes.rows[0].visit_id]);
      }
      return tRes.rows[0];
    }

    const ticket = mockQueueTickets.find(t => t.id === ticketId);
    if (!ticket) return null;

    ticket.current_status = 'SERVING';
    ticket.called_at = new Date().toISOString();
    ticket.called_by = staffUserId;

    const visit = mockVisits.find(v => v.id === ticket.visit_id);
    if (visit) visit.status = 'IN_CONSULTATION';

    return ticket;
  },

  completeTicket: async (ticketId) => {
    if (getIsConnected()) {
      const tRes = await pool.query(`
        UPDATE queue_tickets SET current_status = 'COMPLETED' WHERE id = $1 RETURNING *
      `, [ticketId]);
      if (tRes.rows.length) {
        await pool.query(`
          UPDATE visits SET status = 'COMPLETED', completion_time = NOW() WHERE id = $1
        `, [tRes.rows[0].visit_id]);
      }
      return tRes.rows[0];
    }

    const ticket = mockQueueTickets.find(t => t.id === ticketId);
    if (!ticket) return null;
    ticket.current_status = 'COMPLETED';
    const visit = mockVisits.find(v => v.id === ticket.visit_id);
    if (visit) {
      visit.status = 'COMPLETED';
      visit.completion_time = new Date().toISOString();
    }
    return ticket;
  },

  // Vitals & Triage
  recordVitals: async (data) => {
    if (getIsConnected()) {
      const res = await pool.query(`
        INSERT INTO vitals (
          visit_id, recorded_by, blood_pressure_sys, blood_pressure_dia,
          heart_rate, respiratory_rate, temperature, blood_glucose,
          weight_kg, height_cm, sats_triage_color, triage_notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        data.visit_id, data.recorded_by, data.blood_pressure_sys, data.blood_pressure_dia,
        data.heart_rate, data.respiratory_rate, data.temperature, data.blood_glucose,
        data.weight_kg, data.height_cm, data.sats_triage_color || 'GREEN', data.triage_notes
      ]);

      await pool.query(`UPDATE visits SET status = 'TRIAGED' WHERE id = $1`, [data.visit_id]);
      return res.rows[0];
    }

    const newVitals = {
      id: `vit-${Date.now()}`,
      visit_id: data.visit_id,
      recorded_by: data.recorded_by,
      blood_pressure_sys: data.blood_pressure_sys,
      blood_pressure_dia: data.blood_pressure_dia,
      heart_rate: data.heart_rate,
      respiratory_rate: data.respiratory_rate,
      temperature: data.temperature,
      blood_glucose: data.blood_glucose,
      weight_kg: data.weight_kg,
      height_cm: data.height_cm,
      sats_triage_color: data.sats_triage_color || 'GREEN',
      triage_notes: data.triage_notes || '',
      recorded_at: new Date().toISOString()
    };
    mockVitals.push(newVitals);

    const visit = mockVisits.find(v => v.id === data.visit_id);
    if (visit) visit.status = 'TRIAGED';

    return newVitals;
  },

  // Consultations, SOAP Charting, Canvas drawings, and Prescriptions
  saveConsultation: async (data) => {
    if (getIsConnected()) {
      const cRes = await pool.query(`
        INSERT INTO consultations (
          visit_id, doctor_id, subjective_notes, objective_notes,
          assessment_notes, plan_notes, icd10_code, diagnosis_text,
          form_template, custom_template_data, canvas_drawing_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        data.visit_id, data.doctor_id, data.subjective_notes, data.objective_notes,
        data.assessment_notes, data.plan_notes, data.icd10_code, data.diagnosis_text,
        data.form_template || 'STANDARD_SOAP', JSON.stringify(data.custom_template_data || {}),
        data.canvas_drawing_data
      ]);

      const consult = cRes.rows[0];

      // Save prescriptions if provided
      if (data.prescriptions && Array.isArray(data.prescriptions)) {
        for (const rx of data.prescriptions) {
          await pool.query(`
            INSERT INTO prescriptions (
              consultation_id, medication_name, dosage, frequency,
              duration_days, is_ccmdd_repeat, ccmdd_pickup_point, dispensing_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
          `, [
            consult.id, rx.medication_name, rx.dosage, rx.frequency,
            rx.duration_days || 30, rx.is_ccmdd_repeat || false, rx.ccmdd_pickup_point
          ]);
        }
      }

      await pool.query(`UPDATE visits SET status = 'COMPLETED', completion_time = NOW() WHERE id = $1`, [data.visit_id]);
      return consult;
    }

    const newConsultId = `c-${Date.now()}`;
    const newConsult = {
      id: newConsultId,
      visit_id: data.visit_id,
      doctor_id: data.doctor_id,
      subjective_notes: data.subjective_notes || '',
      objective_notes: data.objective_notes || '',
      assessment_notes: data.assessment_notes || '',
      plan_notes: data.plan_notes || '',
      icd10_code: data.icd10_code || '',
      diagnosis_text: data.diagnosis_text || '',
      form_template: data.form_template || 'STANDARD_SOAP',
      custom_template_data: data.custom_template_data || {},
      canvas_drawing_data: data.canvas_drawing_data || null,
      created_at: new Date().toISOString()
    };
    mockConsultations.push(newConsult);

    if (data.prescriptions && Array.isArray(data.prescriptions)) {
      data.prescriptions.forEach(rx => {
        mockPrescriptions.push({
          id: `rx-${Date.now()}-${Math.random()}`,
          consultation_id: newConsultId,
          medication_name: rx.medication_name,
          dosage: rx.dosage,
          frequency: rx.frequency,
          duration_days: rx.duration_days || 30,
          is_ccmdd_repeat: rx.is_ccmdd_repeat || false,
          ccmdd_pickup_point: rx.ccmdd_pickup_point || '',
          dispensing_status: 'PENDING'
        });
      });
    }

    const visit = mockVisits.find(v => v.id === data.visit_id);
    if (visit) {
      visit.status = 'COMPLETED';
      visit.completion_time = new Date().toISOString();
    }

    return newConsult;
  },

  saveAttachment: async (data) => {
    if (getIsConnected()) {
      const res = await pool.query(`
        INSERT INTO clinical_attachments (
          consultation_id, visit_id, file_name, file_type, file_url, ocr_extracted_text
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        data.consultation_id || null, data.visit_id || null,
        data.file_name, data.file_type, data.file_url, data.ocr_extracted_text || ''
      ]);
      return res.rows[0];
    }

    const newAttach = {
      id: `att-${Date.now()}`,
      consultation_id: data.consultation_id || null,
      visit_id: data.visit_id || null,
      file_name: data.file_name,
      file_type: data.file_type,
      file_url: data.file_url,
      ocr_extracted_text: data.ocr_extracted_text || '',
      uploaded_at: new Date().toISOString()
    };
    mockAttachments.push(newAttach);
    return newAttach;
  },

  getVisitDetails: async (visitId) => {
    if (getIsConnected()) {
      const vRes = await pool.query(`
        SELECT v.*, p.first_name, p.last_name, p.file_number, p.national_id, p.date_of_birth, p.gender, p.phone_number, p.known_allergies, p.chronic_conditions
        FROM visits v
        JOIN patients p ON v.patient_id = p.id
        WHERE v.id = $1
      `, [visitId]);
      if (!vRes.rows.length) return null;
      const visit = vRes.rows[0];

      const vitRes = await pool.query(`SELECT * FROM vitals WHERE visit_id = $1 ORDER BY recorded_at DESC LIMIT 1`, [visitId]);
      visit.vitals = vitRes.rows[0] || null;

      const cRes = await pool.query(`SELECT * FROM consultations WHERE visit_id = $1 ORDER BY created_at DESC LIMIT 1`, [visitId]);
      visit.consultation = cRes.rows[0] || null;

      if (visit.consultation) {
        const rxRes = await pool.query(`SELECT * FROM prescriptions WHERE consultation_id = $1`, [visit.consultation.id]);
        visit.prescriptions = rxRes.rows;
      } else {
        visit.prescriptions = [];
      }

      const attRes = await pool.query(`SELECT * FROM clinical_attachments WHERE visit_id = $1`, [visitId]);
      visit.attachments = attRes.rows;

      return visit;
    }

    const visit = mockVisits.find(v => v.id === visitId);
    if (!visit) return null;
    const patient = mockPatients.find(p => p.id === visit.patient_id);
    const vitals = mockVitals.find(vit => vit.visit_id === visitId);
    const consultation = mockConsultations.find(c => c.visit_id === visitId);
    const prescriptions = consultation ? mockPrescriptions.filter(rx => rx.consultation_id === consultation.id) : [];
    const attachments = mockAttachments.filter(att => att.visit_id === visitId);

    return {
      ...visit,
      patient,
      vitals: vitals || null,
      consultation: consultation || null,
      prescriptions,
      attachments
    };
  }
};

module.exports = store;
