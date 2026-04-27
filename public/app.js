function getUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

function goToDashboard() {
  const user = getUser();

  if (!user) {
    window.location.href = "/login.html";
    return;
  }

  if (user.role === "admin") {
    window.location.href = "/admin.html";
  } 
  else if (user.role === "organization") {
    window.location.href = "/org.html";   // 🔥 NEW
  } 
  else {
    window.location.href = "/dashboard.html";
  }
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "/login.html";
}

/** Hide Submit Report for admins (matches a[href='/report.html']) */
function setupSidebar() {
  const user = getUser();

  if (user?.role === "admin" || user?.role === "organization") {
    const link = document.querySelector("a[href='/report.html']");
    if (link) link.style.display = "none";
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupSidebar);
} else {
  setupSidebar();
}
