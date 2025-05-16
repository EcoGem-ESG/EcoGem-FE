document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.querySelector('input[placeholder="Enter company name"]').value.trim();
    const address = document.querySelector('input[placeholder="Enter address"]').value.trim();
    const managerName = document.querySelector('input[placeholder="Enter contact name"]').value.trim();
    const companyPhone = document.querySelector('input[placeholder="Enter phone number"]').value.trim();

    // Collect selected waste types
    const selectedWasteTypes = [];
    document.querySelectorAll(".waste-buttons button.selected").forEach(btn => {
      selectedWasteTypes.push(btn.textContent.trim());
    });

    // Validate required fields
    if (!name || !address || !managerName || !companyPhone || selectedWasteTypes.length === 0) {
      alert("Please fill in all required fields.");
      return;
    }

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");

    try {
      const res = await fetch(`http://localhost:8080/api/companies/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          address,
          managerName,
          companyPhone,
          wasteTypes: selectedWasteTypes
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        alert("Company registration completed!");
        // Update front-end status
        localStorage.setItem("status", "COMPLETE");
        // Redirect to My Page
        window.location.href = "mypage-company.html";
      } else {
        alert(`Registration failed: ${result.message || res.statusText}`);
      }
    } catch (err) {
      console.error("Company registration failed:", err);
      alert("A server error occurred.");
    }
  });

  // Toggle selection for waste type buttons
  document.querySelectorAll(".waste-buttons button").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("selected");
    });
  });
});