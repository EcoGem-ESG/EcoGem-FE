document.addEventListener("DOMContentLoaded", () => {
  const baseURL     = "http://localhost:8080";
  const scrollArea  = document.querySelector(".scroll-area");
  const searchInput = document.querySelector(".search-input");
  const searchBtn   = document.querySelector(".search-icon");

  // Assume JWT token is stored in localStorage upon login
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Login is required.");
    return;
  }

  // Initial load and search trigger (button click or Enter key)
  fetchStores();
  searchBtn.addEventListener("click", fetchStores);
  searchInput.addEventListener("keydown", e => {
    if (e.key === "Enter") fetchStores();
  });

  /**
   * 1) Fetch list of contracted stores
   */
  async function fetchStores() {
    let url = `${baseURL}/api/contracts/stores`;
    const keyword = searchInput.value.trim();
    if (keyword) {
      url += `?search=${encodeURIComponent(keyword)}`;
    }

    try {
      console.log("GET", url);
      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type":  "application/json"
        }
      });
      if (!res.ok) throw new Error(res.statusText);
      const body = await res.json();
      renderStores(body.data || []);
    } catch (err) {
      console.error("Failed to load store list:", err);
      alert("An error occurred while loading the store list.");
    }
  }

  /**
   * 2) Render store cards
   */
  function renderStores(stores) {
    // Remove existing cards
    scrollArea.querySelectorAll(".store-card").forEach(el => el.remove());

    stores.forEach(s => {
      const card = document.createElement("div");
      card.className = "store-card";
      card.dataset.id = s.store_id;

      card.innerHTML = `
        <div class="store-header">
          <div class="store-name">${s.store_name}</div>
          <button class="delete-btn">🗑️</button>
        </div>
        <div class="store-info">
          Address: ${s.address || ""}<br>
          Store Phone: ${s.store_phone || ""}<br>
          Owner Phone: ${s.owner_phone || ""}
        </div>
      `;
      scrollArea.appendChild(card);
    });

    bindDeleteEvents();
  }

  /**
   * 3) Bind delete button events
   */
  function bindDeleteEvents() {
    scrollArea.querySelectorAll(".store-card .delete-btn")
      .forEach(btn => btn.addEventListener("click", async e => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to remove this store from the contract list?")) return;

        const card    = btn.closest(".store-card");
        const storeId = card.dataset.id;
        const url     = `${baseURL}/api/contracts/stores/${storeId}`;

        try {
          console.log("DELETE", url);
          const res = await fetch(url, {
            method:  "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!res.ok) throw new Error(res.statusText);

          // Remove card on successful deletion
          card.remove();
        } catch (err) {
          console.error("Failed to delete store:", err);
          alert("An error occurred while deleting the store.");
        }
      }));
  }
});
