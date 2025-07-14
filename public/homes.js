const baseUrl = 'https://agc-teens-backend.onrender.com';

// RSVP form submission
async function registerEvent(e) {
  e.preventDefault();
  const name = e.target[0].value;
  const email = e.target[1].value;

  try {
    const res = await fetch(`${baseUrl}/api/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });

      const msg = await res.text();

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'RSVP failed.');

    document.getElementById('rsvp-message').textContent = data.message;
    e.target.reset();
  } catch (err) {
    console.error('RSVP Error:', err);
    document.getElementById('rsvp-message').textContent = 'Failed to submit RSVP.';
  }
}

// Prayer form submission
async function submitPrayer(e) {
  e.preventDefault();
  const name = e.target[0].value;
  const email = e.target[1].value;
  const request = e.target[2].value;

  try {
    const res = await fetch(`${baseUrl}/api/prayer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, request })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Prayer request failed.');

    document.getElementById('prayer-message').textContent = data.message;
    e.target.reset();
  } catch (err) {
    console.error('Prayer Error:', err);
    document.getElementById('prayer-message').textContent = 'Failed to submit prayer request.';
  }
}

// Newsletter subscription
async function subscribeNewsletter(e) {
  e.preventDefault();
  const email = e.target[0].value;

  try {
    const res = await fetch(`${baseUrl}/api/newsletter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Newsletter subscription failed.');

    document.getElementById('newsletter-message').textContent = data.message;
    e.target.reset();
  } catch (err) {
    console.error('Newsletter Error:', err);
    document.getElementById('newsletter-message').textContent = 'Failed to subscribe to newsletter.';
  }
}
fetch('/api/admin/prayers', {
  headers: {
    Authorization: `Bearer ${token}` // token from localStorage
  }
});