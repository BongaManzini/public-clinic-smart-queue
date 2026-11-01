import React, { useState } from 'react';
import { Activity, Smartphone, Radio, Shield, Stethoscope, User, Ticket, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import UssdSimulatorModal from './UssdSimulatorModal';

export default function Header({ currentView, setCurrentView }) {
  const { user, quickSwitch, PRESET_USERS } = useAuth();
  const { liveQueue, nowCalling, isConnected } = useSocket();
  const [isUssdOpen, setIsUssdOpen] = useState(false);

  return (
    <>
      <header className="border-b border-[#262626] pb-6 mb-8 space-y-6">
        {/* Top Bar: Title & Identity */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                Public Healthcare Process Re-Engineering & EHR
              </span>
              <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                South African Primary Healthcare
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>Public Clinic Smart Queue & EHR System</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl font-light">
              Full-stack clinical information system uniting asynchronous virtual queueing, nurse triage (SATS), and longitudinal electronic health records with physical-to-digital note capture.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsUssdOpen(true)}
              className="px-3 py-2 rounded-md bg-[#161616] hover:bg-[#202020] border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center gap-2 transition-all shadow-sm"
            >
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>*120*2546# USSD Sim</span>
            </button>

            <div className="px-3 py-2 rounded-md bg-[#111111] border border-[#262626] text-xs font-mono flex items-center gap-2 text-slate-300">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span>{isConnected ? 'Real-Time Sync' : 'Connecting...'}</span>
            </div>
          </div>
        </div>

        {/* Live Clinical Analytics HUD */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#111111] border border-[#262626] rounded-md p-3.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Traditional Wait Time</span>
            <span className="text-2xl font-black text-rose-400 font-mono">6h 15m</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Physical queue arrival 04:30 AM</span>
          </div>

          <div className="bg-[#111111] border border-teal-500/30 rounded-md p-3.5">
            <span className="text-[10px] font-mono uppercase text-teal-400 font-semibold block mb-1">Smart Queue Avg Wait</span>
            <span className="text-2xl font-black text-teal-400 font-mono">38 min</span>
            <span className="text-[10px] text-teal-300 block mt-0.5">90% reduction via slot arrivals</span>
          </div>

          <div className="bg-[#111111] border border-[#262626] rounded-md p-3.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Active in Clinic Queue</span>
            <span className="text-2xl font-black text-white font-mono">{liveQueue.length}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Dispatched across PHC streams</span>
          </div>

          <div className="bg-[#111111] border border-[#262626] rounded-md p-3.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Now Calling Ticket</span>
            <span className="text-2xl font-black text-amber-400 font-mono">
              {nowCalling?.ticket_number || 'T-108'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Room 4: Consultation</span>
          </div>
        </div>

        {/* Role Switcher & Station Navigation Bar */}
        <div className="bg-[#111111] border border-[#262626] rounded-md p-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px] uppercase mr-2 font-bold flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-teal-400" />
              Active Station:
            </span>

            {[
              { id: 'reception', label: 'Reception & Intake', roleKey: 'RECEPTIONIST' },
              { id: 'nurse', label: 'SATS Triage Station', roleKey: 'NURSE' },
              { id: 'doctor', label: 'Doctor Consultation', roleKey: 'DOCTOR' }
            ].map((station) => (
              <button
                key={station.id}
                onClick={() => {
                  setCurrentView(station.id);
                  quickSwitch(station.roleKey);
                }}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  currentView === station.id
                    ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:bg-[#1a1a1a] hover:text-white'
                }`}
              >
                {station.label}
              </button>
            ))}
          </div>

          {/* Current Logged-in Staff Badge */}
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <User className="w-3.5 h-3.5 text-teal-400" />
            <span>Staff: <strong className="text-white">{user?.fullName || 'Sister Thandi Sithole'}</strong></span>
            <span className="px-1.5 py-0.5 rounded bg-[#1e1e1e] text-[10px] text-teal-300">
              {user?.role || 'RECEPTIONIST'}
            </span>
          </div>
        </div>
      </header>

      {/* USSD Simulator Modal */}
      <UssdSimulatorModal isOpen={isUssdOpen} onClose={() => setIsUssdOpen(false)} />
    </>
  );
}
