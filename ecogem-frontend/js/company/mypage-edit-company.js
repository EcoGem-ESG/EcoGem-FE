document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Login is required.");
    window.location.href = "../../index.html";
    return;
  }

  // Load existing company info
  try {
    const res = await fetch("http://localhost:8080/api/mypage", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const result = await res.json();

    if (res.ok && result.success) {
      const data = result.data;
      document.getElementById("company-name").value   = data.name;
      document.getElementById("company-address").value = data.address;
      document.getElementById("contact-name").value    = data.managerName;
      document.getElementById("waste-types").value     = data.wasteTypes.join(", ");
      document.getElementById("phone-number").value    = data.companyPhone;
    } else {
      alert("Failed to load company information.");
    }
  } catch (err) {
    console.error("Failed to fetch company info:", err);
    alert("A server error occurred.");
  }

  // Handle form submission for updates
  const form = document.getElementById("edit-company-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const address     = document.getElementById("company-address").value;
    const managerName = document.getElementById("contact-name").value;
    const companyPhone= document.getElementById("phone-number").value;
    const wasteTypes  = document.getElementById("waste-types").value
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch("http://localhost:8080/api/mypage", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ address, managerName, companyPhone, wasteTypes })
      });
      const result = await res.json();

      if (res.ok && result.success) {
        alert("Information has been updated.");
        window.location.href = "mypage-company.html";
      } else {
        alert("Update failed: " + result.message);
      }
    } catch (err) {
      console.error("Failed to submit update:", err);
      alert("A server error occurred.");
    }
  });
});