document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const loginId    = document.querySelector('input[placeholder="Enter username"]').value.trim();
    const pwd        = document.querySelector('input[placeholder="Enter password"]').value.trim();
    const confirmPwd = document.querySelector('input[placeholder="Confirm password"]').value.trim();
    const email      = document.querySelector('input[placeholder="Enter email"]').value.trim();

    // Determine selected role button
    const roleButtons = document.querySelectorAll(".role-buttons-inline button");
    let role = null;
    roleButtons.forEach((btn) => {
      if (btn.classList.contains("selected")) {
        role = btn.textContent.includes("Store") ? "STORE_OWNER" : "COMPANY_WORKER";
      }
    });

    // Validate inputs
    if (!loginId || !pwd || !confirmPwd || !email || !role) {
      alert("Please fill in all fields.");
      return;
    }
    if (pwd !== confirmPwd) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/auth/signup", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ loginId, pwd, email, role })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        alert("Signup successful! Redirecting to login page.");
        window.location.href = "index.html";
      } else {
        alert(`Signup failed: ${result.message || res.statusText}`);
      }
    } catch (err) {
      console.error("Error during signup:", err);
      alert("A server error occurred.");
    }
  });

  // Toggle selection for role buttons
  document.querySelectorAll(".role-buttons-inline button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".role-buttons-inline button").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });
});