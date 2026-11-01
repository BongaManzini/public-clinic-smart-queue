import React, { useState, useEffect } from 'react';
import {
  Stethoscope, Megaphone, CheckCircle2, AlertTriangle, FileText,
  PenTool, Image as ImageIcon, Pill, Plus, Trash2, ArrowRight, Clock,
  Heart, ShieldAlert, Sparkles, BookOpen
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import CanvasDrawingPad from './CanvasDrawingPad';
import DocumentOcrViewer from './DocumentOcrViewer';

export default function DoctorConsultView() {
  const { liveQueue, refreshQueue } = useSocket();
  const { user } = useAuth();

  const [activeEncounter, setActiveEncounter] = useState(null);
  const [activeTab, setActiveTab] = useState('chart'); // 'chart', 'drawing', 'ocr', 'prescriptions'
  const [formTemplate, setFormTemplate] = useState('ADULT_PHC'); // 'ADULT_PHC', 'RTHB_CHILD', 'CCMDD', 'STANDARD_SOAP'

  // SOAP & Clinical Charting State
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [icd10, setIcd10] = useState('I10');
  const [diagnosis, setDiagnosis] = useState('Essential (primary) hypertension');
  const [drawingData, setDrawingData] = useState(null);

  // Prescriptions State
  const [prescriptions, setPrescriptions] = useState([
    { medication_name: 'Enalapril 10mg Tablets', dosage: '10mg', frequency: 'Once daily morning', duration_days: 30, is_ccmdd_repeat: true, ccmdd_pickup_point: 'Orlando West Community Hall' }
  ]);
  const [newRx, setNewRx] = useState({
    medication_name: '',
    dosage: '',
    frequency: 'Once daily',
    duration_days: 30,
    is_ccmdd_repeat: false,
    ccmdd_pickup_point: 'Local Clinic Pharmacy'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSuccess, setCompletedSuccess] = useState('');

  // Auto-load currently serving patient or first triaged patient
  useEffect(() => {
    const serving = liveQueue.find(q => q.current_status === 'SERVING');
    if (serving && (!activeEncounter || activeEncounter.ticket_id !== serving.ticket_id)) {
      setActiveEncounter(serving);
    }
  }, [liveQueue]);

  const callPatientToRoom = async (ticket) => {
    try {
      const res = await fetch('/api/queue/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('clinic_auth_token') || ''}`
        },
        body: JSON.stringify({ ticketId: ticket.ticket_id, roomNumber: 'Consultation Room 4' })
      });
      if (res.ok) {
        setActiveEncounter(ticket);
        refreshQueue();
      }
    } catch (err) {
      console.error('Call patient error:', err);
    }
  };

  const handleAddPrescription = () => {
    if (!newRx.medication_name) return;
    setPrescriptions([...prescriptions, newRx]);
    setNewRx({
      medication_name: '',
      dosage: '',
      frequency: 'Once daily',
      duration_days: 30,
      is_ccmdd_repeat: false,
      ccmdd_pickup_point: 'Local Clinic Pharmacy'
    });
  };

  const handleRemovePrescription = (idx) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== idx));
  };

  const handleOcrTextExtracted = (text) => {
    // Append OCR text to Objective or Assessment
    setObjective(prev => prev ? `${prev}\n\n[OCR Scanned Paper Record]:\n${text}` : `[OCR Scanned Paper Record]:\n${text}`);
    setActiveTab('chart');
  };

  const handleCompleteConsultation = async () => {
    if (!activeEncounter) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('clinic_auth_token') || ''}`
        },
        body: JSON.stringify({
          visitId: activeEncounter.visit_id,
          subjectiveNotes: subjective,
          objectiveNotes: objective,
          assessmentNotes: assessment,
          planNotes: plan,
          icd10Code: icd10,
          diagnosisText: diagnosis,
          formTemplate,
          canvasDrawingData: drawingData,
          prescriptions
        })
      });

      if (res.ok) {
        setCompletedSuccess(`Consultation for ${activeEncounter.first_name} ${activeEncounter.last_name} (${activeEncounter.ticket_number}) finalized and digitally signed.`);
        setActiveEncounter(null);
        setSubjective('');
        setObjective('');
        setAssessment('');
        setPlan('');
        setDrawingData(null);
        refreshQueue();
      }
    } catch (err) {
      console.error('Finalize consult error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111111] border border-[#262626] rounded-md p-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <h2 className="text-lg font-bold text-white">Doctor Consultation & Charting Suite</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Conduct longitudinal consultations, review triage vitals, write prescriptions, and digitize paper notes via stylus canvas and OCR.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-[#161616] text-slate-300 font-mono text-xs border border-[#262626]">
            {user?.fullName || 'Dr. Lesedi Khumalo'} (Room 4)
          </span>
        </div>
      </div>

      {completedSuccess && (
        <div className="p-3.5 rounded-md bg-teal-950/40 border border-teal-500/40 flex items-center justify-between text-xs text-teal-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>{completedSuccess}</span>
          </div>
          <button onClick={() => setCompletedSuccess('')} className="font-mono text-teal-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Queue Calling Strip (4 cols) and Consultation HUD (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Queue Calling Strip */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#111111] border border-[#262626] rounded-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono uppercase text-slate-300 font-bold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-400" />
                <span>Next Patients in Queue</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-500">{liveQueue.length} Waiting</span>
            </div>

            <div className="space-y-2">
              {liveQueue.length > 0 ? (
                liveQueue.map((item) => (
                  <div
                    key={item.ticket_id}
                    className={`p-3 rounded-md border text-xs transition-all ${
                      activeEncounter?.ticket_id === item.ticket_id
                        ? 'bg-cyan-950/30 border-cyan-500/60 shadow-sm'
                        : 'bg-[#0a0a0a] border-[#262626] hover:border-[#383838]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black font-mono text-white text-sm">{item.ticket_number}</span>
                      <span className="font-semibold text-slate-200">{item.first_name} {item.last_name}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>{item.service_stream}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                        item.sats_triage_color === 'RED' ? 'text-rose-400 font-bold' :
                        item.sats_triage_color === 'ORANGE' ? 'text-amber-400 font-bold' :
                        item.sats_triage_color === 'YELLOW' ? 'text-yellow-400' : 'text-emerald-400'
                      }`}>
                        Triage: {item.sats_triage_color || 'PENDING'}
                      </span>
                    </div>

                    <button
                      onClick={() => callPatientToRoom(item)}
                      className="w-full mt-2.5 py-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Megaphone className="w-3 h-3 text-cyan-400" />
                      <span>Call to Consultation Room</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No patients waiting in queue.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Active Consultation Charting HUD */}
        <div className="lg:col-span-8 space-y-4">
          {activeEncounter ? (
            <div className="bg-[#111111] border border-[#262626] rounded-md p-5 space-y-5">
              {/* Patient Banner & Vitals Summary */}
              <div className="bg-[#0a0a0a] border border-[#262626] rounded-md p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1c1c1c] pb-3 mb-3">
                  <div>
                    <span className="text-[10px] font-mono text-teal-400 uppercase block font-bold">Currently Consulting</span>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{activeEncounter.first_name} {activeEncounter.last_name}</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {activeEncounter.ticket_number}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      File: {activeEncounter.file_number} • Stream: {activeEncounter.service_stream}
                    </p>
                  </div>

                  {/* SATS Acuity Tag */}
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-500 block">TRIAGE STATUS</span>
                    <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold inline-block mt-0.5 ${
                      activeEncounter.sats_triage_color === 'RED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      activeEncounter.sats_triage_color === 'ORANGE' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      activeEncounter.sats_triage_color === 'YELLOW' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {activeEncounter.sats_triage_color ? `SATS: ${activeEncounter.sats_triage_color}` : 'Routine Walk-In'}
                    </span>
                  </div>
                </div>

                {/* Vitals Telemetry Row */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
                  <div className="bg-[#141414] p-2 rounded">
                    <span className="text-slate-500 text-[10px] block">BP:</span>
                    <span className="text-white font-bold">
                      {activeEncounter.blood_pressure_sys ? `${activeEncounter.blood_pressure_sys}/${activeEncounter.blood_pressure_dia}` : '142/92'} mmHg
                    </span>
                  </div>
                  <div className="bg-[#141414] p-2 rounded">
                    <span className="text-slate-500 text-[10px] block">HEART RATE:</span>
                    <span className="text-white font-bold">{activeEncounter.heart_rate || '78'} bpm</span>
                  </div>
                  <div className="bg-[#141414] p-2 rounded">
                    <span className="text-slate-500 text-[10px] block">TEMP:</span>
                    <span className="text-white font-bold">{activeEncounter.temperature || '36.6'} °C</span>
                  </div>
                  <div className="bg-[#141414] p-2 rounded">
                    <span className="text-slate-500 text-[10px] block">ALLERGIES:</span>
                    <span className="text-rose-400 font-bold truncate block">{activeEncounter.known_allergies || 'Penicillin'}</span>
                  </div>
                  <div className="bg-[#141414] p-2 rounded">
                    <span className="text-slate-500 text-[10px] block">CHRONIC:</span>
                    <span className="text-teal-400 font-bold truncate block">{activeEncounter.chronic_conditions || 'Hypertension'}</span>
                  </div>
                </div>
              </div>

              {/* Consultation Navigation Tabs */}
              <div className="flex border-b border-[#262626] text-xs font-mono gap-1">
                {[
                  { id: 'chart', label: 'Clinical SOAP Chart', icon: FileText },
                  { id: 'drawing', label: 'Stylus & Paper Pad', icon: PenTool },
                  { id: 'ocr', label: 'Paper Scan & OCR', icon: ImageIcon },
                  { id: 'prescriptions', label: `Prescriptions (${prescriptions.length})`, icon: Pill }
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`px-3.5 py-2.5 rounded-t font-semibold flex items-center gap-1.5 transition-all ${
                        activeTab === t.id
                          ? 'bg-[#181818] text-teal-400 border-t-2 border-teal-400'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-[#141414]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: SOAP Chart & South African PHC Stationery */}
              {activeTab === 'chart' && (
                <div className="space-y-4 text-xs">
                  {/* Template Switcher */}
                  <div className="flex items-center justify-between bg-[#161616] p-2.5 rounded border border-[#262626]">
                    <span className="font-mono text-slate-400 text-[11px] font-bold uppercase flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                      Stationery Form Template:
                    </span>
                    <select
                      value={formTemplate}
                      onChange={(e) => setFormTemplate(e.target.value)}
                      className="bg-[#0a0a0a] border border-[#262626] rounded px-3 py-1 text-slate-200 text-xs focus:outline-none focus:border-teal-500"
                    >
                      <option value="ADULT_PHC">Adult PHC Green Card (Comprehensive)</option>
                      <option value="RTHB_CHILD">Child Road to Health Booklet (RTHB)</option>
                      <option value="CCMDD">CCMDD / PUP Chronic Repeat Dispensing</option>
                      <option value="STANDARD_SOAP">Standard Clinical SOAP Notes</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-mono text-slate-300 uppercase block mb-1 font-bold">
                        Subjective (S) - History of Presenting Complaint
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Patient reports 3-day occipital headache, palpitations, dizziness. Reports adhering to medication..."
                        value={subjective}
                        onChange={(e) => setSubjective(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#262626] rounded p-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="font-mono text-slate-300 uppercase block mb-1 font-bold">
                        Objective (O) - Physical Examination & Lab Findings
                      </label>
                      <textarea
                        rows={4}
                        placeholder="BP 142/92 mmHg, Pulse 78 bpm regular. Chest clear, heart sounds dual. No pedal edema..."
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#262626] rounded p-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-mono text-slate-300 uppercase block mb-1 font-bold">
                        Assessment (A) & Clinical Diagnosis
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={icd10}
                          onChange={(e) => setIcd10(e.target.value)}
                          placeholder="ICD-10 (e.g. I10)"
                          className="w-24 bg-[#0a0a0a] border border-[#262626] rounded px-2.5 py-1.5 font-mono text-teal-300 font-bold focus:outline-none focus:border-teal-500"
                        />
                        <input
                          type="text"
                          value={diagnosis}
                          onChange={(e) => setDiagnosis(e.target.value)}
                          placeholder="Diagnosis Description"
                          className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      <textarea
                        rows={3}
                        placeholder="Clinical impression and stage: Essential Hypertension inadequately controlled..."
                        value={assessment}
                        onChange={(e) => setAssessment(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#262626] rounded p-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="font-mono text-slate-300 uppercase block mb-1 font-bold">
                        Plan (P) & Treatment Regimen
                      </label>
                      <textarea
                        rows={5}
                        placeholder="Step up therapy: Add Hydrochlorothiazide 12.5mg daily. Review U&E in 4 weeks. Salt restriction counseling provided..."
                        value={plan}
                        onChange={(e) => setPlan(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#262626] rounded p-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Freehand Stylus & Paper Drawing Pad */}
              {activeTab === 'drawing' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400">
                    Use a stylus, touchscreen, or mouse to sketch clinical body charts, document lesions/incisions, add handwritten notes, or sign the encounter.
                  </p>
                  <CanvasDrawingPad onSave={(data) => setDrawingData(data)} initialData={drawingData} />
                </div>
              )}

              {/* TAB 3: Document Scan & OCR Digitizer */}
              {activeTab === 'ocr' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400">
                    Photograph or upload physical clinic cards, paper referral letters, or laboratory slips to view with zoom/pan and run OCR text conversion.
                  </p>
                  <DocumentOcrViewer onTextExtracted={handleOcrTextExtracted} visitId={activeEncounter.visit_id} />
                </div>
              )}

              {/* TAB 4: Prescriptions & Dispensing */}
              {activeTab === 'prescriptions' && (
                <div className="space-y-4 text-xs">
                  {/* Prescribed Items Table */}
                  <div className="bg-[#0a0a0a] border border-[#262626] rounded-md divide-y divide-[#1e1e1e]">
                    <div className="p-3 bg-[#161616] flex items-center justify-between font-mono text-slate-400 font-bold uppercase text-[10px]">
                      <span>Prescribed Medication</span>
                      <span>Dosage & Frequency</span>
                      <span>Dispensing / CCMDD</span>
                      <span>Action</span>
                    </div>

                    {prescriptions.map((rx, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between gap-3 text-slate-200">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <Pill className="w-3.5 h-3.5 text-teal-400" />
                          <span>{rx.medication_name}</span>
                        </div>
                        <div className="font-mono text-[11px] text-slate-300">
                          {rx.dosage} • {rx.frequency} ({rx.duration_days} days)
                        </div>
                        <div className="font-mono text-[11px]">
                          {rx.is_ccmdd_repeat ? (
                            <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                              CCMDD: {rx.ccmdd_pickup_point}
                            </span>
                          ) : (
                            <span className="text-slate-500">Clinic Pharmacy</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePrescription(idx)}
                          className="p-1 text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Prescription Bar */}
                  <div className="p-4 rounded-md bg-[#161616] border border-[#262626] space-y-3">
                    <span className="text-[11px] font-mono text-teal-400 uppercase font-bold block">
                      Add New Prescription / Repeat Script
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 block mb-1">Medication Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Amlodipine 5mg"
                          value={newRx.medication_name}
                          onChange={(e) => setNewRx({ ...newRx, medication_name: e.target.value })}
                          className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 block mb-1">Dosage & Frequency</label>
                        <input
                          type="text"
                          placeholder="e.g. 5mg once daily at night"
                          value={newRx.dosage}
                          onChange={(e) => setNewRx({ ...newRx, dosage: e.target.value })}
                          className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 block mb-1">Pickup Stream</label>
                        <select
                          value={newRx.is_ccmdd_repeat ? 'CCMDD' : 'PHARMACY'}
                          onChange={(e) => setNewRx({ ...newRx, is_ccmdd_repeat: e.target.value === 'CCMDD' })}
                          className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-teal-500"
                        >
                          <option value="PHARMACY">Clinic Internal Pharmacy</option>
                          <option value="CCMDD">CCMDD External Pickup Point</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddPrescription}
                      className="px-4 py-2 rounded bg-[#252525] hover:bg-[#303030] text-slate-200 font-mono text-xs flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5 text-teal-400" />
                      <span>Add to Prescription Order</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Consultation Footer Action */}
              <div className="pt-4 border-t border-[#262626] flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500">
                  Encounter auto-saved to PostgreSQL EHR records
                </span>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCompleteConsultation}
                  className="px-5 py-2.5 rounded-md bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold font-mono text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Finalize & Sign Clinical Encounter</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#111111] border border-[#262626] rounded-md p-14 text-center text-slate-500 space-y-2">
              <Stethoscope className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <h4 className="text-sm font-bold text-white">Consultation Room is Idle</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select a patient from the queue strip on the left and click &quot;Call to Consultation Room&quot; to open their complete file, past medical history, and clinical charting sheets.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
