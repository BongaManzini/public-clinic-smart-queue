# Public Clinic Smart Queue & Electronic Health Record (EHR) System

> **A South African Primary Healthcare (PHC) Process Re-Engineering Platform**  
> Uniting asynchronous virtual queueing, South African Triage Scale (SATS) scoring, and longitudinal Electronic Health Records (EHR) with physical-to-digital clinical note capture.

---

## 🏛️ The Healthcare Systems Problem & Solution

In South African township and rural clinics, vulnerable patients queue outside as early as 04:30 AM and endure 6 to 8 hours in congested waiting halls, exacerbating airborne contagion (TB, influenza) and administrative gridlock. 

This platform re-engineers the clinic workflow across three coordinated stations:

1. **Admissions & Reception**: Virtual ticketing via zero-data **USSD (`*120*2546#`)** and mobile web, instant South African ID verification, and longitudinal electronic file creation.
2. **SATS Triage & Vitals Station**: Physiological parameter recording (BP, Pulse, Respiratory Rate, Temp, Glucose, Weight) with automated **South African Triage Scale (SATS)** color classification (Red, Orange, Yellow, Green).
3. **Doctor Consultation & Charting Suite**: Longitudinal medical history, prescriptions with **CCMDD / PUP** chronic pickup point allocation, and a dedicated **Physical-to-Digital Note Capture Engine**.

```mermaid
flowchart LR
    A["Patient / USSD Check-In"] --> B["Smart Queue System"]
    B <--> C["Receptionist Desk (Intake & Search)"]
    C <--> D["Nurse Triage (SATS Vitals & Scoring)"]
    D <--> E["Doctor / Clinician (SOAP Charting & Scripts)"]
    E <--> F["Pharmacy / CCMDD Dispensing"]
    
    subgraph "Core Data & Sync Engine"
        G[("PostgreSQL DB")]
        H["Socket.io Real-Time Bus"]
    end
    
    C --- G
    D --- G
    E --- G
    F --- G
    C --- H
    D --- H
    E --- H
```

---

## ✍️ Physical-to-Digital Clinical Note Engine

Recognizing that clinical staff rely on physical paper folders, booklets, and rapid pen notes, the system provides three integrated modalities:

1. **Freehand Stylus & Paper Drawing Pad**:
   - Interactive HTML5 canvas for pen, mouse, or touchscreen input.
   - Ruled clinical paper lines, blank sheet, and anatomical body outline charts for trauma, surgical, or dermatology markings.
   - Doctor's digital signature and handwriting saved directly into the encounter record.

2. **Document Photo / Scan Upload & OCR Viewer**:
   - High-resolution photo upload of physical clinic green cards, referral letters, and lab slips.
   - Interactive image viewer with zoom, pan, and 90° rotation.
   - In-browser **Tesseract.js OCR** that extracts printed/typed text straight into the doctor's SOAP notes with one click.

3. **South African PHC Stationery Simulation**:
   - **Adult PHC Comprehensive Green Card**: Chronic monitoring, BP trends, lifestyle counseling.
   - **Child Health (Road to Health Booklet - RTHB)**: Growth monitoring and immunization tracking.
   - **CCMDD / PUP Repeat Script**: Chronic medication collection scheduling for external pickup points (e.g. Clicks, MediRite, local community halls).
   - **Standard SOAP Note**: Structured Subjective, Objective, Assessment, Plan with ICD-10 diagnostic coding.

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express, Socket.io (real-time WebSocket event bus), Multer, JWT, Bcrypt.
- **Database**: PostgreSQL (relational schema with automated migrations and connection pooling), with resilient zero-setup in-memory fallback for instant local preview.
- **Frontend**: Vite, React 18, Tailwind CSS, Lucide Icons.
- **OCR Engine**: Tesseract.js (client/server optical character recognition).
- **Interactive Canvas**: HTML5 Canvas with dual-resolution scaling and stroke history.

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer)
- npm

### 2. Installation
Clone the repository and install dependencies:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
cd ..
```

### 3. Database Configuration (PostgreSQL)
The backend is pre-configured to connect to PostgreSQL (e.g., [Neon](https://neon.tech/), [Supabase](https://supabase.com/), [Render](https://render.com/), or a local Postgres instance).

Create or edit `server/.env`:
```env
PORT=5000
DATABASE_URL=postgres://username:password@your-cloud-postgres-host/clinic_ehr?sslmode=require
JWT_SECRET=clinic_super_secret_jwt_key_2026_sa_phc_reengineering
```

To initialize tables and seed realistic South African clinic demo data:
```bash
# Run PostgreSQL migration
npm run migrate

# Seed sample patients, triage vitals, and visits
npm run seed
```

*(Note: If no PostgreSQL instance is configured yet, the system automatically runs in resilient in-memory mode with full functionality!)*

### 4. Running the Application

To run the unified production build (Frontend + Backend on port `5000`):
```bash
# Build frontend
npm run build

# Start server
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser.

To run in development mode with hot reloading:
```bash
# Terminal 1: Backend API & WebSockets (Port 5000)
npm run server

# Terminal 2: Vite Frontend (Port 3000)
npm run client
```

---

## 👥 Demo Staff Credentials

| Role | Username | Password | Staff Name | Primary Station |
| :--- | :--- | :--- | :--- | :--- |
| **Receptionist** | `receptionist` | `password123` | Sister Thandi Sithole | Admissions & Intake |
| **Nurse** | `nurse` | `password123` | Staff Nurse Sipho Dlamini | SATS Triage & Vitals |
| **Doctor** | `doctor` | `password123` | Dr. Lesedi Khumalo | Consultation Room 4 |
| **Admin** | `admin` | `password123` | Bonga Manzini | Clinic Administration |

*(A 1-click station switcher is also provided in the top navigation bar for seamless demonstration across desks).*

---

## 👨‍💻 Author

**Bonga Manzini**  
BSc Informatics – University of South Africa (UNISA)  
Public Health Information Systems & Process Re-Engineering  
Portfolio: [https://bongamanzini.github.io/portfolio/](https://bongamanzini.github.io/portfolio/)
