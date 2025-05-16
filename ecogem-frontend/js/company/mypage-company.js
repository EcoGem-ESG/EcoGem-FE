document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Login is required.");
    window.location.href = "../../index.html";
    return;
  }

  try {
    const res = await fetch("http://localhost:8080/api/mypage", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const result = await res.json();

    if (res.ok && result.success) {
      const data = result.data;

      // Company Name
      document.querySelector(".company-name").textContent = data.name;

      // Info items (0: Address, 1: Manager, 2: Waste Types, 3: Phone Number)
      const items = document.querySelectorAll(".info-item");
      items[0].textContent = data.address;
      items[1].textContent = data.managerName;
      items[2].textContent = data.wasteTypes.join(", ");
      items[3].textContent = data.companyPhone;
    } else {
      alert("Failed to load company information.");
    }
  } catch (err) {
    console.error("Failed to fetch My Page data:", err);
    alert("A server error occurred.");
  }
});