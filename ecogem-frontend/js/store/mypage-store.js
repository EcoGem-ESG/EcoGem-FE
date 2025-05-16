document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Login is required.");
    window.location.href = "../../index.html";
    return;
  }

  try {
    const res = await fetch("http://localhost:8080/api/mypage", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const result = await res.json();

    if (res.ok && result.success) {
      const data = result.data;

      // Populate HTML elements with values
      document.querySelector(".store-name").textContent = data.name;
      const items = document.querySelectorAll(".info-item");
      items[0].textContent = data.address;
      items[1].textContent = data.storePhone;
      items[2].textContent = data.ownerPhone;
      items[3].textContent = formatEmissionType(data.deliveryType);
    } else {
      alert("Failed to load My Page information.");
    }
  } catch (err) {
    console.error("Failed to fetch My Page data:", err);
    alert("A server error occurred.");
  }
});

/**
 * Convert emission enum code to display text
 */
function formatEmissionType(type) {
  switch (type) {
    case "SMALL":   return "Small Emission (1–5L/week)";
    case "MEDIUM":  return "Medium Emission (6–20L/week)";
    case "LARGE":   return "Large Emission (20L+/week)";
    case "ONETIME": return "One-time Emission";
    default:         return type;
  }
}