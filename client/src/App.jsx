import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Header from './components/Header';
import ReceptionistView from './components/ReceptionistView';
import NurseTriageView from './components/NurseTriageView';
import DoctorConsultView from './components/DoctorConsultView';

function MainLayout() {
  const [currentView, setCurrentView] = useState('reception');

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <Header currentView={currentView} setCurrentView={setCurrentView} />

      <main className="min-h-[600px]">
        {currentView === 'reception' && <ReceptionistView />}
        {currentView === 'nurse' && <NurseTriageView />}
        {currentView === 'doctor' && <DoctorConsultView />}
      </main>

      {/* Footer */}
      <footer className="mt-16 pt-6 border-t border-[#262626] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-mono gap-4">
        <p>© Bonga Manzini • BSc Informatics (UNISA) • South African Public Healthcare Information Systems</p>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/BongaManzini/public-clinic-smart-queue"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-teal-400 transition-colors"
          >
            GitHub Repository
          </a>
          <span>•</span>
          <a
            href="https://bongamanzini.github.io/portfolio/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-teal-400 transition-colors"
          >
            Portfolio
          </a>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainLayout />
      </SocketProvider>
    </AuthProvider>
  );
}
