import React, { useState } from 'react';
import { Activity, Megaphone, Heart, CheckCircle2, Clock, AlertTriangle, ArrowRight, User } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export default function NurseTriageView() {
  const { liveQueue, refreshQueue } = useSocket();
  const { user } = useAuth();

  const [activeTicket, setActiveTicket] = useState(null);
  const [vitals, setVitals] = useState({
    bloodPressureSys: '',
    bloodPressureDia: '',
    heartRate: '',
    respiratoryRate: '',
    temperature: '',
    bloodGlucose: '',
    weightKg: '',
    heightCm: '',
    satsTriageColor: 'GREEN',
    triageNotes: ''
  });
  const [successMsg, setSuccessMsg] = useState('');

  const callPatient = async (ticket) => {
    try {
      const res = await fetch('/api/queue/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('clinic_auth_token') || ''}`
        },
        body: JSON.stringify({ ticketId: ticket.ticket_id, roomNumber: 'Triage Station 1' })
      });
      if (res.ok) {
        setActiveTicket(ticket);
        setSuccessMsg(`Patient ${ticket.first_name} ${ticket.last_name} (${ticket.ticket_number}) called to Triage!`);
        refreshQueue();
      }
    } catch (err) {
      console.error('Call patient error:', err);
    }
  };

  const handleVitalsSubmit = async (e) => {
    e.preventDefault();
    if (!activeTicket) return;

    try {
      const res = await fetch('/api/vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('clinic_auth_token') || ''}`
        },
        body: JSON.stringify({
          visitId: activeTicket.visit_id,
          ...vitals
        })
      });

      if (res.ok) {
        setSuccessMsg(`Vitals & SATS score saved for ${activeTicket.first_name} ${activeTicket.last_name}. Patient triaged!`);
        setActiveTicket(null);
        setVitals({
          bloodPressureSys: '',
          bloodPressureDia: '',
          heartRate: '',
          respiratoryRate: '',
          temperature: '',
          bloodGlucose: '',
          weightKg: '',
          heightCm: '',
          satsTriageColor: 'GREEN',
          triageNotes: ''
        });
        refreshQueue();
      }
    } catch (err) {
      console.error('Submit vitals error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111111] border border-[#262626] rounded-md p-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <h2 className="text-lg font-bold text-white">SATS Triage & Vitals Station</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Conduct South African Triage Scale (SATS) scoring, record physiological parameters, and stream acute cases.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {liveQueue.length} Active in Queue
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-md bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-xs text-emerald-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="font-mono text-emerald-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Queue on Left (5 cols), Triage Charting on Right (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Upcoming Queue Stream */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#111111] border border-[#262626] rounded-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono uppercase text-slate-300 font-bold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-400" />
                <span>Waiting Room Queue Stream</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-500">Auto-Sorted by Priority</span>
            </div>

            <div className="space-y-2.5">
              {liveQueue.length > 0 ? (
                liveQueue.map((item) => (
                  <div
                    key={item.ticket_id}
                    className={`p-3.5 rounded-md border transition-all ${
                      activeTicket?.ticket_id === item.ticket_id
                        ? 'bg-teal-950/30 border-teal-500/60 shadow-sm'
                        : 'bg-[#0a0a0a] border-[#262626] hover:border-[#383838]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black font-mono text-white">
                          {item.ticket_number}
                        </span>
                        <span className="font-medium text-slate-200 text-xs">
                          {item.first_name} {item.last_name}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          item.priority_level === 'EMERGENCY'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : item.priority_level === 'FAST_TRACK'
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                            : 'bg-[#181818] text-slate-400'
                        }`}
                      >
                        {item.priority_level}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Stream: {item.service_stream}</span>
                      <span>~{item.estimated_wait_mins}m wait</span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-[#1a1a1a] flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">File: {item.file_number}</span>
                      <button
                        onClick={() => callPatient(item)}
                        className="px-2.5 py-1 rounded bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[11px] font-mono font-bold flex items-center gap-1 transition-all"
                      >
                        <Megaphone className="w-3 h-3 text-teal-400" />
                        <span>Call to Triage</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  All waiting patients have been triaged and called!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: SATS Triage Vitals Charting HUD */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#111111] border border-[#262626] rounded-md p-5">
            <h3 className="text-xs font-mono uppercase text-teal-400 font-bold mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span>South African Triage Scale (SATS) Clinical Assessment</span>
            </h3>

            {activeTicket ? (
              <form onSubmit={handleVitalsSubmit} className="space-y-4 text-xs">
                {/* Active Patient Card */}
                <div className="p-3.5 rounded-md bg-[#0a0a0a] border border-teal-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-teal-400 uppercase block font-bold">Currently Triaging</span>
                    <h4 className="text-sm font-bold text-white">
                      {activeTicket.first_name} {activeTicket.last_name} ({activeTicket.ticket_number})
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      File: {activeTicket.file_number} • Stream: {activeTicket.service_stream}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-teal-500/20 text-teal-300 font-mono text-xs font-bold">
                    In Station
                  </span>
                </div>

                {/* SATS Color Severity Selector */}
                <div>
                  <label className="font-mono text-slate-300 uppercase block mb-1.5 font-bold">
                    SATS Triage Category & Acuity Level
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { val: 'RED', label: 'RED: Resuscitation', desc: 'Immediate (<1 min)', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
                      { val: 'ORANGE', label: 'ORANGE: Very Urgent', desc: '< 10 mins target', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
                      { val: 'YELLOW', label: 'YELLOW: Urgent', desc: '< 60 mins target', bg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
                      { val: 'GREEN', label: 'GREEN: Routine', desc: 'Outpatient PHC', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' }
                    ].map((s) => (
                      <button
                        key={s.val}
                        type="button"
                        onClick={() => setVitals({ ...vitals, satsTriageColor: s.val })}
                        className={`p-2 rounded border text-left transition-all ${
                          vitals.satsTriageColor === s.val
                            ? `${s.bg} ring-2 ring-white/20 font-bold shadow-md`
                            : 'bg-[#0a0a0a] border-[#262626] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="block text-[11px] font-mono">{s.label}</span>
                        <span className="block text-[9px] opacity-70">{s.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Physiological Vitals Fields */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-mono text-slate-400 uppercase text-[10px] block mb-1">
                      BP Sys (mmHg)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 120"
                      value={vitals.bloodPressureSys}
                      onChange={(e) => setVitals({ ...vitals, bloodPressureSys: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="font-mono text-slate-400 uppercase text-[10px] block mb-1">
                      BP Dia (mmHg)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 80"
                      value={vitals.bloodPressureDia}
                      onChange={(e) => setVitals({ ...vitals, bloodPressureDia: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="font-mono text-slate-400 uppercase text-[10px] block mb-1">
                      Pulse (bpm)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 72"
                      value={vitals.heartRate}
                      onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="font-mono text-slate-400 uppercase text-[10px] block mb-1">
                      Temp (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 36.6"
                      value={vitals.temperature}
                      onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-mono text-slate-400 uppercase text-[10px] block mb-1">
                      Resp Rate (/min)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 16"
                      value={vitals.respiratoryRate}
                      onChange={(e) => setVitals({ ...vitals, respiratoryRate: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="font-mono text-slate-400 uppercase text-[10px] block mb-1">
                      Glucose (mmol/L)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 5.5"
                      value={vitals.bloodGlucose}
                      onChange={(e) => setVitals({ ...vitals, bloodGlucose: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="font-mono text-slate-400 uppercase text-[10px] block mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 70.5"
                      value={vitals.weightKg}
                      onChange={(e) => setVitals({ ...vitals, weightKg: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="font-mono text-slate-400 uppercase text-[10px] block mb-1">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 165"
                      value={vitals.heightCm}
                      onChange={(e) => setVitals({ ...vitals, heightCm: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-mono text-slate-400 uppercase text-[10px] block mb-1">
                    Nurse Triage Clinical Notes & Symptoms
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Document presenting complaints, chest symptoms, mobility, pain score..."
                    value={vitals.triageNotes}
                    onChange={(e) => setVitals({ ...vitals, triageNotes: e.target.value })}
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded p-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Vitals & Route to Doctor / Consultation</span>
                </button>
              </form>
            ) : (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <Activity className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs">No patient currently at Triage station</p>
                <p className="text-[11px] text-slate-600 max-w-sm mx-auto">
                  Select and click &quot;Call to Triage&quot; on any waiting patient in the queue stream on the left to begin physiological assessment.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
