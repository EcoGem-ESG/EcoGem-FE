document.addEventListener("DOMContentLoaded", () => {
  const baseURL      = "http://localhost:8080";
  const token        = localStorage.getItem("token");
  if (!token) {
    alert("Login is required.");
    return;
  }

  const startInput    = document.getElementById("start-date");
  const endInput      = document.getElementById("end-date");
  const postList      = document.querySelector(".post-list");
  const addRecordBtn  = document.querySelector(".add-record-btn");
  const popup         = document.getElementById("edit-popup");
  const closeBtn      = document.querySelector(".popup-close");
  const editForm      = document.getElementById("edit-form");
  const qtyInput      = document.getElementById("edit-quantity");
  const priceInput    = document.getElementById("edit-price");
  const totalInput    = document.getElementById("edit-total");

  // Fetch records when date range changes or on initial load
  startInput.addEventListener("change", fetchRecords);
  endInput.addEventListener("change", fetchRecords);
  fetchRecords();

  async function fetchRecords() {
    let url = `${baseURL}/api/collection-records`;
    const params = [];
    if (startInput.value) params.push(`start_date=${startInput.value}`);
    if (endInput.value)   params.push(`end_date=${endInput.value}`);
    if (params.length)    url += `?${params.join("&")}`;

    try {
      console.log("GET", url);
      const res = await fetch(url, {
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(res.statusText);
      const body = await res.json();
      renderRecords(body.records || []);
    } catch (err) {
      console.error("Failed to fetch collection records:", err);
      alert("An error occurred while loading data.");
    }
  }

  // Group and render collection records by date
  function renderRecords(records) {
    postList.querySelectorAll(".date-record").forEach(el => el.remove());

    // Group records by 'collected_at' date (YYYY-MM-DD)
    const grouped = records.reduce((acc, record) => {
      const key = record.collected_at;
      (acc[key] = acc[key] || []).push(record);
      return acc;
    }, {});

    // Sort dates descending and render
    Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a))
      .forEach(dateKey => {
        const wrapper = document.createElement("div");
        wrapper.className = "date-record";
        wrapper.innerHTML = `
          <div class="date">${dateKey.replace(/-/g, ".")}</div>
          <div class="divider"></div>
        `;

        grouped[dateKey].forEach(record => {
          const item = document.createElement("div");
          item.className = "record-item";
          item.dataset.id = record.record_id;
          item.innerHTML = `
            <div class="store-name-and-menu">
              <div class="store-name">${record.store_name}</div>
              <button class="menu-btn">⋮</button>
              <div class="menu-options">
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
              </div>
            </div>
            <div class="collected-by-and-name">
              <div class="collected-by">Collected by:</div>
              <div class="collected-by-name">${record.collected_by}</div>
            </div>
            <div class="post-details">
              <div class="quantity">${record.volume_liter} <small>L collected</small></div>
              <div class="price">${record.price_per_liter.toLocaleString()} <small>KRW/L</small></div>
              <div class="total"><small>Total</small> <br> ${record.total_price.toLocaleString()} <small>KRW</small></div>
            </div>
          `;
          wrapper.appendChild(item);
        });

        // Insert the date group before the 'Add Record' button
        postList.insertBefore(wrapper, addRecordBtn);
      });

    bindMenuEvents();
  }

  // Bind edit/delete menu events
  function bindMenuEvents() {
    // Toggle menu options
    document.querySelectorAll(".menu-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const options = btn.closest(".record-item").querySelector(".menu-options");
        options.style.display = options.style.display === "block" ? "none" : "block";
      });
    });

    // Edit record
    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        openEditPopup(btn.closest(".record-item"));
      });
    });

    // Delete record
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async e => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this record?")) return;
        const id = btn.closest(".record-item").dataset.id;
        try {
          await fetch(`${baseURL}/api/collection-records/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });
          fetchRecords();
        } catch (err) {
          console.error("Failed to delete record:", err);
          alert("An error occurred while deleting the record.");
        }
      });
    });

    // Close menus on outside click
    document.addEventListener("click", () => {
      document.querySelectorAll(".menu-options").forEach(o => o.style.display = "none");
    });
  }

  // Auto-update total when quantity or price changes
  function updateTotal() {
    const qty   = parseFloat(qtyInput.value) || 0;
    const price = parseFloat(priceInput.value) || 0;
    totalInput.value = qty * price;
  }
  qtyInput.addEventListener("input", updateTotal);
  priceInput.addEventListener("input", updateTotal);

  // Open the edit popup and populate fields
  function openEditPopup(item) {
    const id    = item.dataset.id;
    const date  = item.closest(".date-record").querySelector(".date").textContent.replace(/\./g, "-");
    const store = item.querySelector(".store-name").textContent;
    const name  = item.querySelector(".collected-by-name").textContent;
    const qty   = item.querySelector(".quantity").textContent.match(/\d+(\.\d+)?/)[0];
    const price = item.querySelector(".price").textContent.replace(/[^0-9]/g, "");
    const total = item.querySelector(".total").textContent.replace(/[^0-9]/g, "");

    editForm.dataset.id = id;
    editForm["edit-date"].value = date;
    editForm["edit-store"].value = store;
    editForm["edit-collected-by"].value = name;
    editForm["edit-quantity"].value = qty;
    editForm["edit-price"].value = price;
    editForm["edit-total"].value = total;

    popup.style.display = "flex";
  }

  // Close the popup
  closeBtn.addEventListener("click", () => { popup.style.display = "none"; });

  // Handle form submission for edit
  editForm.addEventListener("submit", async e => {
    e.preventDefault();
    const id = editForm.dataset.id;
    const payload = {
      collected_at:    editForm["edit-date"].value,
      collected_by:    editForm["edit-collected-by"].value,
      volume_liter:    +editForm["edit-quantity"].value,
      price_per_liter: +editForm["edit-price"].value,
      total_price:     +editForm["edit-total"].value
    };
    try {
      await fetch(`${baseURL}/api/collection-records/${id}`, {
        method:  "PATCH",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`
        },
        body:    JSON.stringify(payload)
      });
      popup.style.display = "none";
      fetchRecords();
    } catch (err) {
      console.error("Failed to update record:", err);
      alert("An error occurred while updating the record.");
    }
  });

  // Navigate to create record page
  addRecordBtn.addEventListener("click", () => {
    window.location.href = "collection-record-create.html";
  });
});
