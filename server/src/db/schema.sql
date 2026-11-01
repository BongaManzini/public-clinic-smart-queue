-- PostgreSQL Schema for Public Clinic Smart Queue & EHR System

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('RECEPTIONIST', 'NURSE', 'DOCTOR', 'ADMIN')),
    staff_code VARCHAR(30) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_number VARCHAR(30) UNIQUE NOT NULL,
    national_id VARCHAR(30),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    phone_number VARCHAR(30),
    residential_address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(30),
    known_allergies TEXT,
    chronic_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_type VARCHAR(50) NOT NULL CHECK (visit_type IN ('GENERAL', 'CHRONIC_MEDS', 'PEDIATRIC', 'MATERNITY', 'EMERGENCY_TRIAGE')),
    status VARCHAR(30) NOT NULL DEFAULT 'REGISTERED' CHECK (status IN ('REGISTERED', 'TRIAGED', 'IN_CONSULTATION', 'PHARMACY', 'COMPLETED', 'DISCHARGED')),
    arrival_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completion_time TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS queue_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    ticket_number VARCHAR(20) NOT NULL,
    service_stream VARCHAR(30) NOT NULL,
    priority_level VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (priority_level IN ('NORMAL', 'FAST_TRACK', 'EMERGENCY')),
    current_status VARCHAR(30) NOT NULL DEFAULT 'WAITING' CHECK (current_status IN ('WAITING', 'CALLING', 'SERVING', 'COMPLETED', 'MISSED')),
    estimated_wait_mins INT DEFAULT 20,
    called_at TIMESTAMP WITH TIME ZONE,
    called_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    recorded_by UUID REFERENCES users(id),
    blood_pressure_sys INT,
    blood_pressure_dia INT,
    heart_rate INT,
    respiratory_rate INT,
    temperature DECIMAL(4, 1),
    blood_glucose DECIMAL(4, 1),
    weight_kg DECIMAL(5, 2),
    height_cm DECIMAL(5, 1),
    sats_triage_color VARCHAR(20) NOT NULL DEFAULT 'GREEN' CHECK (sats_triage_color IN ('RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE')),
    triage_notes TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id),
    subjective_notes TEXT,
    objective_notes TEXT,
    assessment_notes TEXT,
    plan_notes TEXT,
    icd10_code VARCHAR(20),
    diagnosis_text TEXT,
    form_template VARCHAR(50) DEFAULT 'STANDARD_SOAP',
    custom_template_data JSONB,
    canvas_drawing_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clinical_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    ocr_extracted_text TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    medication_name VARCHAR(150) NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    duration_days INT DEFAULT 30,
    is_ccmdd_repeat BOOLEAN DEFAULT FALSE,
    ccmdd_pickup_point VARCHAR(100),
    dispensing_status VARCHAR(30) DEFAULT 'PENDING' CHECK (dispensing_status IN ('PENDING', 'DISPENSED', 'COLLECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_patients_file_number ON patients(file_number);
CREATE INDEX IF NOT EXISTS idx_patients_national_id ON patients(national_id);
CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_queue_tickets_status ON queue_tickets(current_status);
CREATE INDEX IF NOT EXISTS idx_vitals_visit_id ON vitals(visit_id);
CREATE INDEX IF NOT EXISTS idx_consultations_visit_id ON consultations(visit_id);
