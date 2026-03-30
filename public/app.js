const API_BASE = "";

function getToken() {
  return localStorage.getItem("token");
}

function getUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

function setAuth(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function authHeaders() {
  const token = getToken();
  return {
    Authorization: `Bearer ${token}`
  };
}

function requireAuth(allowedRoles = []) {
  const token = getToken();
  const user = getUser();

  if (!token || !user) {
    window.location.href = "/login.html";
    return null;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Role-based redirect
    window.location.href = user.role === "admin" ? "/admin.html" : "/dashboard.html";
    return null;
  }

  return user;
}

function logout() {
  clearAuth();
  window.location.href = "/login.html";
}
