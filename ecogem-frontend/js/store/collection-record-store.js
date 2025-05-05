document.addEventListener("DOMContentLoaded", () => {
    const baseURL      = "http://localhost:8080";
    const startInput   = document.getElementById("start-date");
    const endInput     = document.getElementById("end-date");
    const postList     = document.querySelector(".post-list");
  
    // ▶ 테스트용 하드코딩 (인증 연동 시 실제 토큰/로그인 정보로 대체)
    const userId   = 2;                        // 가게 소유자 유저 ID
    const userRole = "STORE_OWNER";
  
    // 1) 날짜 변경 또는 초기 로드 시 조회
    startInput.addEventListener("change", fetchRecords);
    endInput.addEventListener("change", fetchRecords);
    fetchRecords();
  
    // —— 백엔드에서 수거기록 받아오기
    async function fetchRecords() {
      let url = `${baseURL}/api/collection-records?user_id=${userId}&role=${userRole}`;
      if (startInput.value && endInput.value) {
        url += `&start_date=${startInput.value}&end_date=${endInput.value}`;
      }
  
      try {
        console.log("▶ GET", url);
        const res  = await fetch(url, { headers: { "Content-Type": "application/json" } });
        const body = await res.json();
        console.log("👈 응답 records:", body.records);
        renderRecords(body.records);
      } catch (err) {
        console.error(err);
        alert("수거기록을 불러오는 중 오류가 발생했습니다.");
      }
    }
  
    // —— 같은 날짜끼리 묶어서 화면에 렌더링
    function renderRecords(records) {
      // (1) 기존에 있던 데모용/이전 렌더링 블록 제거
      postList.querySelectorAll(".date-record").forEach(el => el.remove());
  
      // (2) 날짜별 그룹핑 (키: "YYYY-MM-DD")
      const grouped = records.reduce((acc, r) => {
        const key = r.collected_at;
        if (!acc[key]) acc[key] = [];
        acc[key].push(r);
        return acc;
      }, {});
  
      // (3) 날짜 내림차순 정렬 후 렌더
      Object.keys(grouped)
        .sort((a, b) => b.localeCompare(a))
        .forEach(dateKey => {
          // 날짜 블록
          const wrapper = document.createElement("div");
          wrapper.className = "date-record";
          wrapper.innerHTML = `
            <div class="date">${dateKey.replace(/-/g, ".")}</div>
            <div class="divider"></div>
          `;
  
          // 해당 날짜의 각 수거기록 아이템
          grouped[dateKey].forEach(r => {
            const item = document.createElement("div");
            item.className = "record-item";
  
            // companyName이 DTO에 없다면 r.store_name 로 대체
            const companyName = r.company_name || r.store_name;
  
            item.innerHTML = `
              <div class="post-header">
                <div class="company-name">${companyName}</div>
              </div>
              <div class="post-details">
                <div class="quantity">${r.volume_liter}L 수거</div>
                <div class="price">${r.price_per_liter.toLocaleString()}원/L</div>
                <div class="total">총 ${r.total_price.toLocaleString()}원</div>
              </div>
            `;
            wrapper.appendChild(item);
          });
  
          postList.appendChild(wrapper);
        });
    }
  });
  