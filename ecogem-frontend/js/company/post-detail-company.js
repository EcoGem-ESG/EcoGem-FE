// post-detail-company.js

document.addEventListener("DOMContentLoaded", () => {
  const baseURL = "http://localhost:8080";

  // ▶ 테스트용 하드코딩 (인증 연동 전 제거)
  const userId   = 1;
  const userRole = "COMPANY_WORKER";

  // 1) URL에서 postId 파싱
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("postId");
  if (!postId) {
    alert("postId가 없습니다.");
    return;
  }

  // 컨테이너 & 입력 요소
  const postContainer     = document.getElementById("post-detail-container");
  const commentsContainer = document.getElementById("comments-container");
  const commentInputWrap  = document.querySelector(".comment-input");
  const commentInputEl    = commentInputWrap.querySelector("input");
  const commentBtnEl      = commentInputWrap.querySelector(".submit-btn");

  // 저장해 둘 초기 placeholder 텍스트
  const defaultPlaceholder = "댓글을 입력해주세요.";

  // 2) API 호출
  fetchPostDetail();

  async function fetchPostDetail() {
    const url = `${baseURL}/api/posts/${postId}?user_id=${userId}&role=${userRole}`;
    try {
      const res  = await fetch(url);
      const body = await res.json();
      renderDetail(body.data);
    } catch (err) {
      console.error("상세 로드 실패:", err);
      alert("게시글 상세를 불러오는 중 오류가 발생했습니다.");
    }
  }

  // 3) 화면 렌더링
  function renderDetail(data) {
    // — 게시글 —
    const postDiv = document.createElement("div");
    postDiv.className = "post-detail";

    let statusClass = "", statusText = "";
    switch (data.status) {
      case "ACTIVE":    statusText = "판매 중"; statusClass = "badge--active"; break;
      case "RESERVED":  statusText = "예약 중"; break;
      case "COMPLETED": statusText = "거래 완료"; break;
      default:          statusText = data.status;
    }

    postDiv.innerHTML = `
      <div class="post-header">
        <div class="info">
          <div class="name">${data.store_name}</div>
          <div class="timestamp">${data.created_at.replace("T"," ").slice(0,16)}</div>
        </div>
        <span class="badge ${statusClass}">${statusText}</span>
      </div>
      <div class="post-content">${data.content.replace(/\n/g,"<br>")}</div>
    `;
    postContainer.replaceWith(postDiv);

    // — 댓글 —
    const wrapper = document.createElement("div");
    wrapper.id = "comments-container";
    wrapper.className = "comments-section";
    wrapper.innerHTML = `<h3>댓글</h3>`;
    renderComments(data.comments, wrapper, 0);
    commentsContainer.replaceWith(wrapper);

    bindMenuToggles();
    bindReplyButtons();
  }

  // 댓글·대댓글 렌더
  function renderComments(comments, container, depth) {
    comments.forEach(c => {
      const isParent = depth === 0;
      const isMine   = c.user_id === userId;
      const div      = document.createElement("div");
      div.className  = "comment" + (isParent ? "" : " reply");

      const menuHtml = isMine
        ? `<button class="menu-btn">⋮</button>
           <ul class="menu-list"><li>수정</li><li>삭제</li></ul>`
        : "";

      div.innerHTML = `
        <div class="comment-header">
          <div class="profile-icon"></div>
          <div class="info">
            <div class="comment-author">${c.author_name}</div>
            <div class="timestamp">${c.created_at.replace("T"," ").slice(0,16)}</div>
          </div>
          ${menuHtml}
        </div>
        <div class="comment-text">${c.content}</div>
        ${isParent ? `<button class="reply-btn">답글 쓰기</button>` : ""}
      `;
      container.appendChild(div);

      if (c.children?.length) {
        renderComments(c.children, container, depth + 1);
      }
    });
  }

  // 메뉴 토글
  function bindMenuToggles() {
    const menuButtons = document.querySelectorAll(".menu-btn");
    const lists       = document.querySelectorAll(".menu-list");
    const closeAll    = () => lists.forEach(l => l.style.display = "none");

    menuButtons.forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const next = btn.nextElementSibling;
        const open = next.style.display === "block";
        closeAll();
        next.style.display = open ? "none" : "block";
      });
    });
    lists.forEach(l => l.addEventListener("click", e => e.stopPropagation()));
    document.addEventListener("click", () => closeAll());
  }

  // 답글 기능
  function bindReplyButtons() {
    // “답글 쓰기” 버튼 클릭
    document.querySelectorAll(".reply-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const author = btn.closest(".comment")
                          .querySelector(".comment-author").textContent;
        showMentionBadge(author);
      });
    });
  }

  // 회색 @배지 만들고 삽입
  function showMentionBadge(author) {
    // 이미 배지가 있으면 제거
    const existing = commentInputWrap.querySelector(".mention-badge");
    if (existing) existing.remove();

    // 배지 생성
    const badge = document.createElement("span");
    badge.className = "mention-badge";
    badge.innerHTML = `
      @${author}
      <button type="button" class="remove-mention">×</button>
    `;
    // 배지 삽입 (input 바로 앞)
    commentInputWrap.insertBefore(badge, commentInputEl);

    // placeholder 업데이트
    commentInputEl.placeholder = ``;
    commentInputEl.focus();

    // X 클릭 시 배지 삭제 & placeholder 복구
    badge.querySelector(".remove-mention").addEventListener("click", () => {
      badge.remove();
      commentInputEl.placeholder = defaultPlaceholder;
      commentInputEl.focus();
    });
  }
});
