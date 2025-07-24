// ============================
// Authentication Check
// ============================
const token = localStorage.getItem("adminToken");
if (!token) window.location.href = "login.html";

const authHeaders = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
};

let currentAdminRole = "user";
let currentAdminName = "Admin";

// ============================
// Page Load
// ============================
window.onload = () => {
  showLoading();
  applyDarkModeFromStorage();
  Promise.all([
    loadDashboardStats(),
    fetchAdminInfo()
  ]).then(() => {
    setupSidebarLinks();
    bindToggleButtons();
    setupDarkModeToggle();
    setupMediaUpload();
    setupSearchFilters();
  }).finally(() => hideLoading());
};

// ============================
// Toggle Panel
// ============================
function togglePanel(panelId) {
  const allPanels = document.querySelectorAll(".panel");
  allPanels.forEach((panel) => (panel.style.display = "none"));

  const activePanel = document.getElementById(panelId);
  if (activePanel) {
    activePanel.style.display = "block";
    const content = activePanel.querySelector(".panel-content");
    if (content) content.style.display = "block";

    switch (panelId) {
      case "rsvpPanel": loadRSVPs(); break;
      case "prayerPanel": loadPrayers(); break;
      case "blogPanel": loadBlogs(); break;
      case "mediaPanel": loadMedia(); break;
      case "subscribersPanel": loadSubscribers(); break;
      case "profilePanel": fetchAdminInfo(); break;
    }

    loadDashboardStats(); // Refresh top cards too
  }
}


// ============================
// Dashboard Stats Fetcher
// ============================
async function loadDashboardStats() {
  try {
    const [rsvp, prayer, blog, sub] = await Promise.all([
      fetch("/api/rsvps/count", { headers: authHeaders }).then(r => r.json()),
      fetch("/api/prayers/count", { headers: authHeaders }).then(r => r.json()),
      fetch("/api/blogs/count", { headers: authHeaders }).then(r => r.json()),
      fetch("/api/subscribers/count", { headers: authHeaders }).then(r => r.json()),
    ]);

    document.getElementById("rsvpCount").textContent = rsvp?.count || 0;
    document.getElementById("prayerCount").textContent = prayer?.count || 0;
    document.getElementById("blogCount").textContent = blog?.count || 0;
    document.getElementById("subscriberCount").textContent = sub?.count || 0;

  } catch (err) {
    console.error("Dashboard stat error:", err);
    showToast("Error loading dashboard stats", "error");
  }
}


// ============================
// Admin Info
// ============================
async function fetchAdminInfo() {
  try {
    const res = await fetch("/api/admin/me", { headers: authHeaders });
    const data = await res.json();
    if (res.ok) {
      currentAdminRole = data.role || "user";
      currentAdminName = data.name || "Admin";
      document.getElementById("adminDisplayName").textContent = `Welcome, ${currentAdminName}`;
      document.getElementById("adminEmail").textContent = data.email;
      document.getElementById("adminRole").textContent = data.role;
    }
  } catch (err) {
    console.error("Fetch admin info error:", err);
  }
}

// ============================
// Sidebar
// ============================
function setupSidebarLinks() {
  document.querySelectorAll(".sidebar a").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const panelId = link.getAttribute("onclick").match(/'(.*?)'/)[1];
      togglePanel(panelId);
    });
  });
}

function bindToggleButtons() {
  document.querySelectorAll(".toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const content = btn.nextElementSibling;
      content.style.display = content.style.display === "block" ? "none" : "block";
    });
  });
}

// ============================
// Loaders
// ============================
function showLoading() {
  const spinner = document.createElement("div");
  spinner.id = "loadingSpinner";
  spinner.style = "position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(255,255,255,0.8);z-index:9999;display:flex;justify-content:center;align-items:center;";
  spinner.innerHTML = `<div style="border:6px solid #f3f3f3;border-top:6px solid #3498db;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;"></div>`;
  document.body.appendChild(spinner);
}

function hideLoading() {
  const spinner = document.getElementById("loadingSpinner");
  if (spinner) spinner.remove();
}

// ============================
// Dark Mode
// ============================
function setupDarkModeToggle() {
  const toggle = document.createElement("button");
  toggle.id = "darkModeToggle";
  toggle.textContent = "🌓";
  toggle.title = "Toggle Dark Mode";
  toggle.onclick = () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
  };
  document.body.appendChild(toggle);
}

function applyDarkModeFromStorage() {
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
  }
}

//Load RSVPs
async function loadRSVPs() {
  const listDiv = document.getElementById("rsvpList");
  listDiv.innerHTML = "<p>Loading...</p>";
  try {
    const res = await fetch("/api/rsvps", { headers: authHeaders });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch RSVPs");

    if (!data.rsvps || data.rsvps.length === 0) {
      listDiv.innerHTML = "<p>No RSVPs found.</p>";
      return;
    }

    listDiv.innerHTML = data.rsvps.map(rsvp => `
      <div class="rsvp-item">
        <strong>${rsvp.name}</strong> (${rsvp.email}) — Event: ${rsvp.event}
      </div>
    `).join("");
  } catch (err) {
    listDiv.innerHTML = `<p style="color:red;">${err.message}</p>`;
  }
}

//Load Prayers
async function loadPrayers() {
  const listDiv = document.getElementById("prayerList");
  listDiv.innerHTML = "<p>Loading...</p>";
  try {
    const res = await fetch("/api/prayers", { headers: authHeaders });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch prayers");

    if (!data.prayers || data.prayers.length === 0) {
      listDiv.innerHTML = "<p>No prayer requests found.</p>";
      return;
    }

    listDiv.innerHTML = data.prayers.map(p => `
      <div class="prayer-item">
        <strong>${p.name}</strong> (${p.email}):<br/>
        <em>${p.request}</em>
      </div>
    `).join("");
  } catch (err) {
    listDiv.innerHTML = `<p style="color:red;">${err.message}</p>`;
  }
}

//Load Blogs
async function loadBlogs() {
  const listDiv = document.getElementById("blogList");
  listDiv.innerHTML = "<p>Loading...</p>";
  try {
    const res = await fetch("/api/blogs", { headers: authHeaders });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch blogs");

    if (!data.blogs || data.blogs.length === 0) {
      listDiv.innerHTML = "<p>No blogs found.</p>";
      return;
    }

    listDiv.innerHTML = data.blogs.map(blog => `
      <div class="blog-item">
        <h4>${blog.title}</h4>
        <p>${blog.content.slice(0, 100)}...</p>
        <small>By ${blog.author}</small>
      </div>
    `).join("");
  } catch (err) {
    listDiv.innerHTML = `<p style="color:red;">${err.message}</p>`;
  }
}


// Load Subscribers
async function loadSubscribers() {
  const listDiv = document.getElementById("subscriberList");
  listDiv.innerHTML = "<p>Loading...</p>";
  try {
    const res = await fetch("/api/subscribers", { headers: authHeaders });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch subscribers");

    if (!data.subscribers || data.subscribers.length === 0) {
      listDiv.innerHTML = "<p>No subscribers found.</p>";
      return;
    }

    listDiv.innerHTML = data.subscribers.map(sub => `
      <div class="subscriber-item">
        <strong>${sub.email}</strong>
        <small>Subscribed: ${new Date(sub.subscribedAt).toLocaleDateString()}</small>
      </div>
    `).join("");
  } catch (err) {
    listDiv.innerHTML = `<p style="color:red;">${err.message}</p>`;
  }
}
async function loadSubscribers() {
  const listDiv = document.getElementById("subscriberList");
  listDiv.innerHTML = "<p>Loading...</p>";
  try {
    const res = await fetch("/api/subscribers", { headers: authHeaders });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch subscribers");

    if (!data.subscribers || data.subscribers.length === 0) {
      listDiv.innerHTML = "<p>No subscribers found.</p>";
      return;
    }

    listDiv.innerHTML = data.subscribers.map(sub => `
      <div class="subscriber-item">
        <strong>${sub.email}</strong>
        <small>Subscribed: ${new Date(sub.subscribedAt).toLocaleDateString()}</small>
      </div>
    `).join("");
  } catch (err) {
    listDiv.innerHTML = `<p style="color:red;">${err.message}</p>`;
  }
}


// ============================
// Toasts
// ============================
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 100);
  setTimeout(() => toast.remove(), 4000);
}

// ============================
// Avatar Dropdown
// ============================
function toggleDropdown(show) {
  const dropdown = document.getElementById("adminDropdown");
  if (dropdown) {
    dropdown.classList.toggle("hidden", !show);
  }
}

function logoutAdmin() {
  localStorage.removeItem("adminToken");
  window.location.href = "login.html";
}

// ============================
// Media List & Delete
// ============================
async function loadMedia() {
  const mediaListDiv = document.getElementById("mediaList");
  mediaListDiv.innerHTML = "<p>Loading...</p>";
  try {
    const res = await fetch("/api/media", { headers: authHeaders });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch media");

    if (!data.media || !data.media.length) {
      mediaListDiv.innerHTML = "<p>No media uploaded yet.</p>";
      return;
    }

    mediaListDiv.innerHTML = data.media.map(media => {
      let preview = "";
      if (media.mimetype.startsWith("image/")) {
        preview = `<img src="/${media.path}" width="120" style="max-height:80px;object-fit:cover;border-radius:6px;" />`;
      } else if (media.mimetype.startsWith("video/")) {
        preview = `<video src="/${media.path}" width="120" controls style="max-height:80px;border-radius:6px;"></video>`;
      } else if (media.mimetype.startsWith("audio/")) {
        preview = `<audio src="/${media.path}" controls></audio>`;
      }
      return `
        <div class="media-item">
          ${preview}
          <div>
            <strong>${media.originalname}</strong>
            <small>(${Math.round(media.size/1024)} KB, ${media.mimetype})</small>
          </div>
          <div class="action-buttons">
            <a href="/${media.path}" target="_blank" class="edit-btn">View</a>
            <button class="delete-btn" onclick="deleteMedia('${media._id}')">Delete</button>
          </div>
        </div>
      `;
    }).join("");
  } catch (err) {
    mediaListDiv.innerHTML = `<p style="color:red;">${err.message}</p>`;
  }
}

// ============================
// Media Upload Preview & Submit
// ============================
function setupMediaUpload() {
  const form = document.getElementById("mediaUploadForm");
  const input = document.getElementById("mediaFile");
  const preview = document.getElementById("mediaPreview");

  if (!form || !input || !preview) return;

  input.addEventListener("change", () => {
    const file = input.files[0];
    preview.innerHTML = "";
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    const url = URL.createObjectURL(file);

    if (["jpg", "jpeg", "png", "gif"].includes(ext)) {
      preview.innerHTML = `<img src="${url}" width="200" />`;
    } else if (["mp4", "mov"].includes(ext)) {
      preview.innerHTML = `<video src="${url}" width="300" controls></video>`;
    } else if (["mp3", "wav"].includes(ext)) {
      preview.innerHTML = `<audio src="${url}" controls></audio>`;
    } else {
      preview.innerHTML = `<p>No preview available</p>`;
    }
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const file = input.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/media/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      showToast("Media uploaded", "success");
      form.reset();
      preview.innerHTML = "";
      loadMedia();
    } catch (err) {
      showToast(err.message || "Upload failed", "error");
    }
  });
}

// ============================
// Search Filter
// ============================
function setupSearchFilters() {
  const rsvpSearch = document.getElementById("rsvpSearch");
  const subscriberSearch = document.getElementById("subscriberSearch");

  if (rsvpSearch) {
    rsvpSearch.addEventListener("input", () => {
      const query = rsvpSearch.value.toLowerCase();
      document.querySelectorAll(".rsvp-item").forEach((item) => {
        item.style.display = item.textContent.toLowerCase().includes(query) ? "block" : "none";
      });
    });
  }

  if (subscriberSearch) {
    subscriberSearch.addEventListener("input", () => {
      const query = subscriberSearch.value.toLowerCase();
      document.querySelectorAll(".subscriber-item").forEach((item) => {
        item.style.display = item.textContent.toLowerCase().includes(query) ? "block" : "none";
      });
    });
  }
}

// ============================
// Media Delete
// ============================
async function deleteMedia(id) {
  if (!confirm("Are you sure you want to delete this media file?")) return;

  try {
    const res = await fetch(`/api/media/${id}`, {
      method: "DELETE",
      headers: authHeaders,
    });

    const data = await res.json();
    if (res.ok) {
      showToast("Deleted successfully", "success");
      loadMedia();
    } else {
      showToast(data.error || "Delete failed", "error");
    }
  } catch (err) {
    showToast("Delete request failed", "error");
  }
}

// ============================
// Expose Functions to HTML
// ============================
window.togglePanel = togglePanel;
window.toggleDropdown = toggleDropdown;
