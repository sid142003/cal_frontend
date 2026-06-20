const API_BASE_URL = 'http://localhost:3000';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

export const api = {
  // Public Client APIs
  getLinkDetails: (slug) => {
    return request(`/i/${slug}`, { method: 'GET' });
  },

  getSlots: (slug, timezone, startDate = null) => {
    let endpoint = `/i/${slug}/slots?`;
    const params = [];
    if (timezone) params.push(`timezone=${encodeURIComponent(timezone)}`);
    if (startDate) params.push(`startDate=${encodeURIComponent(startDate)}`);
    endpoint += params.join('&');
    return request(endpoint, { method: 'GET' });
  },

  bookSlot: (bookingDetails) => {
    return request('/book', {
      method: 'POST',
      body: bookingDetails
    });
  },

  // Admin Configuration APIs
  createInterviewLink: (linkDetails) => {
    return request('/interview-link', {
      method: 'POST',
      body: linkDetails
    });
  },

  getInterviewLinks: () => {
    return request('/interview-links', { method: 'GET' });
  },

  getBookings: () => {
    return request('/bookings', { method: 'GET' });
  },

  createInterviewer: (interviewerDetails) => {
    return request('/interviewers', {
      method: 'POST',
      body: interviewerDetails
    });
  },

  getInterviewers: () => {
    return request('/interviewers', { method: 'GET' });
  },

  mapInterviewersToLink: (linkId, interviewerIds) => {
    return request(`/interview-link/${linkId}/interviewers`, {
      method: 'POST',
      body: { interviewer_ids: interviewerIds }
    });
  },

  setAvailability: (availabilityDetails) => {
    return request('/availability', {
      method: 'POST',
      body: availabilityDetails
    });
  }
};
