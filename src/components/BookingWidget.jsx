import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import TimezoneSelector from './TimezoneSelector';

export default function BookingWidget({ slug: initialSlug, initialStartDate }) {
  const [slug, setSlug] = useState(initialSlug || 'backend-sde1');
  const [startDate, setStartDate] = useState(initialStartDate || '');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [linkConfig, setLinkConfig] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Date selection states
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Booking form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Fetch link details when slug changes
  useEffect(() => {
    if (slug) {
      const loadLinkDetails = async () => {
        try {
          const config = await api.getLinkDetails(slug);
          setLinkConfig(config);
          setTimezone(config.timezone);
        } catch (err) {
          console.error('Failed to load link details:', err);
          setError(err.message || 'Failed to load link details');
        }
      };
      loadLinkDetails();
    }
  }, [slug]);

  // Fetch slots on slug/startDate/linkConfig change
  useEffect(() => {
    if (slug && linkConfig) {
      fetchSlots();
    }
  }, [slug, startDate, linkConfig]);

  const fetchSlots = async () => {
    if (!linkConfig) return;
    setLoading(true);
    setError(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const startDateParam = startDate || urlParams.get('startDate');
      const data = await api.getSlots(slug, linkConfig.timezone, startDateParam);
      setSlots(data);
      
      // Auto-select first date that has slots
      if (data.length > 0) {
        const dates = groupSlotsByDate(data);
        const uniqueDates = Object.keys(dates).sort();
        if (uniqueDates.length > 0) {
          setSelectedDate(uniqueDates[0]);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load available slots');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  // Group slots by local date string
  const groupSlotsByDate = (allSlots) => {
    const groups = {};
    allSlots.forEach((slot) => {
      // Extract local date e.g. "Monday, Jun 22" or "2026-06-22"
      // Date is formatted in timezone from backend, so we split at 'T'
      const datePart = slot.startTime.split('T')[0];
      if (!groups[datePart]) {
        groups[datePart] = [];
      }
      groups[datePart].push(slot);
    });
    return groups;
  };

  const slotsByDate = groupSlotsByDate(slots);
  const availableDates = Object.keys(slotsByDate).sort();

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setBookingLoading(true);
    setError(null);
    try {
      const response = await api.bookSlot({
        slug,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        name,
        email,
        strategy: 'round-robin' // Default allocation strategy
      });
      setBookingSuccess(response.booking);
      setName('');
      setEmail('');
      // Refresh slots
      fetchSlots();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  // Format date display
  const formatDateHeader = (dateStr) => {
    const options = { weekday: 'long', month: 'short', day: 'numeric', timeZone: timezone };
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', options);
  };

  const formatTime = (timeStr) => {
    // Slice off ISO offset/seconds for display e.g. "2026-06-22T10:00:00-04:00" -> "10:00 AM"
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone
      });
    } catch (e) {
      return timeStr;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      {/* Title / Slug Selector */}
      {!initialSlug && (
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping"></span>
            <span className="text-sm font-medium text-slate-300">Public Booking Portal</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-400 uppercase">Slug:</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. backend-sde1"
                className="px-3 py-1.5 rounded-lg text-sm bg-slate-900 border border-white/10 text-white w-full sm:w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-400 uppercase">Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-sm bg-slate-900 border border-white/10 text-white w-full sm:w-40"
              />
            </div>
          </div>
        </div>
      )}

      {bookingSuccess ? (
        /* SUCCESS STATE PANEL */
        <div className="glass-panel rounded-3xl p-8 text-center max-w-xl mx-auto animate-fade-in">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-display font-extrabold text-white mb-2 tracking-tight">Confirmed!</h2>
          <p className="text-slate-400 mb-6 text-sm">
            An invitation has been scheduled in your calendar.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left mb-6 space-y-3">
            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
              <span className="text-slate-400">Candidate:</span>
              <span className="text-slate-200 font-semibold">{bookingSuccess.candidateName}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
              <span className="text-slate-400">Assigned Interviewer:</span>
              <span className="text-slate-200 font-semibold">{bookingSuccess.interviewerName}</span>
            </div>
            <div className="flex justify-between items-start text-sm pt-1">
              <span className="text-slate-400 mt-0.5">Date & Time:</span>
              <div className="text-right">
                <span className="block text-slate-100 font-bold">
                  {new Date(bookingSuccess.startTime).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
                <span className="block text-indigo-400 font-semibold text-xs mt-0.5">
                  {formatTime(bookingSuccess.startTime)} - {formatTime(bookingSuccess.endTime)} ({timezone})
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setBookingSuccess(null)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-violet-500 transition duration-200 cursor-pointer w-full"
          >
            Book Another Interview
          </button>
        </div>
      ) : (
        /* MAIN SCHEDULER BOARD */
        <div className="glass-panel rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
          {/* LEFT SIDEBAR: MEET DETAIL */}
          <div className="md:col-span-4 p-8 border-b md:border-b-0 md:border-r border-white/10 bg-slate-950/40">
            <h1 className="text-2xl font-display font-extrabold text-white tracking-tight mb-1 uppercase">
              {linkConfig ? linkConfig.title : slug.replace(/-/g, ' ')}
            </h1>
            {linkConfig && (
              <p className="text-xs text-slate-400 font-semibold mb-4 uppercase tracking-wider">{linkConfig.role}</p>
            )}
            <div className="flex items-center gap-2 mb-6">
              <span className="px-2.5 py-1 text-xs font-semibold bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                Active Interview Link
              </span>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-slate-300 text-sm">
                <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  {linkConfig 
                    ? `${linkConfig.duration_minutes} mins Interview (${linkConfig.buffer_minutes}m buffer)` 
                    : '30-60 mins Interview (Link Config)'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-300 text-sm">
                <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Google Calendar Invited Automatically</span>
              </div>
            </div>

            {/* Static display instead of timezone selector dropdown */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs">
              <span className="text-slate-400 block font-semibold uppercase tracking-wider mb-1">Viewing Timezone</span>
              <span className="text-slate-200 font-bold">{timezone || 'UTC'}</span>
            </div>

            {error && (
              <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium animate-fade-in">
                {error}
              </div>
            )}
          </div>

          {/* RIGHT PANELS: DATE & SLOT SELECTION */}
          <div className="md:col-span-8 p-8 flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-slate-400 text-sm font-medium">Generating free slots...</span>
              </div>
            ) : slots.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                <svg className="w-16 h-16 text-slate-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-bold text-slate-300 mb-1">No Available Slots Found</h3>
                <p className="text-slate-500 text-sm max-w-sm">
                  We couldn't generate any free spots within the next booking window. Please check back later.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
                {/* DATE SELECTOR */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Date</h3>
                  <div className="space-y-2 overflow-y-auto max-h-[350px] pr-1">
                    {availableDates.map((dateStr) => {
                      const isActive = selectedDate === dateStr;
                      return (
                        <button
                          key={dateStr}
                          onClick={() => {
                            setSelectedDate(dateStr);
                            setSelectedSlot(null);
                          }}
                          className={`w-full text-left p-4 rounded-xl border font-semibold transition cursor-pointer flex justify-between items-center ${
                            isActive
                              ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 shadow-md'
                              : 'bg-white/5 border-white/5 text-slate-300 hover:border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <span>{formatDateHeader(dateStr)}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-900 text-slate-400'
                          }`}>
                            {slotsByDate[dateStr].length} spots
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SLOT SELECTOR */}
                <div className="flex flex-col">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                    {selectedDate ? formatDateHeader(selectedDate) : 'Select Date'}
                  </h3>
                  
                  {selectedDate && (
                    <div className="grid grid-cols-1 gap-2 overflow-y-auto max-h-[350px] pr-1">
                      {slotsByDate[selectedDate].map((slot) => {
                        const isSelected = selectedSlot === slot;
                        return (
                          <div key={slot.startTime} className="flex flex-col gap-2">
                            <button
                              onClick={() => setSelectedSlot(slot)}
                              className={`w-full py-3 rounded-xl border text-sm font-bold transition cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                                  : 'bg-slate-900/60 border-white/5 text-slate-300 hover:border-white/20 hover:bg-slate-900'
                              }`}
                            >
                              {formatTime(slot.startTime)}
                            </button>

                            {/* CONFIRMATION FORM UNDER SELECTED SLOT */}
                            {isSelected && (
                              <form onSubmit={handleBook} className="mt-2 p-4 rounded-xl border border-indigo-500 bg-slate-900/80 space-y-3 animate-fade-in">
                                <h4 className="text-xs font-bold text-slate-300 uppercase">Confirm Booking Details</h4>
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    required
                                    placeholder="Your Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-white/10 text-white"
                                  />
                                  <input
                                    type="email"
                                    required
                                    placeholder="Your Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-white/10 text-white"
                                  />
                                </div>
                                <button
                                  type="submit"
                                  disabled={bookingLoading}
                                  className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  {bookingLoading ? (
                                    <>
                                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                      Booking...
                                    </>
                                  ) : (
                                    'Confirm Reservation'
                                  )}
                                </button>
                              </form>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
