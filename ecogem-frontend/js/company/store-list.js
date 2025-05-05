document.addEventListener("DOMContentLoaded", () => {
    const baseURL     = "http://localhost:8080";
    const scrollArea  = document.querySelector(".scroll-area");
    const searchInput = document.querySelector(".search-input");
    const searchBtn   = document.querySelector(".search-icon");
    // '＋ 가게 추가'는 a[href] 태그 그대로 두면 됩니다
  
    // ▶ 테스트용 하드코딩 (인증 연동 후 실제 userId/userRole 로 교체)
    const userId   = 1;
    const userRole = "COMPANY_WORKER";
  
    // 초기 로드 & 검색 시 호출
    fetchStores();
    searchBtn.addEventListener("click", fetchStores);
    searchInput.addEventListener("keydown", e => {
      if (e.key === "Enter") fetchStores();
    });
  
    /** 1) 백엔드에서 계약된 가게 리스트 가져오기 */
    async function fetchStores() {
      let url = `${baseURL}/api/contracts/stores?user_id=${userId}&role=${userRole}`;
      const kw = searchInput.value.trim();
      if (kw) {
        url += `&search=${encodeURIComponent(kw)}`;
      }
  
      try {
        console.log("▶ GET", url);
        const res  = await fetch(url, {
          headers: { "Content-Type": "application/json" }
        });
        if (!res.ok) throw new Error(res.statusText);
        const body = await res.json();
        // 응답 JSON: { success, code, message, data: [ {store_id,store_name,address,...}, ... ] }
        renderStores(body.data || []);
      } catch (err) {
        console.error(err);
        alert("가게 리스트를 불러오는 중 오류가 발생했습니다.");
      }
    }
  
    /** 2) 화면에 가게 카드 렌더링 */
    function renderStores(stores) {
      // 기존 카드 제거
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
            위치: ${s.address || ""}<br>
            가게 전화번호: ${s.store_phone || ""}<br>
            대표자 전화번호: ${s.owner_phone || ""}
          </div>
        `;
        scrollArea.appendChild(card);
      });
  
      bindDeleteEvents();
    }
  
    /** 3) '🗑️' 버튼 이벤트 바인딩 */
    function bindDeleteEvents() {
      scrollArea.querySelectorAll(".store-card .delete-btn")
        .forEach(btn => btn.addEventListener("click", async e => {
          e.stopPropagation();
          if (!confirm("정말 이 가게를 계약한 가게 리스트에서 삭제하시겠습니까?")) return;
  
          const card    = btn.closest(".store-card");
          const storeId = card.dataset.id;
          const url     = `${baseURL}/api/contracts/stores/${storeId}` +
                          `?user_id=${userId}&role=${userRole}`;
  
          try {
            console.log("▶ DELETE", url);
            const res = await fetch(url, { method: "DELETE" });
            if (!res.ok) throw new Error(res.statusText);
  
            // 삭제 성공 시 화면에서 카드 제거
            card.remove();
          } catch (err) {
            console.error(err);
            alert("가게 삭제 중 오류가 발생했습니다.");
          }
        }));
    }
  });
  