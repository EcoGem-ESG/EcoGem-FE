document.addEventListener("DOMContentLoaded", () => {
  const baseURL     = "http://localhost:8080";
  const submitBtn   = document.querySelector(".submit-btn");
  const storeNameEl = document.getElementById("store-name");
  const addressEl   = document.getElementById("store-location");
  const phoneEl     = document.getElementById("store-phone");
  const ownerEl     = document.getElementById("store-owner-phone");

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Login is required.");
    return;
  }

  submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const storeName  = storeNameEl.value.trim();
    const address    = addressEl.value.trim();
    const storePhone = phoneEl.value.trim();
    const ownerPhone = ownerEl.value.trim();

    if (!storeName) {
      alert("Store name is required.");
      storeNameEl.focus();
      return;
    }

    const payload = {
      store_name:  storeName,
      address:     address,
      store_phone: storePhone,
      owner_phone: ownerPhone
    };

    const url = `${baseURL}/api/contracts/stores`;

    try {
      console.log("▶ POST", url, payload);
      const res = await fetch(url, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`
        },
        body:    JSON.stringify(payload)
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`${res.status} ${res.statusText}: ${errText}`);
      }
      alert("Store successfully added to your contract list.");
      window.location.href = "store-list.html";
    } catch (err) {
      console.error("Failed to add store:", err);
      alert("An error occurred while adding the store.");
    }
  });
});
