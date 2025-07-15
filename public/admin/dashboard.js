// dashboard.js


// Load dashboard stats
async function loadDashboardStats() {
  try {
    const [rsvpRes, prayerRes, blogRes, subRes] = await Promise.all([
      fetch('/api/rsvps/count'),
      fetch('/api/prayers/count'),
      fetch('/api/blogs/count'),
      fetch('/api/subscribers/count')
    ]);

    const rsvp = await rsvpRes.json();
    const prayer = await prayerRes.json();
    const blog = await blogRes.json();
    const sub = await subRes.json();

    document.getElementById('rsvpCount').textContent = rsvp.count;
    document.getElementById('prayerCount').textContent = prayer.count;
    document.getElementById('blogCount').textContent = blog.count;
    document.getElementById('subscriberCount').textContent = sub.count;
  } catch (err) {
    console.error('Error loading dashboard stats:', err);
  }
}

window.onload = loadDashboardStats;

document.querySelectorAll('.toggle-btn').forEach(button => {
  button.addEventListener('click', () => {
    const panel = button.nextElementSibling;
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
  });
});

// RSVPs
async function loadRSVPs() {
  try {
    const res = await fetch('/api/rsvps');
    const data = await res.json();

    const table = document.getElementById('rsvpTable');
    table.innerHTML = `
      <tr><th>Name</th><th>Email</th><th>Event</th><th>Actions</th></tr>
      ${data.map(rsvp => `
        <tr>
          <td>${rsvp.name}</td>
          <td>${rsvp.email}</td>
          <td>${rsvp.event}</td>
          <td>
            <button onclick="editRSVP('${rsvp._id}')">Edit</button>
            <button onclick="deleteRSVP('${rsvp._id}')">Delete</button>
          </td>
        </tr>
      `).join('')}`;
  } catch (err) {
    console.error('Failed to load RSVPs', err);
  }
}

// Prayers
async function loadPrayers() {
  try {
    const res = await fetch('/api/prayers');
    const data = await res.json();

    const table = document.getElementById('prayerTable');
    table.innerHTML = `
      <tr><th>Name</th><th>Email</th><th>Prayer Request</th><th>Actions</th></tr>
      ${data.map(prayer => `
        <tr>
          <td>${prayer.name}</td>
          <td>${prayer.email}</td>
          <td>${prayer.request}</td>
          <td>
            <button onclick="editPrayer('${prayer._id}')">Edit</button>
            <button onclick="deletePrayer('${prayer._id}')">Delete</button>
          </td>
        </tr>
      `).join('')}`;
  } catch (err) {
    console.error('Failed to load prayers', err);
  }
}

// Blogs
async function loadBlogs() {
  try {
    const res = await fetch('/api/blogs');
    const data = await res.json();

    const table = document.getElementById('blogPostTable');
    table.innerHTML = `
      <tr><th>Title</th><th>Author</th><th>Date</th><th>Actions</th></tr>
      ${data.map(blog => `
        <tr>
          <td>${blog.title}</td>
          <td>${blog.author}</td>
          <td>${new Date(blog.date).toLocaleDateString()}</td>
          <td>
            <button onclick="editBlog('${blog._id}')">Edit</button>
            <button onclick="deleteBlog('${blog._id}')">Delete</button>
          </td>
        </tr>
      `).join('')}`;
  } catch (err) {
    console.error('Failed to load blogs', err);
  }
}

// Subscribers
async function loadSubscribers() {
  try {
    const res = await fetch('/api/subscribers');
    const data = await res.json();

    const table = document.getElementById('subscribersTable');
    table.innerHTML = `
      <tr><th>Email</th><th>Subscribed At</th><th>Actions</th></tr>
      ${data.map(sub => `
        <tr>
          <td>${sub.email}</td>
          <td>${new Date(sub.dateSubscribed).toLocaleDateString()}</td>
          <td>
            <button onclick="editSubscriber('${sub._id}', '${sub.email}')">Edit</button>
            <button onclick="deleteSubscriber('${sub._id}')">Delete</button>
          </td>
        </tr>
      `).join('')}`;
  } catch (err) {
    console.error('Failed to load subscribers', err);
  }
}

function editSubscriber(id, email) {
  const newEmail = prompt('Edit subscriber email:', email);
  if (!newEmail) return;

  fetch(`/api/subscribers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: newEmail })
  }).then(res => {
    if (res.ok) loadSubscribers();
  });
}

async function deleteSubscriber(id) {
  if (!confirm('Delete this subscriber?')) return;
  await fetch(`/api/subscribers/${id}`, { method: 'DELETE' });
  loadSubscribers();
}

// Media
async function loadMedia() {
  try {
    const res = await fetch('/api/media');
    const data = await res.json();

    const table = document.getElementById('mediaTable');
    table.innerHTML = `
      <tr><th>Filename</th><th>Type</th><th>Uploaded</th><th>Actions</th></tr>
      ${data.map(file => `
        <tr>
          <td>${file.filename}</td>
          <td>${file.type}</td>
          <td>${new Date(file.uploadedAt).toLocaleString()}</td>
          <td><button onclick="deleteMedia('${file._id}')">Delete</button></td>
        </tr>
      `).join('')}`;
  } catch (err) {
    console.error('Failed to load media', err);
  }
}

async function deleteMedia(id) {
  if (!confirm('Delete this media file?')) return;
  await fetch(`/api/media/${id}`, { method: 'DELETE' });
  loadMedia();
}

// Toggle buttons bind data loaders

if (document.getElementById('rsvpPanel')) {
  document.getElementById('rsvpPanel').querySelector('.toggle-btn')
    .addEventListener('click', loadRSVPs);
}
if (document.getElementById('prayerPanel')) {
  document.getElementById('prayerPanel').querySelector('.toggle-btn')
    .addEventListener('click', loadPrayers);
}
if (document.getElementById('blogPanel')) {
  document.getElementById('blogPanel').querySelector('.toggle-btn')
    .addEventListener('click', loadBlogs);
}
if (document.getElementById('subscribersPanel')) {
  document.getElementById('subscribersPanel').querySelector('.toggle-btn')
    .addEventListener('click', loadSubscribers);
}
if (document.getElementById('mediaPanel')) {
  document.getElementById('mediaPanel').querySelector('.toggle-btn')
    .addEventListener('click', loadMedia);
}
// === Modal Logic ===
const modal = document.getElementById('editModal');
const form = document.getElementById('editForm');

function closeModal() {
  modal.classList.add('hidden');
  form.reset();
  document.getElementById('editId').value = '';
  document.getElementById('modalTitle').textContent = '';
  document.getElementById('editName').parentElement.style.display = 'none';
  document.getElementById('editEmail').parentElement.style.display = 'none';
  document.getElementById('eventGroup').style.display = 'none';
  document.getElementById('requestGroup').style.display = 'none';
}

// ==== RSVP EDIT ====
async function editRSVP(id) {
  try {
    const res = await fetch(`/api/rsvps/${id}`);
    const rsvp = await res.json();

    document.getElementById('modalTitle').textContent = 'Edit RSVP';
    form.dataset.type = 'rsvp';
    document.getElementById('editId').value = id;

    document.getElementById('editName').value = rsvp.name;
    document.getElementById('editEmail').value = rsvp.email;
    document.getElementById('editEvent').value = rsvp.event;

    // Show relevant fields
    document.getElementById('editName').parentElement.style.display = 'block';
    document.getElementById('editEmail').parentElement.style.display = 'block';
    document.getElementById('eventGroup').style.display = 'block';

    modal.classList.remove('hidden');
  } catch (err) {
    console.error('Failed to load RSVP', err);
  }
}

// ==== PRAYER EDIT ====
async function editPrayer(id) {
  try {
    const res = await fetch(`/api/prayers/${id}`);
    const prayer = await res.json();

    document.getElementById('modalTitle').textContent = 'Edit Prayer Request';
    form.dataset.type = 'prayer';
    document.getElementById('editId').value = id;

    document.getElementById('editName').value = prayer.name;
    document.getElementById('editEmail').value = prayer.email;
    document.getElementById('editRequest').value = prayer.request;

    // Show relevant fields
    document.getElementById('editName').parentElement.style.display = 'block';
    document.getElementById('editEmail').parentElement.style.display = 'block';
    document.getElementById('requestGroup').style.display = 'block';

    modal.classList.remove('hidden');
  } catch (err) {
    console.error('Failed to load prayer', err);
  }
}

// ==== SUBSCRIBER EDIT ====
async function editSubscriber(id) {
  try {
    const res = await fetch(`/api/subscribers/${id}`);
    const sub = await res.json();

    document.getElementById('modalTitle').textContent = 'Edit Subscriber';
    form.dataset.type = 'subscriber';
    document.getElementById('editId').value = id;

    document.getElementById('editEmail').value = sub.email;

    // Only show email field
    document.getElementById('editName').parentElement.style.display = 'none';
    document.getElementById('eventGroup').style.display = 'none';
    document.getElementById('requestGroup').style.display = 'none';
    document.getElementById('editEmail').parentElement.style.display = 'block';

    modal.classList.remove('hidden');
  } catch (err) {
    console.error('Failed to load subscriber', err);
  }
}

// === SUBMIT HANDLER ===
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('editId').value;
  const type = form.dataset.type;
  let url = '', payload = {};

  if (type === 'rsvp') {
    url = `/api/rsvps/${id}`;
    payload = {
      name: document.getElementById('editName').value,
      email: document.getElementById('editEmail').value,
      event: document.getElementById('editEvent').value
    };
  } else if (type === 'prayer') {
    url = `/api/prayers/${id}`;
    payload = {
      name: document.getElementById('editName').value,
      email: document.getElementById('editEmail').value,
      request: document.getElementById('editRequest').value
    };
  } else if (type === 'subscriber') {
    url = `/api/subscribers/${id}`;
    payload = {
      email: document.getElementById('editEmail').value
    };
  }

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      closeModal();
      if (type === 'rsvp') loadRSVPs();
      if (type === 'prayer') loadPrayers();
      if (type === 'subscriber') loadSubscribers();
    } else {
      console.error('Failed to update');
    }
  } catch (err) {
    console.error('Edit failed:', err);
  }
});

function logoutAdmin() {
  localStorage.removeItem('adminToken'); // Remove the token
  window.location.href = '/admin/login.html'; // Redirect to login
}

const token = localStorage.getItem('adminToken');

if (!token) {
  window.location.href = '/admin/login.html'; // redirect if not logged in
}

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`
};

// Fetch and display RSVP count
fetch('/api/rsvp', { headers })
  .then(res => res.json())
  .then(data => {
    document.getElementById('rsvpCount').textContent = data.length;
    // populate table if needed
  });

// Fetch Prayer Requests
fetch('/api/prayer', { headers })
  .then(res => res.json())
  .then(data => {
    document.getElementById('prayerCount').textContent = data.length;
  });
