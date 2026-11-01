import React, { useState } from 'react';
import { X, Smartphone, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';

export default function UssdSimulatorModal({ isOpen, onClose, onTicketCreated }) {
  const [step, setStep] = useState(1); // 1: main menu, 2: select stream, 3: enter file/phone, 4: success
  const [selectedStream, setSelectedStream] = useState('');
  const [phone, setPhone] = useState('0821234567');
  const [generatedTicket, setGeneratedTicket] = useState(null);

  if (!isOpen) return null;

  const handleSelectOption = (opt) => {
    if (opt === '1') {
      setSelectedStream('CHRONIC');
      setStep(3);
    } else if (opt === '2') {
      setSelectedStream('GENERAL');
      setStep(3);
    } else if (opt === '3') {
      setSelectedStream('PEDIATRIC');
      setStep(3);
    }
  };

  const submitBooking = async () => {
    try {
      const res = await fetch('/api/queue/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: 'p-1', // maps to demo file
          serviceStream: selectedStream,
          visitType: selectedStream,
          priorityLevel: selectedStream === 'CHRONIC' ? 'FAST_TRACK' : 'NORMAL'
        })
      });
      const data = await res.json();
      setGeneratedTicket(data.ticket);
      setStep(4);
      if (onTicketCreated) onTicketCreated();
    } catch (err) {
      console.error('USSD ticket error:', err);
    }
  };

  const reset = () => {
    setStep(1);
    setSelectedStream('');
    setGeneratedTicket(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#111111] border border-[#262626] rounded-xl max-w-sm w-full p-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="w-5 h-5 text-teal-400" />
          <h3 className="text-sm font-bold text-white font-mono">
            USSD *120*2546# Gateway Simulator
          </h3>
        </div>

        <p className="text-xs text-slate-400 font-light mb-4">
          Reverse-billed zero-data gateway allowing township and rural patients to book clinic queue tokens from basic 2G feature phones.
        </p>

        {/* Feature Phone Screen Simulation */}
        <div className="bg-[#051510] border-2 border-emerald-500/40 rounded-lg p-4 font-mono text-xs text-emerald-400 shadow-inner space-y-2">
          {step === 1 && (
            <div>
              <p className="font-bold border-b border-emerald-500/30 pb-1 mb-2">ClinicQueue ZA:</p>
              <p>1. Book Chronic Med Collection</p>
              <p>2. Book Consultation</p>
              <p>3. Book Child Health / Weigh</p>
              <div className="mt-4 pt-2 border-t border-emerald-500/20 flex gap-2">
                <input
                  type="text"
                  maxLength={1}
                  placeholder="Option (1-3)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSelectOption(e.currentTarget.value);
                  }}
                  className="w-full bg-[#030d0a] border border-emerald-500/40 rounded px-2 py-1 text-emerald-300 placeholder-emerald-700 text-xs focus:outline-none"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="font-bold border-b border-emerald-500/30 pb-1 mb-2">Confirm Booking:</p>
              <p>Stream: {selectedStream}</p>
              <p>Reply with mobile phone number for SMS slot ticket:</p>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#030d0a] border border-emerald-500/40 rounded px-2 py-1 mt-2 text-emerald-300 text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={submitBooking}
                className="w-full mt-3 py-1.5 rounded bg-emerald-500 text-slate-950 font-bold font-mono text-xs hover:bg-emerald-400"
              >
                Send (Free of Charge)
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-2 space-y-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
              <p className="font-bold text-white text-sm">Token Allocated!</p>
              <p className="text-xl font-black text-emerald-300">
                {generatedTicket?.ticket_number || 'T-115'}
              </p>
              <p className="text-[11px] text-emerald-400/80">
                Estimated arrival window in ~{generatedTicket?.estimated_wait_mins || 25} mins.
              </p>
              <p className="text-[10px] text-slate-400 pt-1">
                SMS alert sent to {phone}. Arrive 15 mins prior.
              </p>
              <button
                type="button"
                onClick={reset}
                className="mt-3 px-3 py-1 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-1 mx-auto"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Simulate Another</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
