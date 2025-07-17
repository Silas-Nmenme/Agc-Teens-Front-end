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
// Load Dashboard Stats
// ============================
async function loadDashboardStats() {
  try {
    const [rsvp, prayer, blog, sub] = await Promise.all([
      fetch("/api/rsvps/count", { headers: authHeaders }).then((r) => r.json()),
      fetch("/api/prayers/count", { headers: authHeaders }).then((r) => r.json()),
      fetch("/api/blogs/count", { headers: authHeaders }).then((r) => r.json()),
      fetch("/api/subscribers/count", { headers: authHeaders }).then((r) => r.json()),
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
// Page Load Actions
// ============================
window.onload = () => {
  showLoading();
  applyDarkModeFromStorage();
  Promise.all([loadDashboardStats(), fetchAdminInfo()])
    .then(() => {
      setupSidebarLinks();
      bindToggleButtons();
      setupDarkModeToggle();
    })
    .finally(() => hideLoading());
};

// ============================
// Loading Spinner
// ============================
function showLoading() {
  const spinner = document.createElement("div");
  spinner.id = "loadingSpinner";
  spinner.style.position = "fixed";
  spinner.style.top = "0";
  spinner.style.left = "0";
  spinner.style.width = "100%";
  spinner.style.height = "100%";
  spinner.style.backgroundColor = "rgba(255,255,255,0.8)";
  spinner.style.zIndex = "9999";
  spinner.style.display = "flex";
  spinner.style.justifyContent = "center";
  spinner.style.alignItems = "center";
  spinner.innerHTML = `<div style="border: 6px solid #f3f3f3; border-top: 6px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>`;
  document.body.appendChild(spinner);
}

function hideLoading() {
  const spinner = document.getElementById("loadingSpinner");
  if (spinner) spinner.remove();
}

// ============================
// Toast Notification
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
// Dark Mode Toggle
// ============================
function setupDarkModeToggle() {
  const toggle = document.createElement("button");
  toggle.id = "darkModeToggle";
  toggle.textContent = "🌓";
  toggle.title = "Toggle Dark Mode";
  toggle.style.position = "fixed";
  toggle.style.bottom = "20px";
  toggle.style.right = "20px";
  toggle.style.zIndex = 10000;
  toggle.style.padding = "0.5rem 1rem";
  toggle.style.border = "none";
  toggle.style.borderRadius = "20px";
  toggle.style.background = "#2c3e50";
  toggle.style.color = "white";
  toggle.style.cursor = "pointer";
  toggle.onclick = () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
  };
  document.body.appendChild(toggle);
}

function applyDarkModeFromStorage() {
  const enabled = localStorage.getItem("darkMode") === "true";
  if (enabled) document.body.classList.add("dark-mode");
}

// ============================
// Sidebar Navigation Activation
// ============================
function setupSidebarLinks() {
  const links = document.querySelectorAll(".sidebar a");
  const panels = document.querySelectorAll(".panel");

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const panelId = link.getAttribute("onclick").match(/'(.*?)'/)[1];

      panels.forEach((p) => (p.style.display = "none"));
      document.querySelectorAll(".panel-content").forEach((p) => (p.style.display = "none"));

      const panel = document.getElementById(panelId);
      if (panel) {
        panel.style.display = "block";
        panel.querySelector(".panel-content").style.display = "block";

        if (panelId === "rsvpPanel") loadRSVPs();
        if (panelId === "prayerPanel") loadPrayers();
        if (panelId === "blogPanel") loadBlogs();
        if (panelId === "mediaPanel") loadMedia();
        if (panelId === "subscribersPanel") loadSubscribers();
      }
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

// Update welcome text dynamically
function updateWelcomeText() {
  const nameSpan = document.getElementById("adminDisplayName");
  if (nameSpan && currentAdminName) {
    nameSpan.textContent = `Welcome, ${currentAdminName}`;
  }
}

// ============================
// Fetch Admin Info
// ============================
async function fetchAdminInfo() {
  try {
    const res = await fetch("/api/admin/me", { headers: authHeaders });
    const data = await res.json();
    if (res.ok) {
      currentAdminRole = data.role || "user";
      currentAdminName = data.name || "Admin";
      updateWelcomeText();
    }
  } catch (err) {
    console.error("Failed to fetch admin info:", err);
  }
}

// Spinner animation
const styleTag = document.createElement("style");
styleTag.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
document.head.appendChild(styleTag);
