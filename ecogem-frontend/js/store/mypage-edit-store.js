document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Login is required.");
    window.location.href = "../../index.html";
    return;
  }

  // Load existing store info
  try {
    const res = await fetch("http://localhost:8080/api/mypage", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const result = await res.json();
    if (res.ok && result.success) {
      const data = result.data;
      document.getElementById("store-name").value          = data.name;
      document.getElementById("store-address").value       = data.address;
      document.getElementById("store-phone-number").value  = data.storePhone;
      document.getElementById("owner-phone-number").value  = data.ownerPhone;
      document.getElementById("oil-emission-type").value   = formatEmissionType(data.deliveryType);
    } else {
      alert("Failed to load store information.");
    }
  } catch (err) {
    console.error("Failed to fetch store info:", err);
    alert("A server error occurred.");
  }

  // Handle form submission for updates
  const form = document.getElementById("edit-store-form");
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const address   = document.getElementById("store-address").value.trim();
    const storePhone= document.getElementById("store-phone-number").value.trim();
    const ownerPhone= document.getElementById("owner-phone-number").value.trim();
    const emissionText = document.getElementById("oil-emission-type").value;
    const emissionType = parseEmissionType(emissionText);

    if (!address || !storePhone || !ownerPhone || !emissionType) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/mypage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ address, storePhone, ownerPhone, deliveryType: emissionType })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        alert("Information updated successfully.");
        window.location.href = "mypage-store.html";
      } else {
        alert("Update failed: " + result.message);
      }
    } catch (err) {
      console.error("Failed to submit update:", err);
      alert("A server error occurred.");
    }
  });
});

/**
 * Convert displayed emission text to enum code
 */
function parseEmissionType(text) {
  if (text.includes("Small"))  return "SMALL";
  if (text.includes("Medium")) return "MEDIUM";
  if (text.includes("Large"))  return "LARGE";
  if (text.includes("One-time")) return "ONETIME";
  return null;
}

/**
 * Convert enum code to display text
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
