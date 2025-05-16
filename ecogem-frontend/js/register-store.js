document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Collect input values
    const name        = document.getElementById("storeName").value.trim();
    const address     = document.getElementById("address").value.trim();
    const storePhone  = document.getElementById("storePhone").value.trim();
    const ownerPhone  = document.getElementById("ownerPhone").value.trim();

    // Get selected emission type button
    const emissionBtn = document.querySelector(".waste-buttons button.selected");
    const emissionType = emissionBtn ? emissionBtn.textContent.trim() : null;

    // Validate required fields
    if (!name || !address || !storePhone || !ownerPhone || !emissionType) {
      alert("Please fill in all required fields.");
      return;
    }

    // Retrieve auth token and user ID
    const token  = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");

    try {
      const res = await fetch(`http://localhost:8080/api/stores/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name, address, storePhone, ownerPhone, emissionType })
      });

      const result = await res.json();

      if (res.ok && result.success) {
        alert("Store registration completed!");
        // Update front-end status
        localStorage.setItem("status", "COMPLETE");
        // Redirect to home
        window.location.href = "home.html";
      } else {
        alert(`Registration failed: ${result.message || res.statusText}`);
      }
    } catch (err) {
      console.error("Error during registration:", err);
      alert("A server communication error occurred.");
    }
  });

  // Emission type button selection toggle
  document.querySelectorAll(".waste-buttons button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".waste-buttons button").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });
});