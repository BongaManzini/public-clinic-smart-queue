import React from 'react';
import { X, User, Phone, MapPin, AlertTriangle, Calendar, Heart, FileText, Pill, Clock, ArrowRight } from 'lucide-react';

export default function PatientFileModal({ patient, onClose, onEnqueue, onConsult }) {
  if (!patient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#111111] border border-[#262626] rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#161616] border-b border-[#262626] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold font-mono">
              {patient.first_name?.[0]}{patient.last_name?.[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {patient.first_name} {patient.last_name}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {patient.file_number}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                SA ID: {patient.national_id || 'Not recorded'} • {patient.gender} • DOB: {patient.date_of_birth}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[#262626] text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs">
          {/* Allergies & Chronic Alert Banner */}
          {(patient.known_allergies || patient.chronic_conditions) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-md bg-rose-950/20 border border-rose-500/30">
                <span className="text-[10px] font-mono uppercase text-rose-400 font-bold flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Known Allergies
                </span>
                <p className="text-rose-200 font-semibold">{patient.known_allergies || 'None recorded'}</p>
              </div>

              <div className="p-3 rounded-md bg-teal-950/20 border border-teal-500/30">
                <span className="text-[10px] font-mono uppercase text-teal-400 font-bold flex items-center gap-1.5 mb-1">
                  <Heart className="w-3.5 h-3.5 text-teal-400" />
                  Chronic Conditions (CCMDD)
                </span>
                <p className="text-teal-200 font-semibold">{patient.chronic_conditions || 'None'}</p>
              </div>
            </div>
          )}

          {/* Demographics & Contact */}
          <div className="bg-[#0a0a0a] border border-[#262626] rounded-md p-4">
            <h4 className="font-mono text-slate-400 uppercase text-[11px] font-bold mb-3">
              Patient Demographic & Contact Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-slate-500 text-[10px] block">MOBILE PHONE</span>
                <span className="text-slate-200 font-mono font-medium">{patient.phone_number || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">RESIDENTIAL ADDRESS</span>
                <span className="text-slate-200">{patient.residential_address || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">EMERGENCY CONTACT</span>
                <span className="text-slate-200">{patient.emergency_contact_name || 'N/A'} ({patient.emergency_contact_phone || 'N/A'})</span>
              </div>
            </div>
          </div>

          {/* Longitudinal Visit History */}
          <div>
            <h4 className="font-mono text-slate-400 uppercase text-[11px] font-bold mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-400" />
              Clinical Visit History & Encounter Timeline
            </h4>

            {patient.visits && patient.visits.length > 0 ? (
              <div className="space-y-3">
                {patient.visits.map((v, i) => (
                  <div key={v.id || i} className="p-3.5 rounded-md bg-[#0a0a0a] border border-[#262626] space-y-2">
                    <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-teal-400 font-mono">
                          {v.ticket_number || 'Visit'}
                        </span>
                        <span className="text-slate-400">• {v.visit_type}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#161616] text-slate-300">
                          {v.status || v.ticket_status}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(v.arrival_time).toLocaleDateString()}
                      </span>
                    </div>

                    {v.vitals && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono bg-[#141414] p-2 rounded">
                        <div>
                          <span className="text-slate-500 text-[9px] block">BP:</span>
                          <span className="text-slate-200 font-bold">
                            {v.vitals.blood_pressure_sys ? `${v.vitals.blood_pressure_sys}/${v.vitals.blood_pressure_dia}` : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[9px] block">PULSE:</span>
                          <span className="text-slate-200 font-bold">{v.vitals.heart_rate || 'N/A'} bpm</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[9px] block">TEMP:</span>
                          <span className="text-slate-200 font-bold">{v.vitals.temperature || 'N/A'} °C</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[9px] block">TRIAGE:</span>
                          <span className={`font-bold ${
                            v.vitals.sats_triage_color === 'RED' ? 'text-rose-400' :
                            v.vitals.sats_triage_color === 'ORANGE' ? 'text-amber-400' :
                            v.vitals.sats_triage_color === 'YELLOW' ? 'text-yellow-400' : 'text-emerald-400'
                          }`}>
                            {v.vitals.sats_triage_color || 'GREEN'}
                          </span>
                        </div>
                      </div>
                    )}

                    {v.consultation && (
                      <div className="text-xs text-slate-300 space-y-1 pt-1">
                        <p><strong className="text-slate-400">Diagnosis:</strong> {v.consultation.diagnosis_text} ({v.consultation.icd10_code})</p>
                        <p><strong className="text-slate-400">Plan:</strong> {v.consultation.plan_notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic p-3 text-center bg-[#0a0a0a] rounded-md border border-[#222222]">
                No previous clinical visits logged yet for this patient file.
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-[#161616] border-t border-[#262626] p-4 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[#222222] hover:bg-[#2c2c2c] text-slate-300 text-xs font-mono"
          >
            Close File
          </button>

          <div className="flex items-center gap-2">
            {onEnqueue && (
              <button
                onClick={() => { onEnqueue(patient); onClose(); }}
                className="px-4 py-2 rounded-md bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5"
              >
                <span>Dispatch to Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {onConsult && (
              <button
                onClick={() => { onConsult(patient); onClose(); }}
                className="px-4 py-2 rounded-md bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5"
              >
                <span>Open in Doctor Chart</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
