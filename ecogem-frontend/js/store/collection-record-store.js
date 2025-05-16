document.addEventListener("DOMContentLoaded", () => {
  const baseURL    = "http://localhost:8080";
  const startInput = document.getElementById("start-date");
  const endInput   = document.getElementById("end-date");
  const postList   = document.querySelector(".post-list");

  // Retrieve JWT token from localStorage
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Login is required.");
    window.location.href = "../../pages/auth/login.html";
    return;
  }

  // Fetch records on date change or initial load
  startInput.addEventListener("change", fetchRecords);
  endInput.addEventListener("change", fetchRecords);
  fetchRecords();

  /**
   * Fetch collection records from the backend
   */
  async function fetchRecords() {
    // Build query string based on selected dates
    const params = [];
    if (startInput.value) params.push(`start_date=${startInput.value}`);
    if (endInput.value)   params.push(`end_date=${endInput.value}`);
    const qs = params.length ? `?${params.join("&")}` : "";

    const url = `${baseURL}/api/collection-records${qs}`;
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
      console.error("Failed to load collection records:", err);
      alert("An error occurred while loading collection records.");
    }
  }

  /**
   * Group records by date and render them
   */
  function renderRecords(records) {
    // Clear existing records
    postList.querySelectorAll(".date-record").forEach(el => el.remove());

    // Group records by the 'collected_at' date
    const grouped = records.reduce((acc, record) => {
      const key = record.collected_at; // YYYY-MM-DD
      (acc[key] ||= []).push(record);
      return acc;
    }, {});

    // Sort dates descending and render each group
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
          item.innerHTML = `
            <div class="company-name">${record.store_name}</div>
            <div class="collected-by-and-name">
              <div class="collected-by">Collected by:</div>
              <div class="collected-by-name">${record.collected_by}</div>
            </div>
            <div class="post-details">
              <div class="quantity">${record.volume_liter} <small>L<br/>collected</small></div>
              <div class="price">${record.price_per_liter.toLocaleString()} <small>KRW/L</small></div>
              <div class="total"><small>Total</small><br/>${record.total_price.toLocaleString()} <small>KRW</small></div>
            </div>
          `;
          wrapper.appendChild(item);
        });

        postList.appendChild(wrapper);
      });
  }
});
