document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const loginId = document.getElementById("loginId").value.trim();
    const pwd     = document.getElementById("pwd").value.trim();

    // Ensure both fields are filled
    if (!loginId || !pwd) {
      alert("Please enter both username and password.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ loginId, pwd })
      });

      const result = await res.json();

      if (res.ok && result.success) {
        const { token, role, status, user_id } = result.data;

        // Store auth token and user info
        localStorage.setItem("token",   token);
        localStorage.setItem("role",    role);
        localStorage.setItem("status",  status);
        localStorage.setItem("user_id", user_id);

        // Redirect based on completion status and role
        if (status === "INCOMPLETE") {
          if (role === "COMPANY_WORKER") {
            window.location.href = "../pages/company/register-company.html";
          } else if (role === "STORE_OWNER") {
            window.location.href = "../pages/store/register-store.html";
          }
        } else {
          if (role === "COMPANY_WORKER") {
            window.location.href = "../pages/company/board-company.html";
          } else if (role === "STORE_OWNER") {
            window.location.href = "../pages/store/board-store.html";
          }
        }
      } else {
        alert(`Login failed: ${result.message || res.statusText}`);
      }
    } catch (err) {
      console.error("Login request failed:", err);
      alert("A server error occurred.");
    }
  });
});
