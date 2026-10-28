# Public Clinic Smart Queue & USSD Triage System

> **Live Application**: [https://bongamanzini.github.io/public-clinic-smart-queue/](https://bongamanzini.github.io/public-clinic-smart-queue/)

An interactive healthcare process re-engineering and virtual ticketing platform designed for South African primary healthcare clinics to replace 6+ hour physical queues with slot-based arrivals.

---

## The Informatics & Systems Analysis Angle

- **The Problem**: Patients across South African township and rural clinics arrive as early as 04:30 AM and wait 6 to 8 hours in congested waiting halls, exposing vulnerable infants and immunocompromised patients to airborne pathogens (TB, influenza).
- **The Informatics Re-Engineering Solution**:
  - Virtual queue token allocation via zero-data **USSD (`*120*2546#`)** and mobile web.
  - Stream separation: Fast-tracking repeat chronic medication pickups (CCMDD / Central Chronic Medicines Dispensing and Distribution) away from doctor consultation lines.
  - SMS call-forward notifications: Patients only arrive at the clinic 15 minutes prior to their consultation window.

---

## ️ Features

- **Patient Self Check-In**: Virtual ticket token generator allocating department-specific queue numbers.
- **USSD Gateway Simulator**: Illustrates how non-smartphone users access the queue on basic feature phones.
- **Nurse & Triage Station Dashboard**: Live patient calling console with emergency priority triage overrides and real-time wait telemetry.
- **Triage Protocols**: South African Triage Scale (SATS) color coding (Red, Orange, Yellow, Green).

---

## Tech Stack

- **Frontend**: HTML5, Vanilla JavaScript (ESNext)
- **Styling**: Tailwind CSS
- **Icons**: Lucide Icons
- **Deployment**: GitHub Pages

---

## ‍ Author

**Bonga Manzini** 
BSc Informatics – University of South Africa (UNISA) 
Portfolio: [https://bongamanzini.github.io/portfolio/](https://bongamanzini.github.io/portfolio/)
