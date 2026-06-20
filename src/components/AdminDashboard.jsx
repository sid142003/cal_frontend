import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('links');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Lists State
  const [linksList, setLinksList] = useState([]);
  const [interviewersList, setInterviewersList] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);

  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // 1. Link Form State
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [role, setRole] = useState('');
  const [duration, setDuration] = useState('30');
  const [buffer, setBuffer] = useState('10');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [windowDays, setWindowDays] = useState('14');
  const [startDate, setStartDate] = useState(getTodayString());

  // 2. Interviewer Form State
  const [intName, setIntName] = useState('');
  const [intEmail, setIntEmail] = useState('');
  const [isActive, setIsActive] = useState(true);

  // 3. Mapping Form State
  const [mapLinkId, setMapLinkId] = useState('');
  const [mapIntIds, setMapIntIds] = useState([]);

  // 4. Availability Form State
  const [avIntId, setAvIntId] = useState('');
  const [avRules, setAvRules] = useState([
    { day_of_week: 1, start_time: '10:00', end_time: '18:00', enabled: true }, // Mon
    { day_of_week: 2, start_time: '10:00', end_time: '18:00', enabled: true }, // Tue
    { day_of_week: 3, start_time: '10:00', end_time: '18:00', enabled: true }, // Wed
    { day_of_week: 4, start_time: '10:00', end_time: '18:00', enabled: true }, // Thu
    { day_of_week: 5, start_time: '10:00', end_time: '18:00', enabled: true }, // Fri
    { day_of_week: 6, start_time: '10:00', end_time: '14:00', enabled: false }, // Sat
    { day_of_week: 0, start_time: '10:00', end_time: '14:00', enabled: false }  // Sun
  ]);

  // Load lists on mount and tab change
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Check for Google OAuth success parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth') === 'success') {
      showFeedback('Successfully connected Google Calendar account!');
      const tab = params.get('tab');
      if (tab) {
        setActiveTab(tab);
      }
      // Remove query parameters from URL without refreshing the page
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchData = async () => {
    try {
      if (activeTab === 'links' || activeTab === 'mappings') {
        const links = await api.getInterviewLinks();
        setLinksList(links);
      }
      if (activeTab === 'interviewers' || activeTab === 'mappings' || activeTab === 'availability') {
        const ints = await api.getInterviewers();
        setInterviewersList(ints);
      }
      if (activeTab === 'bookings') {
        const bookings = await api.getBookings();
        setBookingsList(bookings);
      }
    } catch (err) {
      console.error('Failed to load dashboard list data:', err);
    }
  };

  const showFeedback = (msg, isErr = false) => {
    if (isErr) {
      setError(msg);
      setMessage(null);
    } else {
      setMessage(msg);
      setError(null);
    }
    setTimeout(() => {
      setMessage(null);
      setError(null);
    }, 5000);
  };

  // Submit Handlers
  const handleCreateLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.createInterviewLink({
        slug,
        title,
        role,
        duration_minutes: duration,
        buffer_minutes: buffer,
        timezone,
        booking_window_days: windowDays,
        start_date: startDate
      });
      showFeedback(`Successfully created link! ID: ${response.data.id}`);
      setSlug('');
      setTitle('');
      setRole('');
      setStartDate(getTodayString());
      fetchData(); // Refresh list
    } catch (err) {
      showFeedback(err.message || 'Failed to create link', true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInterviewer = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.createInterviewer({
        name: intName,
        email: intEmail,
        is_active: isActive
      });
      showFeedback(`Registered interviewer successfully! ID: ${response.data.id}`);
      setIntName('');
      setIntEmail('');
      fetchData(); // Refresh list
    } catch (err) {
      showFeedback(err.message || 'Failed to register interviewer', true);
    } finally {
      setLoading(false);
    }
  };

  const handleMapInterviewer = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mapIntIds.length === 0) {
        throw new Error('Please select at least one interviewer to map.');
      }
      await api.mapInterviewersToLink(mapLinkId, mapIntIds);
      showFeedback('Interviewers successfully mapped to link!');
      setMapLinkId('');
      setMapIntIds([]);
    } catch (err) {
      showFeedback(err.message || 'Failed to map interviewers', true);
    } finally {
      setLoading(false);
    }
  };

  const handleSetAvailability = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formattedRules = avRules
        .filter(r => r.enabled)
        .map(r => ({
          day_of_week: r.day_of_week,
          start_time: r.start_time.length === 5 ? `${r.start_time}:00` : r.start_time,
          end_time: r.end_time.length === 5 ? `${r.end_time}:00` : r.end_time
        }));

      if (formattedRules.length === 0) {
        throw new Error('Please enable availability for at least one day.');
      }

      await api.setAvailability({
        interviewer_id: parseInt(avIntId, 10),
        rules: formattedRules
      });
      showFeedback('Availability rules saved successfully!');
    } catch (err) {
      showFeedback(err.message || 'Failed to save availability', true);
    } finally {
      setLoading(false);
    }
  };

  const updateRule = (index, field, value) => {
    const nextRules = [...avRules];
    nextRules[index][field] = value;
    setAvRules(nextRules);
  };

  const handleCopyLink = (linkSlug, linkStartDate) => {
    const dateStr = linkStartDate ? linkStartDate.split('T')[0] : '';
    const publicUrl = `${window.location.origin}/i/${linkSlug}${dateStr ? `/${dateStr}` : ''}`;
    navigator.clipboard.writeText(publicUrl).then(() => {
      showFeedback(`Copied to clipboard: ${publicUrl}`);
    }).catch(err => {
      console.error('Failed to copy link:', err);
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4">
      {/* Title */}
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-3xl font-display font-extrabold text-white tracking-tight uppercase">
          Recruiter Control Panel
        </h1>
        <p className="text-slate-400 text-sm mt-1">Configure scheduling rules, interviewers, and availability</p>
      </div>

      {/* Messages */}
      {message && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-sm animate-fade-in flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {message}
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-semibold text-sm animate-fade-in flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/10 mb-8 overflow-x-auto gap-2">
        {['links', 'interviewers', 'mappings', 'availability', 'bookings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-semibold tracking-wide border-b-2 transition duration-200 cursor-pointer capitalize flex-shrink-0 ${
              activeTab === tab
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Config Panel Card Grid Layout */}
      {activeTab === 'bookings' ? (
        <div className="w-full glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 animate-fade-in">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Booked Interviews</h3>
              <p className="text-slate-400 text-xs mt-0.5">List of scheduled candidate sessions and assigned interviewers</p>
            </div>
            <button 
              onClick={fetchData} 
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition flex items-center gap-1.5 text-xs font-bold"
              title="Refresh bookings list"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18" />
              </svg>
              Refresh
            </button>
          </div>

          {bookingsList.length === 0 ? (
            <p className="text-slate-500 text-xs py-8 text-center">No bookings have been made yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Role / Interview Link</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Assigned Interviewer</th>
                    <th className="py-3 px-4 text-right">Calendar Sync Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {bookingsList.map((b) => (
                    <tr key={b.id} className="hover:bg-white/5 transition duration-150">
                      <td className="py-4 px-4">
                        <span className="block font-bold text-slate-100">{b.candidate_name}</span>
                        <span className="block text-slate-400 font-mono mt-0.5">{b.candidate_email}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="block font-bold text-slate-200">{b.link_title}</span>
                        <span className="block text-[10px] text-indigo-400 font-semibold mt-0.5">{b.link_role}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="block font-bold text-slate-200">
                          {new Date(b.start_time).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          {new Date(b.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {new Date(b.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} (Local)
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="block font-bold text-slate-100">{b.interviewer_name}</span>
                        <span className="block text-slate-400 font-mono mt-0.5">{b.interviewer_email}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {b.google_event_id ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Synced (Meet Sent)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Pending Sync
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: FORMS (col-span-5) */}
        <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md">
          
          {/* TAB 1: CREATE LINKS FORM */}
          {activeTab === 'links' && (
            <form onSubmit={handleCreateLink} className="space-y-4">
              <h2 className="text-lg font-bold text-white mb-2">Create Interview Link</h2>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Slug (Unique)</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="e.g. backend-sde1"
                  className="px-3 py-2 rounded-lg text-xs"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Backend SDE1 Interview"
                  className="px-3 py-2 rounded-lg text-xs"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role</label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Software Engineer 1"
                  className="px-3 py-2 rounded-lg text-xs"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Timezone</label>
                <input
                  type="text"
                  required
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="e.g. America/New_York"
                  className="px-3 py-2 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration (Mins)</label>
                  <input
                    type="number"
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="px-3 py-2 rounded-lg text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Buffer (Mins)</label>
                  <input
                    type="number"
                    required
                    value={buffer}
                    onChange={(e) => setBuffer(e.target.value)}
                    className="px-3 py-2 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Booking Window (Days)</label>
                <input
                  type="number"
                  required
                  value={windowDays}
                  onChange={(e) => setWindowDays(e.target.value)}
                  className="px-3 py-2 rounded-lg text-xs"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date (For Booking Link)</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 rounded-lg text-xs"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg text-xs font-bold transition duration-200 cursor-pointer shadow-lg shadow-indigo-500/20"
              >
                {loading ? 'Creating...' : 'Create Link'}
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER INTERVIEWERS FORM */}
          {activeTab === 'interviewers' && (
            <form onSubmit={handleCreateInterviewer} className="space-y-4">
              <h2 className="text-lg font-bold text-white mb-2">Register Interviewer</h2>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  required
                  value={intName}
                  onChange={(e) => setIntName(e.target.value)}
                  placeholder="e.g. Alice Smith"
                  className="px-3 py-2 rounded-lg text-xs"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  required
                  value={intEmail}
                  onChange={(e) => setIntEmail(e.target.value)}
                  placeholder="e.g. alice@company.com"
                  className="px-3 py-2 rounded-lg text-xs"
                />
              </div>
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-[11px] text-slate-300">
                Interviewers are created with name and email first. Google Calendar is connected after registration using the
                <span className="font-semibold text-indigo-300"> Connect Google Calendar </span>
                action in the interviewer list.
              </div>
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-3.5 h-3.5 rounded cursor-pointer accent-indigo-500"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
                  Set Active status
                </label>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg text-xs font-bold transition duration-200 cursor-pointer shadow-lg shadow-indigo-500/20"
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </form>
          )}

          {/* TAB 3: LINK MAPPING FORM */}
          {activeTab === 'mappings' && (
            <form onSubmit={handleMapInterviewer} className="space-y-4">
              <h2 className="text-lg font-bold text-white mb-2">Map Interviewer to Link</h2>
              
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Interview Link</label>
                <select
                  required
                  value={mapLinkId}
                  onChange={(e) => setMapLinkId(e.target.value)}
                  className="px-3 py-2 rounded-lg text-xs w-full bg-slate-900 border border-white/10 text-white"
                >
                  <option value="" className="bg-slate-950">-- Choose Link --</option>
                  {linksList.map(l => (
                    <option key={l.id} value={l.id} className="bg-slate-950">
                      ID {l.id} - {l.title} ({l.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Select Interviewers (Multi-select)</label>
                <div className="space-y-2 max-h-48 overflow-y-auto bg-slate-900 border border-white/10 rounded-xl p-3">
                  {interviewersList.length === 0 ? (
                    <p className="text-slate-500 text-xs py-2 text-center">No registered interviewers found</p>
                  ) : (
                    interviewersList.map(i => (
                      <div key={i.id} className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          id={`map-int-${i.id}`}
                          checked={mapIntIds.includes(i.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setMapIntIds([...mapIntIds, i.id]);
                            } else {
                              setMapIntIds(mapIntIds.filter(id => id !== i.id));
                            }
                          }}
                          className="w-3.5 h-3.5 rounded cursor-pointer accent-indigo-500"
                        />
                        <label htmlFor={`map-int-${i.id}`} className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
                          ID {i.id} - {i.name} ({i.email})
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg text-xs font-bold transition duration-200 cursor-pointer shadow-lg shadow-indigo-500/20"
              >
                {loading ? 'Mapping...' : 'Associate Interviewer'}
              </button>
            </form>
          )}

          {/* TAB 4: AVAILABILITY FORM */}
          {activeTab === 'availability' && (
            <form onSubmit={handleSetAvailability} className="space-y-4">
              <h2 className="text-lg font-bold text-white mb-2">Configure Working Hours</h2>
              
              <div className="flex flex-col gap-1 mb-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Interviewer</label>
                <select
                  required
                  value={avIntId}
                  onChange={(e) => setAvIntId(e.target.value)}
                  className="px-3 py-2 rounded-lg text-xs w-full bg-slate-900 border border-white/10 text-white"
                >
                  <option value="" className="bg-slate-950">-- Choose Interviewer --</option>
                  {interviewersList.map(i => (
                    <option key={i.id} value={i.id} className="bg-slate-950">
                      ID {i.id} - {i.name} ({i.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-white/5 pb-1">Weekly recurring days</label>
                {avRules.map((rule, index) => {
                  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  return (
                    <div key={rule.day_of_week} className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-white/5 transition">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`av-enabled-${rule.day_of_week}`}
                          checked={rule.enabled}
                          onChange={(e) => updateRule(index, 'enabled', e.target.checked)}
                          className="w-3.5 h-3.5 rounded cursor-pointer accent-indigo-500"
                        />
                        <label htmlFor={`av-enabled-${rule.day_of_week}`} className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
                          {dayNames[rule.day_of_week]}
                        </label>
                      </div>

                      {rule.enabled && (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="time"
                            value={rule.start_time}
                            onChange={(e) => updateRule(index, 'start_time', e.target.value)}
                            className="px-2 py-1 rounded text-xs bg-slate-950 border border-white/10"
                          />
                          <span className="text-[10px] text-slate-500 font-bold uppercase">to</span>
                          <input
                            type="time"
                            value={rule.end_time}
                            onChange={(e) => updateRule(index, 'end_time', e.target.value)}
                            className="px-2 py-1 rounded text-xs bg-slate-950 border border-white/10"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg text-xs font-bold transition duration-200 cursor-pointer shadow-lg shadow-indigo-500/20"
              >
                {loading ? 'Saving...' : 'Save Availability Rules'}
              </button>
            </form>
          )}

        </div>

        {/* RIGHT COLUMN: ACTIVE DATABASE LISTS (col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* LISTS DISPLAY 1: LINKS */}
          {(activeTab === 'links' || activeTab === 'mappings') && (
            <div className="glass-panel rounded-3xl p-6 border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Interview Links ({linksList.length})</h3>
                <button 
                  onClick={fetchData} 
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
                  title="Refresh links list"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18" />
                  </svg>
                </button>
              </div>

              {linksList.length === 0 ? (
                <p className="text-slate-500 text-xs py-4 text-center">No scheduling links created yet.</p>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[400px] pr-1">
                  {linksList.map((link) => {
                    const formattedStartDate = link.start_date ? link.start_date.split('T')[0] : '';
                    return (
                      <div key={link.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-white/10 transition">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-400">ID: {link.id}</span>
                            <h4 className="text-sm font-extrabold text-slate-100">{link.title}</h4>
                          </div>
                          <p className="text-slate-400 text-xs font-semibold">{link.role} • {link.duration_minutes}m interview (+{link.buffer_minutes}m buffer) • Timezone: {link.timezone}</p>
                          <span className="block text-[10px] text-indigo-400 font-semibold font-mono">
                            URL: /i/{link.slug}{formattedStartDate ? `/${formattedStartDate}` : ''}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopyLink(link.slug, link.start_date)}
                          className="px-3.5 py-2 text-[10px] font-bold bg-indigo-500/10 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg border border-indigo-500/20 transition cursor-pointer select-none flex items-center gap-1 w-full sm:w-auto justify-center"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          Copy Link
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* LISTS DISPLAY 2: INTERVIEWERS */}
          {(activeTab === 'interviewers' || activeTab === 'mappings' || activeTab === 'availability') && (
            <div className="glass-panel rounded-3xl p-6 border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Registered Interviewers ({interviewersList.length})</h3>
                <button 
                  onClick={fetchData} 
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
                  title="Refresh interviewers list"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18" />
                  </svg>
                </button>
              </div>

              {interviewersList.length === 0 ? (
                <p className="text-slate-500 text-xs py-4 text-center">No interviewers registered yet.</p>
              ) : (
                <div className="space-y-2 overflow-y-auto max-h-[400px] pr-1">
                  {interviewersList.map((interviewer) => (
                    <div key={interviewer.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-400">ID: {interviewer.id}</span>
                          <span className="text-sm font-bold text-slate-200">{interviewer.name}</span>
                        </div>
                        <span className="block text-xs text-slate-400">{interviewer.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {interviewer.google_connected ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ✓ Google Connected
                          </span>
                        ) : (
                          <a
                            href={`http://localhost:3000/auth/google?interviewerId=${interviewer.id}`}
                            className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition select-none cursor-pointer"
                          >
                            Connect Google Calendar
                          </a>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          interviewer.is_active 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {interviewer.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
      )}
    </div>
  );
}
