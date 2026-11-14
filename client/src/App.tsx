import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { api, clearAuthToken, getAuthToken } from './services/api';
import { Lawyer } from './types';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { CasesList } from './pages/CasesList';
import { MatterWorkspace } from './pages/MatterWorkspace';
import { PrecedentSearch } from './pages/PrecedentSearch';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { RefreshCw } from 'lucide-react';

const AppLayout: React.FC<{
  lawyer: Lawyer | null;
  onLogout: () => void;
  onUpdateLawyer: (l: Lawyer) => void;
}> = ({ lawyer, onLogout, onUpdateLawyer }) => {
  const location = useLocation();
  const isWorkspace = location.pathname.startsWith('/cases/') && location.pathname.split('/').length === 3;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-canvas font-sans text-charcoal-800">
      <Navbar lawyer={lawyer} onLogout={onLogout} />

      <div className="flex-1 flex overflow-hidden">
        {/* Render sidebar on standard pages; hide on 3-pane Matter Workspace for maximum drafting space */}
        {!isWorkspace && <Sidebar />}

        <main className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<Dashboard lawyer={lawyer} />} />
            <Route path="/cases" element={<CasesList />} />
            <Route path="/cases/:id" element={<MatterWorkspace />} />
            <Route path="/precedents" element={<PrecedentSearch />} />
            <Route
              path="/settings"
              element={<Settings lawyer={lawyer} onUpdateLawyer={onUpdateLawyer} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const [lawyer, setLawyer] = useState<Lawyer | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.auth.me();
      setLawyer(res.lawyer);
    } catch (err) {
      console.warn('Session expired or invalid token');
      clearAuthToken();
      setLawyer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = () => {
    clearAuthToken();
    setLawyer(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-navy-900 tracking-wider uppercase font-sans">
            Initializing LexMind Legal OS...
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {lawyer ? (
        <AppLayout
          lawyer={lawyer}
          onLogout={handleLogout}
          onUpdateLawyer={(updated) => setLawyer(updated)}
        />
      ) : (
        <Routes>
          <Route path="/login" element={<Login onLoginSuccess={(l) => setLawyer(l)} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  );
};

export default App;

