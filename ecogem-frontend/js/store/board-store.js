document.addEventListener("DOMContentLoaded", () => {
  const baseURL = "http://localhost:8080";
  const token   = localStorage.getItem("token");
  if (!token) {
    alert("로그인이 필요합니다.");
    location.href = "../../pages/index.html";
    return;
  }

  const registerBtn = document.querySelector(".register-post-btn");
  const postList    = document.querySelector(".post-list");

  // "Create Post" 버튼 클릭 시
  registerBtn.addEventListener("click", () => {
    window.location.href = "../../pages/register-post.html";
  });

  // 초기 로드
  fetchPosts();

  async function fetchPosts() {
    let url = `${baseURL}/api/posts`;

    try {
      console.log("▶ GET", url);
      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type":  "application/json"
        }
      });
      if (!res.ok) throw new Error(res.statusText);
      const { data } = await res.json();
      renderPosts(data || []);
    } catch (err) {
      console.error("게시글 불러오기 실패:", err);
      alert("게시글 로딩 중 오류가 발생했습니다.");
    }
  }

  function renderPosts(posts) {
    postList.querySelectorAll(".post-card").forEach(el => el.remove());

    posts.forEach(p => {
      const card = document.createElement("div");
      card.className = "post-card";

      let badgeText, badgeClass = "badge";
      switch (p.status) {
        case "ACTIVE":
          badgeText = "Selling";
          badgeClass += " badge--active";
          break;
        case "RESERVED":
          badgeText = "Reserved";
          break;
        case "COMPLETED":
          badgeText = "Completed";
          break;
        default:
          badgeText = p.status;
      }

      card.innerHTML = `
        <div class="store-name">${p.store_name}</div>
        <div class="post-content">${p.content}</div>
        <span class="${badgeClass}">${badgeText}</span>
      `;

      card.addEventListener("click", () => {
        window.location.href = `../../pages/store/post-detail-store.html?postId=${p.post_id}`;
      });

      postList.appendChild(card);
    });
  }
});
