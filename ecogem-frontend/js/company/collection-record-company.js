document.addEventListener("DOMContentLoaded", () => {
    const baseURL = "http://localhost:8080";
    const startInput = document.getElementById("start-date");
    const endInput = document.getElementById("end-date");
    const postList = document.querySelector(".post-list");
    const addRecordBtn = document.querySelector(".add-record-btn");
    const popup = document.getElementById("edit-popup");
    const closeBtn = document.querySelector(".popup-close");
    const editForm = document.getElementById("edit-form");
    const qtyInput = document.getElementById("edit-quantity");
    const priceInput = document.getElementById("edit-price");
    const totalInput = document.getElementById("edit-total");

    // ▶ Hardcoded for testing (remove after auth integration)
    const userId = 1;
    const userRole = "COMPANY_WORKER";

    // 1) Fetch records on date change or initial load
    startInput.addEventListener("change", fetchRecords);
    endInput.addEventListener("change", fetchRecords);
    fetchRecords();

    // —— Fetch data from backend
    async function fetchRecords() {
        let url = `${baseURL}/api/collection-records?user_id=${userId}&role=${userRole}`;
        if (startInput.value && endInput.value) {
            url += `&start_date=${startInput.value}&end_date=${endInput.value}`;
        }

        try {
            console.log("▶ GET", url);
            const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
            const body = await res.json();
            console.log("👈 Response", body.records);
            renderRecords(body.records);
        } catch (err) {
            console.error(err);
            alert("An error occurred while loading data.");
        }
    }

    // —— Group by date and render
    function renderRecords(records) {
        // 1) Remove existing date-record blocks
        postList.querySelectorAll(".date-record").forEach(el => el.remove());

        // 2) Group by date
        const grouped = records.reduce((acc, r) => {
            const key = r.collected_at; // expected format YYYY-MM-DD
            if (!acc[key]) acc[key] = [];
            acc[key].push(r);
            return acc;
        }, {});

        // 3) Sort dates descending and render each group
        Object.keys(grouped)
            .sort((a, b) => b.localeCompare(a))
            .forEach(dateKey => {
                // Create date-record container
                const wrapper = document.createElement("div");
                wrapper.className = "date-record";
                wrapper.innerHTML = `
            <div class="date">${dateKey.replace(/-/g, ".")}</div>
            <div class="divider"></div>
          `;

                // Append record items for that date
                grouped[dateKey].forEach(r => {
                    const item = document.createElement("div");
                    item.className = "record-item";

                    item.dataset.id = r.record_id;

                    item.innerHTML = `
              <div class="store-name-and-menu">
                <div class="store-name">${r.store_name}</div>
                <button class="menu-btn">⋮</button>
                <div class="menu-options">
                  <button class="edit-btn">Edit</button>
                  <button class="delete-btn">Delete</button>
                </div>
              </div>
              <div class="collected-by-and-name">
                <div class="collected-by">Collected by: </div>
                <div class="collected-by-name">${r.collected_by}</div>
              </div>
              <div class="post-details">
                <div class="quantity">${r.volume_liter} <small>L<br>collected</small></div>
                <div class="price">${r.price_per_liter.toLocaleString()} <br><small>KRW/L</small></div>
                <div class="total"><small>Total</small> <br> ${r.total_price.toLocaleString()} <small>KRW/L</small></div>
              </div>
            `;

                    wrapper.appendChild(item);
                });

                // Insert before the Add Record button
                postList.insertBefore(wrapper, addRecordBtn);
            });

        // 4) Bind menu events
        bindMenuEvents();
    }

    // —— Menu toggle, edit, delete events
    function bindMenuEvents() {
        // Toggle options menu
        document.querySelectorAll(".menu-btn").forEach(btn => {
            btn.addEventListener("click", e => {
                e.stopPropagation();
                const opts = btn.closest(".record-item").querySelector(".menu-options");
                opts.style.display = opts.style.display === "block" ? "none" : "block";
            });
        });

        // Edit button
        document.querySelectorAll(".edit-btn").forEach(btn => {
            btn.addEventListener("click", e => {
                e.stopPropagation();
                openEditPopup(btn.closest(".record-item"));
            });
        });

        // Delete button
        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.addEventListener("click", e => {
                e.stopPropagation();
                deleteRecord(btn.closest(".record-item").dataset.id);
            });
        });

        // Close menus on outside click
        document.addEventListener("click", () => {
            document.querySelectorAll(".menu-options").forEach(o => o.style.display = "none");
        });
    }

    // ▶ Auto-calculate total when quantity or price changes
    function updateTotal() {
        const qty = parseFloat(qtyInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        totalInput.value = qty * price;
    }

    qtyInput.addEventListener("input", updateTotal);
    priceInput.addEventListener("input", updateTotal);

    // —— Open edit popup
    function openEditPopup(item) {
        const id = item.dataset.id;
        const date = item.closest(".date-record").querySelector(".date").textContent.replace(/\./g, "-");
        const store = item.querySelector(".store-name").textContent;
        const name = item.querySelector(".collected-by-name").textContent;
        const qty = item.querySelector(".quantity").textContent.match(/\d+(\.\d+)?/)[0];
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

    // —— Close popup
    closeBtn.addEventListener("click", () => {
        popup.style.display = "none";
    });

    // —— Update API
    editForm.addEventListener("submit", async e => {
        e.preventDefault();
        const id = editForm.dataset.id;
        const payload = {
            collected_at: editForm["edit-date"].value,
            collected_by: editForm["edit-collected-by"].value,
            volume_liter: +editForm["edit-quantity"].value,
            price_per_liter: +editForm["edit-price"].value,
            total_price: +editForm["edit-total"].value,
        };

        try {
            await fetch(
                `${baseURL}/api/collection-records/${id}` +
                `?user_id=${userId}&role=${userRole}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                }
            );
            popup.style.display = "none";
            fetchRecords();
        } catch (err) {
            console.error(err);
            alert("An error occurred while updating the record.");
        }
    });

    // —— Delete API
    async function deleteRecord(id) {
        if (!confirm("Are you sure you want to delete this record?")) return;
        try {
            await fetch(
                `${baseURL}/api/collection-records/${id}` +
                `?user_id=${userId}&role=${userRole}`,
                { method: "DELETE" }
            );
            fetchRecords();
        } catch (err) {
            console.error(err);
            alert("An error occurred while deleting the record.");
        }
    }

    // —— Navigate to create page
    addRecordBtn.addEventListener("click", () => {
        window.location.href = "collection-record-create.html";
    });
});