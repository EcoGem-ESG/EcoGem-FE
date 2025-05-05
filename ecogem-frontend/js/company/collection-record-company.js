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

    // ▶ 테스트용 하드코딩 (인증 연동 후 제거)
    const userId = 1;
    const userRole = "COMPANY_WORKER";

    // 1) 날짜 변경 또는 초기 로드 시
    startInput.addEventListener("change", fetchRecords);
    endInput.addEventListener("change", fetchRecords);
    fetchRecords();

    // —— 백엔드에서 데이터 가져오기
    async function fetchRecords() {
        let url = `${baseURL}/api/collection-records?user_id=${userId}&role=${userRole}`;
        if (startInput.value && endInput.value) {
            url += `&start_date=${startInput.value}&end_date=${endInput.value}`;
        }

        try {
            console.log("▶ GET", url);
            const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
            const body = await res.json();
            console.log("👈 응답", body.records);
            renderRecords(body.records);
        } catch (err) {
            console.error(err);
            alert("데이터를 불러오는 중 오류가 발생했습니다.");
        }
    }

    // —— 같은 날짜끼리 그룹핑하여 렌더링
    function renderRecords(records) {
        // 1) 기존 렌더링된 date-record 블록 삭제
        postList.querySelectorAll(".date-record").forEach(el => el.remove());

        // 2) 날짜별 그룹핑
        const grouped = records.reduce((acc, r) => {
            // r.collected_at 은 "YYYY-MM-DD" 형태 가정
            const key = r.collected_at;
            if (!acc[key]) acc[key] = [];
            acc[key].push(r);
            return acc;
        }, {});

        // 3) 날짜 내림차순 정렬하여 각 그룹 렌더링
        Object.keys(grouped)
            .sort((a, b) => b.localeCompare(a))
            .forEach(dateKey => {
                // date-record 컨테이너 생성
                const wrapper = document.createElement("div");
                wrapper.className = "date-record";
                wrapper.innerHTML = `
            <div class="date">${dateKey.replace(/-/g, ".")}</div>
            <div class="divider"></div>
          `;

                // 해당 날짜의 각 record-item 추가
                grouped[dateKey].forEach(r => {
                    const item = document.createElement("div");
                    item.className = "record-item";

                    item.dataset.id = r.record_id;

                    item.innerHTML = `
              <div class="store-name-and-menu">
                <div class="store-name">${r.store_name}</div>
                <button class="menu-btn">⋮</button>
                <div class="menu-options">
                  <button class="edit-btn">수정</button>
                  <button class="delete-btn">삭제</button>
                </div>
              </div>
              <div class="collected-by-and-name">
                <div class="collected-by">수거인: </div>
                <div class="collected-by-name">${r.collected_by}</div>
              </div>
              <div class="post-details">
                <div class="quantity">${r.volume_liter}L 수거</div>
                <div class="price">${r.price_per_liter.toLocaleString()}원/L</div>
                <div class="total">총 ${r.total_price.toLocaleString()}원</div>
              </div>
            `;

                    wrapper.appendChild(item);
                });

                // + 기록하기 버튼 위에 삽입
                postList.insertBefore(wrapper, addRecordBtn);
            });

        // 4) 이벤트 바인딩
        bindMenuEvents();
    }



    // —— 메뉴 토글, 수정, 삭제 이벤트
    function bindMenuEvents() {
        // 메뉴(⋮) 클릭
        document.querySelectorAll(".menu-btn").forEach(btn => {
            btn.addEventListener("click", e => {
                e.stopPropagation();
                const opts = btn.closest(".record-item").querySelector(".menu-options");
                opts.style.display = opts.style.display === "block" ? "none" : "block";
            });
        });

        // 수정 버튼
        document.querySelectorAll(".edit-btn").forEach(btn => {
            btn.addEventListener("click", e => {
                e.stopPropagation();
                openEditPopup(btn.closest(".record-item"));
            });
        });

        // 삭제 버튼
        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.addEventListener("click", e => {
                e.stopPropagation();
                deleteRecord(btn.closest(".record-item").dataset.id);
            });
        });

        // 바깥 클릭 시 메뉴 닫기
        document.addEventListener("click", () => {
            document.querySelectorAll(".menu-options").forEach(o => o.style.display = "none");
        });
    }

    // ▶ 수거량 또는 단가가 바뀌면 총금액 자동 계산
    function updateTotal() {
        const qty = parseFloat(qtyInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        totalInput.value = qty * price;
    }

    qtyInput.addEventListener("input", updateTotal);
    priceInput.addEventListener("input", updateTotal);
    // —— 팝업 열기
    // 팝업 열기 함수
    function openEditPopup(item) {
        const id = item.dataset.id;
        const date = item.closest(".date-record").querySelector(".date")
            .textContent.replace(/\./g, "-");
        const store = item.querySelector(".store-name").textContent;
        const name = item.querySelector(".collected-by-name").textContent;
        const qty = item.querySelector(".quantity").textContent.split("L")[0];
        const price = item.querySelector(".price")
            .textContent.replace(/[^0-9]/g, "");
        const total = item.querySelector(".total")
            .textContent.replace(/[^0-9]/g, "");

        editForm.dataset.id = id;
        editForm["edit-date"].value = date;
        editForm["edit-store"].value = store;
        editForm["edit-collected-by"].value = name;
        editForm["edit-quantity"].value = qty;
        editForm["edit-price"].value = price;
        editForm["edit-total"].value = total;


        popup.style.display = "flex";
    }


    // —— 팝업 닫기
    closeBtn.addEventListener("click", () => {
        popup.style.display = "none";
    });

    // —— 수정 API
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
            alert("수정 중 오류가 발생했습니다.");
        }
    });

    // —— 삭제 API
    async function deleteRecord(id) {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        try {
            await fetch(
                `${baseURL}/api/collection-records/${id}` +
                `?user_id=${userId}&role=${userRole}`,
                { method: "DELETE" }
            );
            fetchRecords();
        } catch (err) {
            console.error(err);
            alert("삭제 중 오류가 발생했습니다.");
        }
    }

    // —— 기록하기 페이지로 이동
    addRecordBtn.addEventListener("click", () => {
        window.location.href = "collection-record-create.html";
    });
});
