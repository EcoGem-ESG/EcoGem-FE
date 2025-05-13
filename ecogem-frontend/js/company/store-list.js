document.addEventListener("DOMContentLoaded", () => {
  const baseURL     = "http://localhost:8080";
  const scrollArea  = document.querySelector(".scroll-area");
  const searchInput = document.querySelector(".search-input");
  const searchBtn   = document.querySelector(".search-icon");

  // ▶ JWT 토큰은 로그인 시 localStorage에 저장했다고 가정
  const token = localStorage.getItem("token");
  if (!token) {
    alert("로그인이 필요합니다.");
    return;
  }

  // 최초 로드 및 검색 버튼/Enter 키 이벤트
  fetchStores();
  searchBtn.addEventListener("click", fetchStores);
  searchInput.addEventListener("keydown", e => {
    if (e.key === "Enter") fetchStores();
  });

  /**
   * 1) 계약된 가게 목록 조회
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
      console.error("가게 목록 조회 실패:", err);
      alert("가게 목록을 불러오는 중 오류가 발생했습니다.");
    }
  }

  /**
   * 2) 가게 카드 렌더링
   */
  function renderStores(stores) {
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
   * 3) 삭제 버튼 이벤트 바인딩
   */
  function bindDeleteEvents() {
    scrollArea.querySelectorAll(".store-card .delete-btn")
      .forEach(btn => btn.addEventListener("click", async e => {
        e.stopPropagation();
        if (!confirm("이 가게를 계약 목록에서 삭제하시겠습니까?")) return;

        const card    = btn.closest(".store-card");
        const storeId = card.dataset.id;
        const url     = `${baseURL}/api/contracts/stores/${storeId}`;

        try {
          console.log("DELETE", url);
          const res = await fetch(url, {
            method:  "DELETE",
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          if (!res.ok) throw new Error(res.statusText);

          // 삭제 성공 시 카드 제거
          card.remove();
        } catch (err) {
          console.error("가게 삭제 실패:", err);
          alert("가게 삭제 중 오류가 발생했습니다.");
        }
      }));
  }
});
