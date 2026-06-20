import React, { useState, useEffect } from 'react';
import BookingWidget from './components/BookingWidget';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [route, setRoute] = useState({ view: 'client', slug: '', startDate: '' });

  // Micro-router parser
  const parseRoute = () => {
    const path = window.location.pathname;
    if (path.startsWith('/admin')) {
      return { view: 'admin', slug: '', startDate: '' };
    }
    
    // Parse /i/:slug/:startDate patterns
    const matchWithDate = path.match(/\/i\/([^/]+)\/([^/]+)/);
    if (matchWithDate) {
      return { view: 'client', slug: matchWithDate[1], startDate: matchWithDate[2] };
    }

    // Parse /i/:slug patterns
    const match = path.match(/\/i\/([^/]+)/);
    if (match) {
      return { view: 'client', slug: match[1], startDate: '' };
    }

    // Default home view
    return { view: 'client', slug: '', startDate: '' };
  };

  useEffect(() => {
    // Initial load route parsing
    setRoute(parseRoute());

    // Listen to route navigation
    const handleLocationChange = () => {
      setRoute(parseRoute());
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setRoute(parseRoute());
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Premium Glassmorphic Header */}
      <header className="sticky top-0 z-50 w-full glass-panel-light border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        {/* Logo */}
        <div 
          onClick={() => navigateTo('/')} 
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-display font-black text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            ANTIGRAVITY<span className="text-indigo-400 font-bold ml-1 font-sans text-sm">SCHEDULER</span>
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2">
          <button
            onClick={() => navigateTo('/')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
              route.view === 'client'
                ? 'bg-white/10 text-white border border-white/10'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            Booking Portal
          </button>
          <button
            onClick={() => navigateTo('/admin')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
              route.view === 'admin'
                ? 'bg-white/10 text-white border border-white/10'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            Admin Panel
          </button>
        </nav>
      </header>

      {/* Main View Area */}
      <main className="flex-grow flex items-center justify-center py-6">
        <div className="w-full">
          {route.view === 'admin' ? (
            <AdminDashboard />
          ) : (
            <BookingWidget slug={route.slug} initialStartDate={route.startDate} key={`${route.slug}-${route.startDate}`} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-4 text-center text-xs text-slate-500">
        © 2026 Antigravity Scheduling Inc. MVP Production Suite. All rights reserved.
      </footer>
    </div>
  );
}
