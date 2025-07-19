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
  document.querySelectorAll(".panel").forEach((p) => p.style.display = "none");
  document.querySelectorAll(".panel-content").forEach((p) => p.style.display = "none");
  const panel = document.getElementById(panelId);
  if (panel) {
    panel.style.display = "block";
    const content = panel.querySelector(".panel-content");
    if (content) content.style.display = "block";

    if (panelId === "rsvpPanel") loadRSVPs();
    if (panelId === "prayerPanel") loadPrayers();
    if (panelId === "blogPanel") loadBlogs();
    if (panelId === "mediaPanel") loadMedia();
    if (panelId === "subscribersPanel") loadSubscribers();
  }
}

// ============================
// Dashboard Stats
// ============================
async function loadDashboardStats() {
  try {
    const [rsvp, prayer, blog, sub] = await Promise.all([
      fetch("/api/rsvps/count", { headers: authHeaders }).then(r => r.json()),
      fetch("/api/prayers/count", { headers: authHeaders }).then(r => r.json()),
      fetch("/api/blogs/count", { headers: authHeaders }).then(r => r.json()),
      fetch("/api/subscribers/count", { headers: authHeaders }).then(r => r.json()),
    ]);
    document.getElementById("rsvpCount").textContent = rsvp.count;
    document.getElementById("prayerCount").textContent = prayer.count;
    document.getElementById("blogCount").textContent = blog.count;
    document.getElementById("subscriberCount").textContent = sub.count;
  } catch (err) {
    console.error("Dashboard stat error:", err);
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
      content.style.display =
        content.style.display === "block" ? "none" : "block";
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
  dropdown.classList.toggle("hidden", !show);
}

function logoutAdmin() {
  localStorage.removeItem("adminToken");
  window.location.href = "login.html";
}

// ============================
// Media Upload Preview
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
  const file = mediaInput.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append("file", file);

  try {
    await fetch("/api/media/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    showToast("Media uploaded", "success");
    loadMedia();
  } catch (err) {
    showToast("Upload failed", "error");
  }
});

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
