document.addEventListener("DOMContentLoaded", () => {
  const baseURL    = "http://localhost:8080";
  const startInput = document.getElementById("start-date");
  const endInput   = document.getElementById("end-date");
  const postList   = document.querySelector(".post-list");

  // JWT 토큰 가져오기
  const token = localStorage.getItem("token");
  if (!token) {
    alert("로그인이 필요합니다.");
    location.href = "../../pages/auth/login.html";
    return;
  }

  // 1) 날짜 변경 시 & 초기 로드 때 fetchRecords 호출
  startInput.addEventListener("change", fetchRecords);
  endInput.addEventListener("change", fetchRecords);
  fetchRecords();

  // —— 백엔드에서 수거 기록을 가져오는 함수
  async function fetchRecords() {
    // 쿼리스트링 build
    const params = [];
    if (startInput.value) params.push(`start_date=${startInput.value}`);
    if (endInput.value)   params.push(`end_date=${endInput.value}`);
    const qs = params.length ? `?${params.join("&")}` : "";

    const url = `${baseURL}/api/collection-records${qs}`;
    try {
      console.log("▶ GET", url);
      const res  = await fetch(url, {
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(res.statusText);
      const body = await res.json();
      renderRecords(body.records || []);
    } catch (err) {
      console.error(err);
      alert("An error occurred while loading collection records.");
    }
  }

  // —— 날짜별로 묶어서 화면에 뿌려주는 함수
  function renderRecords(records) {
    // (1) 기존 것을 모두 지우고
    postList.querySelectorAll(".date-record").forEach(el => el.remove());

    // (2) 날짜별 그룹핑
    const grouped = records.reduce((acc, r) => {
      const key = r.collected_at; // YYYY-MM-DD
      (acc[key] ||= []).push(r);
      return acc;
    }, {});

    // (3) 내림차순 정렬 후 렌더
    Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a))
      .forEach(dateKey => {
        const wrapper = document.createElement("div");
        wrapper.className = "date-record";
        wrapper.innerHTML = `
          <div class="date">${dateKey.replace(/-/g, ".")}</div>
          <div class="divider"></div>
        `;

        grouped[dateKey].forEach(r => {
          const item = document.createElement("div");
          item.className = "record-item";

          item.innerHTML = `
            <div class="company-name">${r.store_name}</div>
            <div class="collected-by-and-name">
              <div class="collected-by">Collected by:</div>
              <div class="collected-by-name">${r.collected_by}</div>
            </div>
            <div class="post-details">
              <div class="quantity">${r.volume_liter} <small>L<br/>collected</small></div>
              <div class="price">${r.price_per_liter.toLocaleString()} <br><small>KRW/L</small></div>
              <div class="total"><small>Total</small><br/>${r.total_price.toLocaleString()} <small>KRW</small></div>
            </div>
          `;
          wrapper.appendChild(item);
        });

        postList.appendChild(wrapper);
      });
  }
});
