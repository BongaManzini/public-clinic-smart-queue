import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const PRESET_USERS = {
  RECEPTIONIST: {
    id: 'u-rec-1',
    username: 'receptionist',
    fullName: 'Sister Thandi Sithole',
    role: 'RECEPTIONIST',
    staffCode: 'REC-01',
    title: 'Admissions & Reception'
  },
  NURSE: {
    id: 'u-nur-1',
    username: 'nurse',
    fullName: 'Staff Nurse Sipho Dlamini',
    role: 'NURSE',
    staffCode: 'NUR-01',
    title: 'SATS Triage & Vitals Station'
  },
  DOCTOR: {
    id: 'u-doc-1',
    username: 'doctor',
    fullName: 'Dr. Lesedi Khumalo',
    role: 'DOCTOR',
    staffCode: 'DOC-01',
    title: 'Clinical Consultation Room 4'
  },
  ADMIN: {
    id: 'u-adm-1',
    username: 'admin',
    fullName: 'Bonga Manzini',
    role: 'ADMIN',
    staffCode: 'ADM-01',
    title: 'Health Informatics Director'
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('clinic_auth_user');
    return saved ? JSON.parse(saved) : PRECEPTIONIST_DEFAULT();
  });
  const [token, setToken] = useState(() => localStorage.getItem('clinic_auth_token') || 'demo-jwt-token');

  function PRECEPTIONIST_DEFAULT() {
    return PRESET_USERS.RECEPTIONIST;
  }

  const login = async (username, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('clinic_auth_user', JSON.stringify(data.user));
      localStorage.setItem('clinic_auth_token', data.token);
      return data.user;
    } catch (err) {
      console.warn('Backend login fallback to preset:', err.message);
      // Fallback to preset if backend not yet running or during demo
      const matched = Object.values(PRESET_USERS).find(u => u.username === username.toLowerCase());
      if (matched) {
        setUser(matched);
        localStorage.setItem('clinic_auth_user', JSON.stringify(matched));
        return matched;
      }
      throw err;
    }
  };

  const quickSwitch = (roleKey) => {
    const target = PRESET_USERS[roleKey];
    if (target) {
      setUser(target);
      localStorage.setItem('clinic_auth_user', JSON.stringify(target));
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('clinic_auth_user');
    localStorage.removeItem('clinic_auth_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, quickSwitch, logout, PRESET_USERS }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
