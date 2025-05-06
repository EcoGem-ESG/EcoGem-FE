// board-store.js

document.addEventListener("DOMContentLoaded", () => {
    const baseURL = "http://localhost:8080";
  
    // ▶ 테스트용 하드코딩 (인증 연동 전 제거)
    const storeLat  = 37.5000;    // 테스트용 위도
    const storeLng  = 127.0000;   // 테스트용 경도
  
    const registerBtn = document.querySelector(".register-post-btn");
    const postList    = document.querySelector(".post-list");
  
    // “게시글 작성하기” 버튼
    registerBtn.addEventListener("click", () => {
      window.location.href = "register-post.html";
    });
  
    // 초기 로드
    fetchPosts();
  
    // 게시글들 가져오기
    async function fetchPosts() {
      const url = `${baseURL}/api/posts?lat=${storeLat}&lng=${storeLng}`;
      try {
        console.log("▶ GET", url);
        const res  = await fetch(url);
        const body = await res.json();
        renderPosts(body.data || []);
      } catch (err) {
        console.error("게시글 로드 실패:", err);
        alert("게시글을 불러오는 중 오류가 발생했습니다.");
      }
    }
  
    // 화면에 렌더링
    function renderPosts(posts) {
      // 이전 카드 제거
      postList.querySelectorAll(".post-card").forEach(el => el.remove());
  
      posts.forEach(p => {
        const card = document.createElement("div");
        card.className = "post-card";
  
        // 상태 badge 텍스트 및 클래스 결정
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
  
        // 클릭하면 가게용 상세 페이지로 이동
        card.addEventListener("click", () => {
          window.location.href = `post-detail-store.html?postId=${p.post_id}`;
        });
  
        postList.appendChild(card);
      });
    }
  });
  