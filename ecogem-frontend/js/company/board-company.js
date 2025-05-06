// board-company.js

document.addEventListener("DOMContentLoaded", () => {
    const baseURL = "http://localhost:8080";

    // ▶ 테스트용 하드코딩 (인증 연동 전 제거)
    const userId = 1;
    const userRole = "COMPANY_WORKER";
    const companyLat = 37.5000;   // 테스트용 위도
    const companyLng = 127.0000;  // 테스트용 경도

    const rangeSelect = document.querySelector(".range-select");
    const dropdown = document.querySelector(".dropdown");
    const postList = document.querySelector(".post-list");

    let currentRadius = null;   // null = 전체

    // 0) 드롭다운 숨기기 & '전체' 옵션 추가
    dropdown.style.display = "none";
    const resetLi = document.createElement("li");
    resetLi.textContent = "전체";
    dropdown.prepend(resetLi);
    const radiusItems = dropdown.querySelectorAll("li");

    // 1) 드롭다운 토글
    rangeSelect.addEventListener("click", e => {
        dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
        e.stopPropagation();
    });
    document.addEventListener("click", () => dropdown.style.display = "none");

    // 2) 반경 / 전체 선택
    radiusItems.forEach(li => {
        li.addEventListener("click", () => {
            if (li.textContent === "전체") {
                currentRadius = null;
                rangeSelect.firstChild.textContent = "업체 주변 범위 설정 ⌄";
            } else {
                currentRadius = parseInt(li.textContent, 10);
                rangeSelect.firstChild.textContent = `${currentRadius}km 반경 ⌄`;
            }
            dropdown.style.display = "none";
            fetchPosts();
        });
    });

    // 3) 게시글 조회
    async function fetchPosts() {
        let url = `${baseURL}/api/posts`
            + `?lat=${companyLat}&lng=${companyLng}`
            + `&user_id=${userId}&role=${userRole}`;
        if (currentRadius) {
            url += `&radius=${currentRadius}`;
        }

        try {
            console.log("▶ GET", url);
            const res = await fetch(url);
            const body = await res.json();
            renderPosts(body.data || []);
        } catch (err) {
            console.error("게시글 로드 실패:", err);
            alert("게시글을 불러오는 중 오류가 발생했습니다.");
        }
    }

    // 4) 렌더링
    function renderPosts(posts) {
        // 이전 카드 삭제
        postList.querySelectorAll(".post-card").forEach(el => el.remove());

        posts.forEach(p => {
            const card = document.createElement("div");
            card.className = "post-card";

            // 상태 badge 텍스트 매핑
            let badgeText, badgeClass = "badge";
            switch (p.status) {
                case "ACTIVE":
                    badgeText = "판매 중";
                    badgeClass += " badge--active";
                    break;
                case "RESERVED":
                    badgeText = "예약 중";
                    break;
                case "COMPLETED":
                    badgeText = "거래 완료";
                    break;
                default:
                    badgeText = p.status;
            }


            card.innerHTML = `
          <div class="store-name">${p.store_name}</div>
          <div class="post-content">${p.content}</div>
          <span class="${badgeClass}">${badgeText}</span>
        `;

            // 상세 페이지로 이동
            card.addEventListener("click", () => {
                location.href = `post-detail-company.html?postId=${p.post_id}`;
            });

            postList.appendChild(card);
        });
    }

    // 초기 로드
    fetchPosts();
});
