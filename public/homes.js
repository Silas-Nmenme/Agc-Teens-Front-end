// Scroll to Section
function scrollToSection(id) {
    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: 'smooth' });
}

// Event Countdown (Next Monday 5PM)
function updateCountdown() {
    const countdownEl = document.getElementById('event-countdown');
    if (!countdownEl) return;

    const now = new Date();
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + ((8 - now.getDay()) % 7 || 7));
    nextMonday.setHours(17, 0, 0, 0); // 5PM

    const diff = nextMonday - now;
    if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        countdownEl.textContent = `Next Teen Meeting: ${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else {
        countdownEl.textContent = "Teen Meeting is happening now!";
    }
}
setInterval(updateCountdown, 1000);

// Newsletter Subscription
async function subscribeNewsletter(e) {
  e.preventDefault();
  const email = e.target[0].value;

  try {
    const res = await fetch('http://localhost:4000/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Newsletter error.');

    document.getElementById('newsletter-message').textContent = data.message;
    e.target.reset();
  } catch (err) {
    console.error('Newsletter failed:', err);
    document.getElementById('newsletter-message').textContent = "Failed to subscribe.";
  }
}


// Prayer Request Submission
async function submitPrayer(e) {
  e.preventDefault();
  const name = e.target[0].value;
  const email = e.target[1].value;
  const request = e.target[2].value;

  try {
    const res = await fetch('http://localhost:4000/api/prayer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, request })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unknown error');

    document.getElementById('prayer-message').textContent = data.message;
    e.target.reset();
  } catch (err) {
    console.error('Prayer submission failed:', err);
    document.getElementById('prayer-message').textContent = "Failed to submit prayer request.";
  }
}



// RSVP event form
async function registerEvent(e) {
  e.preventDefault();
  const name = e.target[0].value;
  const email = e.target[1].value;

  try {
    const res = await fetch('http://localhost:4000/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'RSVP error.');

    document.getElementById('rsvp-message').textContent = data.message;
    e.target.reset();
  } catch (err) {
    console.error('RSVP failed:', err);
    document.getElementById('rsvp-message').textContent = "Failed to submit RSVP.";
  }
}


// Chat widget behavior
function toggleChat() {
    const widget = document.getElementById('chat-widget');
    widget.classList.toggle('closed');
    widget.style.maxHeight = widget.classList.contains('closed') ? '40px' : '400px';
}

function sendChat(event) {
    event.preventDefault();
    const input = document.getElementById('chat-input-field');
    const chatBody = document.getElementById('chat-body');

    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.textContent = input.value;
    chatBody.appendChild(userMsg);

    const botMsg = document.createElement('div');
    botMsg.className = 'chat-message bot';
    const text = input.value.toLowerCase();

    if (text.includes('faith')) {
        botMsg.textContent = "Faith means trusting God even when you can't see the whole path. 🙏";
    } else if (text.includes('event')) {
        botMsg.textContent = "Our next event is on Monday at 5pm! Check the Events section for more.";
    } else {
        botMsg.textContent = "Thanks for reaching out! A leader will respond soon.";
    }

    setTimeout(() => chatBody.appendChild(botMsg), 600);
    input.value = '';
    chatBody.scrollTop = chatBody.scrollHeight;
}

// 🔔 Notification permission
function askNotificationPermission() {
    if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification('AGC Teens', {
                    body: 'Stay tuned for our next event!',
                    icon: 'images/logo.png'
                });
            }
        });
    }
}

// ⏯ Run on window load
window.onload = function () {
    updateCountdown();
    askNotificationPermission();
};
