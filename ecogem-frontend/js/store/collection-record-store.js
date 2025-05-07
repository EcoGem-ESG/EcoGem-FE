document.addEventListener("DOMContentLoaded", () => {
  const baseURL    = "http://localhost:8080";
  const startInput = document.getElementById("start-date");
  const endInput   = document.getElementById("end-date");
  const postList   = document.querySelector(".post-list");

  // ▶ Hardcoded for testing (replace with real auth tokens/login info)
  const userId   = 2;      // Store owner user ID
  const userRole = "STORE_OWNER";

  // 1) Fetch records on date change or initial load
  startInput.addEventListener("change", fetchRecords);
  endInput.addEventListener("change", fetchRecords);
  fetchRecords();

  // —— Fetch collection records from backend
  async function fetchRecords() {
    let url = `${baseURL}/api/collection-records?user_id=${userId}&role=${userRole}`;
    if (startInput.value && endInput.value) {
      url += `&start_date=${startInput.value}&end_date=${endInput.value}`;
    }

    try {
      console.log("▶ GET", url);
      const res  = await fetch(url, { headers: { "Content-Type": "application/json" } });
      const body = await res.json();
      console.log("👈 Response records:", body.records);
      renderRecords(body.records);
    } catch (err) {
      console.error(err);
      alert("An error occurred while loading collection records.");
    }
  }

  // —— Group by date and render
  function renderRecords(records) {
    // (1) Remove existing demo/previous blocks
    postList.querySelectorAll(".date-record").forEach(el => el.remove());

    // (2) Group records by date (key: "YYYY-MM-DD")
    const grouped = records.reduce((acc, r) => {
      const key = r.collected_at;
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    }, {});

    // (3) Sort dates descending and render each group
    Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a))
      .forEach(dateKey => {
        // Date block
        const wrapper = document.createElement("div");
        wrapper.className = "date-record";
        wrapper.innerHTML = `
          <div class="date">${dateKey.replace(/-/g, ".")}</div>
          <div class="divider"></div>
        `;

        // Render each record item for this date
        grouped[dateKey].forEach(r => {
          const item = document.createElement("div");
          item.className = "record-item";

          // Use company_name if available, otherwise fall back to store_name
          const companyName = r.company_name || r.store_name;

          item.innerHTML = `
            <div class="post-header">
              <div class="company-name">${companyName}</div>
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

        postList.appendChild(wrapper);
      });
  }
});