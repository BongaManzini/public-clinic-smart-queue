import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Ticket, Users, ArrowRight, ShieldCheck, CheckCircle2, Phone, AlertCircle } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import PatientFileModal from './PatientFileModal';

export default function ReceptionistView() {
  const { liveQueue, refreshQueue } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [enqueuingPatient, setEnqueuingPatient] = useState(null);
  const [selectedStream, setSelectedStream] = useState('GENERAL');
  const [priorityLevel, setPriorityLevel] = useState('NORMAL');
  const [ticketSuccess, setTicketSuccess] = useState(null);

  // New Patient Form State
  const [newPatient, setNewPatient] = useState({
    firstName: '',
    lastName: '',
    nationalId: '',
    dateOfBirth: '',
    gender: 'Female',
    phoneNumber: '',
    residentialAddress: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    knownAllergies: '',
    chronicConditions: ''
  });

  useEffect(() => {
    fetchPatients(searchQuery);
  }, [searchQuery]);

  const fetchPatients = async (query = '') => {
    try {
      const res = await fetch(`/api/patients?search=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('clinic_auth_token') || ''}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || []);
      }
    } catch (err) {
      console.warn('Patient search error:', err.message);
    }
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('clinic_auth_token') || ''}`
        },
        body: JSON.stringify(newPatient)
      });
      if (res.ok) {
        const data = await res.json();
        setIsRegistering(false);
        fetchPatients(data.patient.first_name);
        setEnqueuingPatient(data.patient);
        setNewPatient({
          firstName: '',
          lastName: '',
          nationalId: '',
          dateOfBirth: '',
          gender: 'Female',
          phoneNumber: '',
          residentialAddress: '',
          emergencyContactName: '',
          emergencyContactPhone: '',
          knownAllergies: '',
          chronicConditions: ''
        });
      }
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  const handleEnqueue = async (patient) => {
    try {
      const res = await fetch('/api/queue/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          serviceStream: selectedStream,
          visitType: selectedStream,
          priorityLevel: selectedStream === 'CHRONIC' ? 'FAST_TRACK' : priorityLevel
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTicketSuccess(data.ticket);
        setEnqueuingPatient(null);
        refreshQueue();
      }
    } catch (err) {
      console.error('Enqueue error:', err);
    }
  };

  const openFullFile = async (patientId) => {
    try {
      const res = await fetch(`/api/patients/${patientId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('clinic_auth_token') || ''}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedPatient(data.patient);
      }
    } catch (err) {
      console.error('Fetch file error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111111] border border-[#262626] rounded-md p-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400"></span>
            <h2 className="text-lg font-bold text-white">Admissions & Reception Station</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Register new patient records, verify South African IDs, and dispatch virtual tickets to clinical streams.
          </p>
        </div>

        <button
          onClick={() => setIsRegistering(!isRegistering)}
          className="px-4 py-2.5 rounded-md bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-2 transition-all shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>{isRegistering ? 'Back to Search' : 'Register New Patient'}</span>
        </button>
      </div>

      {ticketSuccess && (
        <div className="p-4 rounded-md bg-teal-950/40 border border-teal-500/40 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">
                Queue Ticket <span className="font-mono text-teal-300 text-sm">{ticketSuccess.ticket_number}</span> Generated Successfully!
              </p>
              <p className="text-[11px] text-teal-200/80">
                Stream: {ticketSuccess.service_stream} • Estimated Arrival Window: ~{ticketSuccess.estimated_wait_mins} mins
              </p>
            </div>
          </div>
          <button
            onClick={() => setTicketSuccess(null)}
            className="text-xs font-mono text-teal-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {isRegistering ? (
        /* Patient Registration Form */
        <div className="bg-[#111111] border border-[#262626] rounded-md p-6">
          <h3 className="text-sm font-bold text-white font-mono uppercase mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-teal-400" />
            <span>Create New South African PHC Patient File</span>
          </h3>

          <form onSubmit={handleRegisterPatient} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-mono text-slate-300 uppercase block mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={newPatient.firstName}
                  onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })}
                  placeholder="e.g. Sindi"
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="font-mono text-slate-300 uppercase block mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={newPatient.lastName}
                  onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })}
                  placeholder="e.g. Zulu"
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="font-mono text-slate-300 uppercase block mb-1">South African ID / Passport</label>
                <input
                  type="text"
                  maxLength={13}
                  value={newPatient.nationalId}
                  onChange={(e) => setNewPatient({ ...newPatient, nationalId: e.target.value })}
                  placeholder="13-digit SA ID number"
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-mono text-slate-300 uppercase block mb-1">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={newPatient.dateOfBirth}
                  onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="font-mono text-slate-300 uppercase block mb-1">Gender *</label>
                <select
                  value={newPatient.gender}
                  onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="font-mono text-slate-300 uppercase block mb-1">Mobile Phone Number</label>
                <input
                  type="tel"
                  value={newPatient.phoneNumber}
                  onChange={(e) => setNewPatient({ ...newPatient, phoneNumber: e.target.value })}
                  placeholder="e.g. 082 123 4567"
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-slate-300 uppercase block mb-1">Residential Address</label>
                <input
                  type="text"
                  value={newPatient.residentialAddress}
                  onChange={(e) => setNewPatient({ ...newPatient, residentialAddress: e.target.value })}
                  placeholder="Street address, Township / Suburb"
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="font-mono text-slate-300 uppercase block mb-1">Emergency Contact (Name & Phone)</label>
                <input
                  type="text"
                  value={newPatient.emergencyContactName}
                  onChange={(e) => setNewPatient({ ...newPatient, emergencyContactName: e.target.value })}
                  placeholder="e.g. Sipho Zulu (071 999 8877)"
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-rose-400 uppercase block mb-1 font-bold">Known Allergies</label>
                <input
                  type="text"
                  value={newPatient.knownAllergies}
                  onChange={(e) => setNewPatient({ ...newPatient, knownAllergies: e.target.value })}
                  placeholder="e.g. Penicillin, Aspirin (or None)"
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="font-mono text-teal-400 uppercase block mb-1 font-bold">Chronic Conditions (CCMDD)</label>
                <input
                  type="text"
                  value={newPatient.chronicConditions}
                  onChange={(e) => setNewPatient({ ...newPatient, chronicConditions: e.target.value })}
                  placeholder="e.g. Hypertension, Diabetes, Asthma"
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsRegistering(false)}
                className="px-4 py-2 rounded bg-[#202020] text-slate-300 font-mono"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold font-mono"
              >
                Save Patient File
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Patient Search & Directory Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Search & Directory (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient by Name, South African ID, or Clinic File #..."
                className="w-full bg-[#111111] border border-[#262626] rounded-md pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="bg-[#111111] border border-[#262626] rounded-md divide-y divide-[#202020]">
              <div className="p-3 bg-[#161616] flex items-center justify-between text-xs font-mono text-slate-400 font-semibold uppercase">
                <span>Patient Directory ({patients.length} records)</span>
                <span>Actions</span>
              </div>

              {patients.length > 0 ? (
                patients.map((p) => (
                  <div key={p.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#151515] transition-colors">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {p.first_name} {p.last_name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/10 text-teal-400 border border-teal-500/20">
                          {p.file_number}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        ID: {p.national_id || 'N/A'} • DOB: {p.date_of_birth} ({p.gender})
                      </p>
                      {p.chronic_conditions && p.chronic_conditions !== 'None' && (
                        <p className="text-[11px] text-teal-300 font-mono">
                          CCMDD: {p.chronic_conditions}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openFullFile(p.id)}
                        className="px-3 py-1.5 rounded bg-[#202020] hover:bg-[#2a2a2a] text-slate-300 text-xs font-mono border border-[#333333]"
                      >
                        View File
                      </button>
                      <button
                        onClick={() => setEnqueuingPatient(p)}
                        className="px-3 py-1.5 rounded bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Issue Ticket</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No matching patients found. Click &quot;Register New Patient&quot; above to create a file.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Ticket Dispatch Station (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#111111] border border-[#262626] rounded-md p-5 space-y-4">
              <h3 className="text-xs font-mono uppercase text-teal-400 font-bold flex items-center gap-2">
                <Ticket className="w-4 h-4" />
                <span>Virtual Queue Dispatch Station</span>
              </h3>

              {enqueuingPatient ? (
                <div className="p-3 rounded bg-teal-950/20 border border-teal-500/30 text-xs space-y-1">
                  <span className="text-[10px] font-mono text-teal-400 block font-bold uppercase">Target Patient</span>
                  <p className="text-white font-bold text-sm">
                    {enqueuingPatient.first_name} {enqueuingPatient.last_name}
                  </p>
                  <p className="text-slate-400 font-mono text-[11px]">
                    File: {enqueuingPatient.file_number}
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded bg-[#0a0a0a] border border-[#262626] text-xs text-slate-400">
                  Select a patient from the directory on the left or use Quick Walk-In check-in below.
                </div>
              )}

              <div>
                <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">Clinical Service Stream</label>
                <select
                  value={selectedStream}
                  onChange={(e) => setSelectedStream(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="CHRONIC">Fast-Track Chronic Meds (PUP / CCMDD)</option>
                  <option value="GENERAL">General Doctor / Nurse Outpatient</option>
                  <option value="PEDIATRIC">Child Health, Weighing & Immunization</option>
                  <option value="MATERNITY">Antenatal & Maternity Care</option>
                  <option value="TRIAGE_URGENT">Acute Priority / Emergency Triage</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">Priority Override</label>
                <select
                  value={priorityLevel}
                  onChange={(e) => setPriorityLevel(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="NORMAL">Normal Arrival</option>
                  <option value="FAST_TRACK">Fast-Track (CCMDD Stream)</option>
                  <option value="EMERGENCY">Emergency SATS Red/Orange Priority</option>
                </select>
              </div>

              <button
                disabled={!enqueuingPatient && patients.length === 0}
                onClick={() => handleEnqueue(enqueuingPatient || patients[0])}
                className="w-full py-2.5 rounded bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Ticket className="w-4 h-4" />
                <span>Dispatch Patient into Smart Queue</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Patient File Modal */}
      {selectedPatient && (
        <PatientFileModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onEnqueue={(p) => setEnqueuingPatient(p)}
        />
      )}
    </div>
  );
}
