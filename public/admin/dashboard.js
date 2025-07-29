// ============================
// Authentication Check
// ============================
const token = localStorage.getItem("adminToken")
if (!token) window.location.href = "login.html"

const authHeaders = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
}

const currentAdminRole = "user"
const currentAdminName = "Admin"

// ============================
// Page Load
// ============================
window.onload = () => {
  showLoading()
  applyDarkModeFromStorage()
  Promise.all([loadDashboardStats(), fetchAdminInfo()])
    .then(() => {
      setupSidebarLinks()
      bindToggleButtons()
      setupDarkModeToggle()
      setupMediaUpload()
      setupSearchFilters()
      setupProfileForm() // NEW: Setup profile form
    })
    .finally(() => hideLoading())
}

// ============================
// Toggle Panel
// ============================
function togglePanel(panelId) {
  const allPanels = document.querySelectorAll(".panel")
  allPanels.forEach((panel) => (panel.style.display = "none"))

  const activePanel = document.getElementById(panelId)
  if (activePanel) {
    activePanel.style.display = "block"
    const content = activePanel.querySelector(".panel-content")
    if (content) content.style.display = "block"

    switch (panelId) {
      case "rsvpPanel":
        loadRSVPs()
        break
      case "prayerPanel":
        loadPrayers()
        break
      case "blogPanel":
        loadBlogs()
        break
      case "mediaPanel":
        loadMedia()
        break
      case "subscribersPanel":
        loadSubscribers()
        break
      case "profilePanel":
        fetchAdminInfo()
        break
    }

    loadDashboardStats() // Refresh top cards too
  }
}

// ============================
// Dropdown Menu Toggle
// ============================
function toggleDropdown(show) {
  const dropdown = document.getElementById("adminDropdown")
  if (dropdown) {
    dropdown.classList.toggle("hidden", !show)
  }
}

// ============================
// Dashboard Stats Fetcher (FIXED)
// ============================
async function loadDashboardStats() {
  try {
    const [rsvp, prayer, blog, sub] = await Promise.all([
      fetch("/api/admin/rsvps/count", { headers: authHeaders }).then((r) => r.json()),
      fetch("/api/admin/prayers/count", { headers: authHeaders }).then((r) => r.json()),
      fetch("/api/blogs/count", { headers: authHeaders }).then((r) => r.json()),
      fetch("/api/admin/subscribers/count", { headers: authHeaders }).then((r) => r.json()),
    ])

    document.getElementById("rsvpCount").textContent = rsvp.count ?? 0
    document.getElementById("prayerCount").textContent = prayer.count ?? 0
    document.getElementById("blogCount").textContent = blog.count ?? 0
    document.getElementById("subscriberCount").textContent = sub.count ?? 0
  } catch (err) {
    console.error("Stat load error:", err)
    showToast(err.message || "Failed to load dashboard stats", "error")
  }
}

// ============================
// Admin Info (FIXED endpoint)
// ============================
async function fetchAdminInfo() {
  try {
    const res = await fetch("/api/admin/me", { headers: authHeaders })
    const contentType = res.headers.get("content-type")
    if (!res.ok || !contentType.includes("application/json")) {
      throw new Error("Invalid or non-JSON response from /api/admin/me")
    }

    const data = await res.json()

    document.getElementById("adminDisplayName").textContent = `Welcome, ${data.name}`
    document.getElementById("adminEmail").textContent = data.email
    document.getElementById("adminRole").textContent = data.role
    if (data.lastLogin) {
      document.getElementById("lastLoginStat").textContent = new Date(data.lastLogin).toLocaleString()
    }
    // Populate profile form
    document.getElementById("adminName").value = data.name
    document.getElementById("adminEmailInput").value = data.email
  } catch (err) {
    console.error("Fetch admin info error:", err)
    showToast("Failed to load admin profile", "error")
  }
}

// ============================
// Setup Profile Form (NEW)
// ============================
function setupProfileForm() {
  const profileForm = document.getElementById("profileForm")
  if (!profileForm) return

  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault()
    const formData = new FormData(profileForm)
    const data = {
      name: formData.get("adminName"),
      email: formData.get("adminEmail"),
      password: formData.get("adminPassword"),
    }

    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(data),
      })

      const result = await res.json()
      if (res.ok) {
        showToast("Profile updated successfully!", "success")
        fetchAdminInfo() // Refresh admin info
      } else {
        throw new Error(result.error || "Profile update failed")
      }
    } catch (err) {
      showToast(err.message, "error")
    }
  })
}

// ============================
// Sidebar
// ============================
function setupSidebarLinks() {
  document.querySelectorAll(".sidebar a").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()
      const panelId = link.getAttribute("onclick").match(/'(.*?)'/)[1]
      togglePanel(panelId)
    })
  })
}

function bindToggleButtons() {
  document.querySelectorAll(".toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const content = btn.nextElementSibling
      if (content) {
        content.style.display = content.style.display === "block" ? "none" : "block"
      }
    })
  })
}

// ============================
// Loaders
// ============================
function showLoading() {
  const spinner = document.createElement("div")
  spinner.id = "loadingSpinner"
  spinner.style =
    "position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(255,255,255,0.8);z-index:9999;display:flex;justify-content:center;align-items:center;"
  spinner.innerHTML = `<div style="border:6px solid #f3f3f3;border-top:6px solid #3498db;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;"></div>`
  document.body.appendChild(spinner)
}

function hideLoading() {
  const spinner = document.getElementById("loadingSpinner")
  if (spinner) spinner.remove()
}

// ============================
// Dark Mode
// ============================
function setupDarkModeToggle() {
  const toggle = document.createElement("button")
  toggle.id = "darkModeToggle"
  toggle.textContent = "🌓"
  toggle.title = "Toggle Dark Mode"
  toggle.style =
    "position:fixed;top:20px;right:20px;z-index:1000;padding:10px;border:none;border-radius:50%;background:#333;color:white;cursor:pointer;"
  toggle.onclick = () => {
    document.body.classList.toggle("dark-mode")
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"))
  }
  document.body.appendChild(toggle)
}

function applyDarkModeFromStorage() {
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode")
  }
}

// ============================
// Load RSVPs (FIXED)
// ============================
async function loadRSVPs() {
  const listDiv = document.getElementById("rsvpList")
  if (!listDiv) return
  listDiv.innerHTML = "<p>Loading...</p>"
  try {
    const res = await fetch("/api/rsvps", { headers: authHeaders })
    let data
    try {
      data = await res.json()
    } catch {
      throw new Error("Invalid response from /api/rsvps. Is your backend running and returning JSON?")
    }
    if (!res.ok) throw new Error(data.error || "Failed to fetch RSVPs")

    if (!data.rsvps || data.rsvps.length === 0) {
      listDiv.innerHTML = "<p>No RSVPs found.</p>"
      return
    }

    listDiv.innerHTML = data.rsvps
      .map(
        (rsvp) => `
      <div class="rsvp-item" style="padding:10px;border:1px solid #ddd;margin:5px 0;border-radius:5px;">
        <strong>${rsvp.name}</strong> (${rsvp.email || "No email"})
        ${rsvp.event ? ` — Event: ${rsvp.event}` : ""}
        <small style="display:block;color:#666;">
          ${rsvp.createdAt ? new Date(rsvp.createdAt).toLocaleDateString() : ""}
        </small>
      </div>
    `,
      )
      .join("")
  } catch (err) {
    listDiv.innerHTML = `<p style="color:red;">${err.message}</p>`
  }
}

// ============================
// Load Prayers (FIXED)
// ============================
async function loadPrayers() {
  const listDiv = document.getElementById("prayerList")
  if (!listDiv) return
  listDiv.innerHTML = "<p>Loading...</p>"
  try {
    const res = await fetch("/api/prayers", { headers: authHeaders })
    let data
    try {
      data = await res.json()
    } catch {
      throw new Error("Invalid response from /api/prayers. Is your backend running and returning JSON?")
    }
    if (!res.ok) throw new Error(data.error || "Failed to fetch prayers")

    if (!data.prayers || data.prayers.length === 0) {
      listDiv.innerHTML = "<p>No prayer requests found.</p>"
      return
    }

    listDiv.innerHTML = data.prayers
      .map(
        (p) => `
      <div class="prayer-item" style="padding:10px;border:1px solid #ddd;margin:5px 0;border-radius:5px;">
        <strong>${p.name}</strong> ${p.email ? `(${p.email})` : ""}:<br/>
        <em style="color:#555;">${p.message || p.request || "No message"}</em>
        <small style="display:block;color:#666;margin-top:5px;">
          ${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ""}
        </small>
      </div>
    `,
      )
      .join("")
  } catch (err) {
    listDiv.innerHTML = `<p style="color:red;">${err.message}</p>`
  }
}

// ============================
// Load Blogs (FIXED)
// ============================
async function loadBlogs() {
  const listDiv = document.getElementById("blogList")
  if (!listDiv) return
  listDiv.innerHTML = "<p>Loading...</p>"
  try {
    const res = await fetch("/api/blogs", { headers: authHeaders })
    let data
    try {
      data = await res.json()
    } catch {
      throw new Error("Invalid response from /api/blogs. Is your backend running and returning JSON?")
    }
    if (!res.ok) throw new Error(data.error || "Failed to fetch blogs")

    if (!data.blogs || data.blogs.length === 0) {
      listDiv.innerHTML = "<p>No blogs found.</p>"
      return
    }

    listDiv.innerHTML = data.blogs
      .map(
        (blog) => `
      <div class="blog-item" style="padding:10px;border:1px solid #ddd;margin:5px 0;border-radius:5px;">
        <h4 style="margin:0 0 5px 0;">${blog.title || "Untitled"}</h4>
        <p style="color:#555;margin:5px 0;">${(blog.content || "").slice(0, 100)}...</p>
        <small style="color:#666;">By ${blog.author || "Unknown"}</small>
        <small style="display:block;color:#666;">
          ${blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : ""}
        </small>
      </div>
    `,
      )
      .join("")
  } catch (err) {
    listDiv.innerHTML = `<p style="color:red;">${err.message}</p>`
  }
}

// ============================
// Load Subscribers (FIXED)
// ============================
async function loadSubscribers() {
  const listDiv = document.getElementById("subscriberList")
  if (!listDiv) return
  listDiv.innerHTML = "<p>Loading...</p>"
  try {
    const res = await fetch("/api/subscribers", { headers: authHeaders })
    let data
    try {
      data = await res.json()
    } catch {
      throw new Error("Invalid response from /api/subscribers. Is your backend running and returning JSON?")
    }
    if (!res.ok) throw new Error(data.error || "Failed to fetch subscribers")

    if (!data.subscribers || data.subscribers.length === 0) {
      listDiv.innerHTML = "<p>No subscribers found.</p>"
      return
    }

    listDiv.innerHTML = data.subscribers
      .map(
        (sub) => `
      <div class="subscriber-item" style="padding:10px;border:1px solid #ddd;margin:5px 0;border-radius:5px;">
        <strong>${sub.email}</strong>
        <small style="display:block;color:#666;">
          Subscribed: ${sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : "Unknown date"}
        </small>
      </div>
    `,
      )
      .join("")
  } catch (err) {
    listDiv.innerHTML = `<p style="color:red;">${err.message}</p>`
  }
}

// ============================
// Toasts
// ============================
function showToast(message, type = "info") {
  const toast = document.createElement("div")
  toast.className = `toast toast-${type}`
  toast.style = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 5px;
    color: white;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s;
    ${type === "success" ? "background: #4CAF50;" : ""}
    ${type === "error" ? "background: #f44336;" : ""}
    ${type === "info" ? "background: #2196F3;" : ""}
  `
  toast.textContent = message
  document.body.appendChild(toast)
  setTimeout(() => (toast.style.opacity = "1"), 100)
  setTimeout(() => toast.remove(), 4000)
}

// ============================
// Avatar Dropdown
// ============================
const avatarUpload = document.getElementById("avatarUpload")
if (avatarUpload) {
  avatarUpload.addEventListener("change", async function () {
    const file = this.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append("avatar", file)

    try {
      const res = await fetch("/api/admin/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
      let data
      try {
        data = await res.json()
      } catch {
        throw new Error("Invalid response from /api/admin/avatar. Is your backend running and returning JSON?")
      }
      if (res.ok && data.avatarUrl) {
        const avatarEl = document.getElementById("adminAvatar")
        if (avatarEl) avatarEl.src = data.avatarUrl
        showToast("Avatar updated!", "success")
      } else {
        throw new Error(data.error || "Avatar upload failed")
      }
    } catch (err) {
      showToast(err.message, "error")
    }
  })
}

// ============================
// Logout
// ============================
function logoutAdmin() {
  localStorage.removeItem("adminToken")
  window.location.href = "login.html"
}

// ============================
// Media List & Delete
// ============================
async function loadMedia() {
  const mediaListDiv = document.getElementById("mediaList")
  if (!mediaListDiv) return
  mediaListDiv.innerHTML = "<p>Loading...</p>"
  try {
    const res = await fetch("/api/media", { headers: authHeaders })
    let data
    try {
      data = await res.json()
    } catch {
      throw new Error("Invalid response from /api/media. Is your backend running and returning JSON?")
    }
    if (!res.ok) throw new Error(data.error || "Failed to fetch media")

    if (!data.media || !data.media.length) {
      mediaListDiv.innerHTML = "<p>No media uploaded yet.</p>"
      return
    }

    mediaListDiv.innerHTML = data.media
      .map((media) => {
        let preview = ""
        if (media.mimetype.startsWith("image/")) {
          preview = `<img src="/${media.path}" width="120" style="max-height:80px;object-fit:cover;border-radius:6px;" />`
        } else if (media.mimetype.startsWith("video/")) {
          preview = `<video src="/${media.path}" width="120" controls style="max-height:80px;border-radius:6px;"></video>`
        } else if (media.mimetype.startsWith("audio/")) {
          preview = `<audio src="/${media.path}" controls></audio>`
        }
        return `
        <div class="media-item" style="display:flex;align-items:center;gap:10px;padding:10px;border:1px solid #ddd;margin:5px 0;border-radius:5px;">
          ${preview}
          <div style="flex:1;">
            <strong>${media.originalname}</strong><br/>
            <small>(${Math.round(media.size / 1024)} KB, ${media.mimetype})</small>
          </div>
          <div class="action-buttons">
            <a href="/${media.path}" target="_blank" style="padding:5px 10px;background:#007bff;color:white;text-decoration:none;border-radius:3px;margin-right:5px;">View</a>
            <button onclick="deleteMedia('${media._id}')" style="padding:5px 10px;background:#dc3545;color:white;border:none;border-radius:3px;cursor:pointer;">Delete</button>
          </div>
        </div>
      `
      })
      .join("")
  } catch (err) {
    mediaListDiv.innerHTML = `<p style="color:red;">${err.message}</p>`
  }
}

// ============================
// Media Upload Preview & Submit
// ============================
function setupMediaUpload() {
  const form = document.getElementById("mediaUploadForm")
  const input = document.getElementById("mediaFile")
  const preview = document.getElementById("mediaPreview")

  if (!form || !input || !preview) return

  input.addEventListener("change", () => {
    const file = input.files[0]
    preview.innerHTML = ""
    if (!file) return
    const ext = file.name.split(".").pop().toLowerCase()
    const url = URL.createObjectURL(file)

    if (["jpg", "jpeg", "png", "gif"].includes(ext)) {
      preview.innerHTML = `<img src="${url}" width="200" style="margin:10px 0;" />`
    } else if (["mp4", "mov"].includes(ext)) {
      preview.innerHTML = `<video src="${url}" width="300" controls style="margin:10px 0;"></video>`
    } else if (["mp3", "wav"].includes(ext)) {
      preview.innerHTML = `<audio src="${url}" controls style="margin:10px 0;"></audio>`
    } else {
      preview.innerHTML = `<p>No preview available</p>`
    }
  })

  form.addEventListener("submit", async (e) => {
    e.preventDefault()
    const file = input.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/media/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      let data
      try {
        data = await res.json()
      } catch {
        throw new Error("Invalid response from /api/media/upload. Is your backend running and returning JSON?")
      }
      if (!res.ok) throw new Error(data.error || "Upload failed")
      showToast("Media uploaded successfully!", "success")
      form.reset()
      preview.innerHTML = ""
      loadMedia()
    } catch (err) {
      showToast(err.message || "Upload failed", "error")
    }
  })
}

// ============================
// Search Filter
// ============================
function setupSearchFilters() {
  const rsvpSearch = document.getElementById("rsvpSearch")
  const subscriberSearch = document.getElementById("subscriberSearch")

  if (rsvpSearch) {
    rsvpSearch.addEventListener("input", () => {
      const query = rsvpSearch.value.toLowerCase()
      document.querySelectorAll(".rsvp-item").forEach((item) => {
        item.style.display = item.textContent.toLowerCase().includes(query) ? "block" : "none"
      })
    })
  }

  if (subscriberSearch) {
    subscriberSearch.addEventListener("input", () => {
      const query = subscriberSearch.value.toLowerCase()
      document.querySelectorAll(".subscriber-item").forEach((item) => {
        item.style.display = item.textContent.toLowerCase().includes(query) ? "block" : "none"
      })
    })
  }
}

// ============================
// Media Delete
// ============================
async function deleteMedia(id) {
  if (!confirm("Are you sure you want to delete this media file?")) return

  try {
    const res = await fetch(`/api/media/${id}`, {
      method: "DELETE",
      headers: authHeaders,
    })

    let data
    try {
      data = await res.json()
    } catch {
      throw new Error("Invalid response from delete media. Is your backend running and returning JSON?")
    }
    if (res.ok) {
      showToast("Media deleted successfully!", "success")
      loadMedia()
    } else {
      showToast(data.error || "Delete failed", "error")
    }
  } catch (err) {
    showToast("Delete request failed", "error")
  }
}

// ============================
// Expose Functions to HTML
// ============================
window.togglePanel = togglePanel
window.toggleDropdown = toggleDropdown
window.logoutAdmin = logoutAdmin
window.deleteMedia = deleteMedia
