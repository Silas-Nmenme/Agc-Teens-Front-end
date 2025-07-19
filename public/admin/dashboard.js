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
      setupMediaUpload();
      setupSearchFilters();
    })
    .finally(() => hideLoading());
};


// ============================
// Media Upload Handling
// ============================
function setupMediaUpload() {
  const mediaInput = document.getElementById("mediaFile");
  const preview = document.getElementById("mediaPreview");
  const form = document.getElementById("mediaUploadForm");

  if (!mediaInput || !preview || !form) return;

  mediaInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    preview.innerHTML = "";
    if (!file) return;
    const url = URL.createObjectURL(file);
    const ext = file.name.split('.').pop().toLowerCase();

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
}

// ============================
// Search Filter Handling
// ============================
function setupSearchFilters() {
  const rsvpSearch = document.getElementById("rsvpSearch");
  const subscriberSearch = document.getElementById("subscriberSearch");

  if (rsvpSearch) {
    rsvpSearch.addEventListener("input", () => {
      const query = rsvpSearch.value.toLowerCase();
      document.querySelectorAll(".rsvp-item").forEach((item) => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query) ? "block" : "none";
      });
    });
  }

  if (subscriberSearch) {
    subscriberSearch.addEventListener("input", () => {
      const query = subscriberSearch.value.toLowerCase();
      document.querySelectorAll(".subscriber-item").forEach((item) => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query) ? "block" : "none";
      });
    });
  }
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

async function loadRSVPs() {
  try {
    const res = await fetch("/api/admin/rsvp", { headers: authHeaders });
    const data = await res.json();

    const container = document.getElementById("rsvpList");
    container.innerHTML = "";

    data.forEach((item, index) => {
      const div = document.createElement("div");
      div.className = "rsvp-item";
      div.innerHTML = `<strong>${index + 1}. ${item.name}</strong> — ${item.email}`;
      container.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading RSVPs:", err);
  }
}

async function loadPrayers() {
  try {
    const res = await fetch("/api/admin/prayers", { headers: authHeaders });
    const data = await res.json();

    const container = document.getElementById("prayerList");
    container.innerHTML = "";

    data.forEach((item, index) => {
      const div = document.createElement("div");
      div.className = "prayer-item";
      div.innerHTML = `<strong>${index + 1}. ${item.name}</strong><br><em>${item.email || 'No email'}</em><p>${item.message}</p>`;
      container.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading prayers:", err);
  }
}

async function loadBlogs() {
  try {
    const res = await fetch("/api/blogs", { headers: authHeaders });
    const data = await res.json();

    const container = document.getElementById("blogList");
    container.innerHTML = "";

    data.forEach((item, index) => {
      const div = document.createElement("div");
      div.className = "blog-item";
      div.innerHTML = `<h4>${index + 1}. ${item.title}</h4><p>${item.content}</p>`;
      container.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading blogs:", err);
  }
}

async function loadSubscribers() {
  try {
    const res = await fetch("/api/admin/subscribers", { headers: authHeaders });
    const data = await res.json();

    const container = document.getElementById("subscriberList");
    container.innerHTML = "";

    data.forEach((sub, index) => {
      const div = document.createElement("div");
      div.className = "subscriber-item";
      div.innerHTML = `${index + 1}. ${sub.email}`;
      container.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading subscribers:", err);
  }
}

async function loadMedia() {
  try {
    const res = await fetch("/api/media", { headers: authHeaders });
    const data = await res.json();

    const container = document.getElementById("mediaList");
    container.innerHTML = "";

    data.forEach((media, index) => {
      const ext = media.filename.split('.').pop().toLowerCase();
      let mediaTag = "";

      if (['jpg', 'png', 'jpeg', 'gif'].includes(ext)) {
        mediaTag = `<img src="/${media.path}" width="200" />`;
      } else if (['mp4', 'mov'].includes(ext)) {
        mediaTag = `<video src="/${media.path}" width="300" controls></video>`;
      } else if (['mp3', 'wav'].includes(ext)) {
        mediaTag = `<audio src="/${media.path}" controls></audio>`;
      } else {
        mediaTag = `<a href="/${media.path}" target="_blank">Download</a>`;
      }

      const div = document.createElement("div");
      div.className = "media-item";
      div.innerHTML = `<strong>${index + 1}. ${media.filename}</strong><br>${mediaTag}`;
      container.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading media:", err);
  }
}
