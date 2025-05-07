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

  // — DOM 레퍼런스 —
  const postContainer       = document.getElementById("post-detail-container");
  const commentsContainer   = document.getElementById("comments-container");
  const commentInputWrap    = document.querySelector(".comment-input");
  const commentInputEl      = commentInputWrap.querySelector("input");
  const commentBtnEl        = commentInputWrap.querySelector(".submit-btn");
  const defaultPlaceholder  = "댓글을 입력해주세요.";

  // 댓글 수정 모달
  const commentEditModal    = document.getElementById("comment-edit-modal");
  const commentEditTextarea = document.getElementById("comment-edit-textarea");
  const commentEditCancelBtn= document.getElementById("comment-edit-cancel");
  const commentEditSaveBtn  = document.getElementById("comment-edit-save");

  // state
  let currentParentId  = null;
  let editingCommentId = null;

  // — 댓글 수정 모달 바인딩 —
  commentEditCancelBtn.addEventListener("click", () => {
    editingCommentId = null;
    commentEditModal.style.display = "none";
  });
  commentEditSaveBtn.addEventListener("click", async () => {
    const newText = commentEditTextarea.value.trim();
    if (!newText) {
      alert("내용을 입력해주세요.");
      return;
    }
    try {
      const res  = await fetch(
        `${baseURL}/api/comments/${editingCommentId}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ user_id: userId, content: newText })
        }
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.message||res.statusText);

      commentEditModal.style.display = "none";
      editingCommentId = null;
      await fetchPostDetail();   // 다시 불러와서 화면 갱신
    } catch (err) {
      console.error("댓글 수정 실패:", err);
      alert("댓글 수정 중 오류가 발생했습니다.");
    }
  });

  // 2) 상세 데이터 가져오기
  fetchPostDetail();
  async function fetchPostDetail() {
    try {
      const res = await fetch(
        `${baseURL}/api/posts/${postId}` +
        `?user_id=${userId}&role=${userRole}`
      );
      const { data } = await res.json();
      renderDetail(data);
    } catch (err) {
      console.error("상세 로드 실패:", err);
      alert("게시글 상세를 불러오는 중 오류가 발생했습니다.");
    }
  }

  // 3) 화면 렌더링
  function renderDetail(data) {
    // — 게시글 영역 —
    let statusClass = "", statusText = "";
    switch (data.status) {
      case "ACTIVE":    statusText = "판매 중"; statusClass = "badge--active"; break;
      case "RESERVED":  statusText = "예약 중";                            break;
      case "COMPLETED": statusText = "거래 완료";                          break;
      default:          statusText = data.status;
    }
    postContainer.innerHTML = `
      <div class="post-header">
        <div class="info">
          <div class="name">${data.store_name}</div>
          <div class="timestamp">${data.created_at.replace("T"," ").slice(0,16)}</div>
        </div>
        <span class="badge ${statusClass}">${statusText}</span>
      </div>
      <div class="post-content">${data.content.replace(/\n/g,"<br>")}</div>
    `;

    // — 댓글 영역 —
    commentsContainer.innerHTML = `<h3>댓글</h3>`;
    renderComments(data.comments, commentsContainer, 0);

    bindCommentMenus();
    bindReplyButtons();
  }

  // 댓글·대댓글 재귀 렌더
  function renderComments(comments, container, depth) {
    comments.forEach(c => {
      const isParent = depth === 0;
      const isMine   = c.user_id === userId;
      const div      = document.createElement("div");
      div.className  = "comment" + (isParent ? "" : " reply");
      div.dataset.commentId = c.comment_id;

      const isDeleted = c.deleted;
      const menuHtml  = (isMine && !isDeleted)
        ? `<button class="menu-btn">⋮</button>
           <ul class="menu-list"><li>수정</li><li>삭제</li></ul>`
        : "";

      div.innerHTML = `
        <div class="comment-header">
          <div class="profile-icon"></div>
          <div class="info">
            <div class="comment-author">${c.author_name}</div>
          </div>
          ${menuHtml}
        </div>
        <div class="comment-text">${c.content}</div>
        <div class="timestamp">${c.created_at.replace("T"," ").slice(0,16)}</div>
        ${isParent ? `<button class="reply-btn">답글 쓰기</button>` : ""}
      `;
      container.appendChild(div);

      if (c.children?.length) {
        renderComments(c.children, container, depth + 1);
      }
    });
  }

  // 댓글 ⋮ 메뉴 및 수정/삭제 바인딩
  function bindCommentMenus() {
    const btns  = document.querySelectorAll(".comment .menu-btn");
    const lists = document.querySelectorAll(".comment .menu-list");
    const closeAll = () => lists.forEach(l => l.style.display = "none");

    btns.forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const ul = btn.nextElementSibling;
        closeAll();
        ul.style.display = (ul.style.display === "block" ? "none" : "block");
      });
    });

    lists.forEach(list => {
      const [editLi, deleteLi] = list.children;
      // 수정
      editLi.addEventListener("click", e => {
        e.stopPropagation();
        closeAll();
        const commentDiv = list.closest(".comment");
        editingCommentId = commentDiv.dataset.commentId;
        const oldText = commentDiv.querySelector(".comment-text").textContent;
        commentEditTextarea.value = oldText;
        commentEditModal.style.display = "flex";
        commentEditTextarea.focus();
      });
      // 삭제
      deleteLi.addEventListener("click", async e => {
        e.stopPropagation();
        closeAll();
        const commentId = list.closest(".comment").dataset.commentId;
        if (!confirm("정말 삭제하시겠습니까?")) return;
        try {
          const res = await fetch(
            `${baseURL}/api/comments/${commentId}?user_id=${userId}`, {
              method: "DELETE"
            }
          );
          if (!res.ok) throw new Error(res.statusText);
          await fetchPostDetail();
        } catch (err) {
          console.error("댓글 삭제 실패:", err);
          alert("댓글 삭제 중 오류가 발생했습니다.");
        }
      });
    });

    // 밖 클릭 시 닫기
    document.addEventListener("click", () => lists.forEach(l => l.style.display = "none"));
  }

  // 답글 쓰기 바인딩
  function bindReplyButtons() {
    document.querySelectorAll(".reply-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const existing = commentInputWrap.querySelector(".mention-badge");
        if (existing) {
          existing.remove();
          commentInputEl.placeholder = defaultPlaceholder;
          commentInputEl.value = "";
          currentParentId = null;
          return;
        }
        const commentDiv = btn.closest(".comment");
        currentParentId = commentDiv.dataset.commentId;
        const author = commentDiv.querySelector(".comment-author").textContent;
        showMentionBadge(author);
      });
    });
  }

  // @뱃지 표시
  function showMentionBadge(author) {
    const existing = commentInputWrap.querySelector(".mention-badge");
    if (existing) existing.remove();
    const badge = document.createElement("span");
    badge.className = "mention-badge";
    badge.innerHTML = `@${author} <button type="button" class="remove-mention">×</button>`;
    commentInputWrap.insertBefore(badge, commentInputEl);
    commentInputEl.placeholder = "";
    commentInputEl.focus();
    badge.querySelector(".remove-mention")
      .addEventListener("click", () => {
        badge.remove();
        currentParentId = null;
        commentInputEl.placeholder = defaultPlaceholder;
        commentInputEl.focus();
      });
  }

  // 댓글/답글 등록
  commentBtnEl.addEventListener("click", async () => {
    const content = commentInputEl.value.trim();
    if (!content) {
      alert("내용을 입력해주세요.");
      return;
    }
    const payload = {
      post_id:   Number(postId),
      parent_id: currentParentId ? Number(currentParentId) : null,
      user_id:   Number(userId),
      content
    };
    try {
      const res = await fetch(`${baseURL}/api/comments`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(res.statusText);
      commentInputEl.value = "";
      currentParentId = null;
      const badge = commentInputWrap.querySelector(".mention-badge");
      if (badge) badge.remove();
      commentInputEl.placeholder = defaultPlaceholder;
      await fetchPostDetail();
    } catch (err) {
      console.error("댓글 등록 실패:", err);
      alert("댓글 등록 중 오류가 발생했습니다.");
    }
  });

});
