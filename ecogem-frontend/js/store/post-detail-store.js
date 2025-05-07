document.addEventListener("DOMContentLoaded", () => {
  const baseURL = "http://localhost:8080";

  // ▶ 테스트용 하드코딩 (인증 연동 전 제거)
  const userId = 2;
  const userRole = "STORE_OWNER";
  const myStoreId = 1;   // ← 이 값은 나중에 API로 대체

  // 1) URL에서 postId 파싱
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("postId");
  if (!postId) {
    alert("postId가 없습니다.");
    return;
  }

  // — DOM 레퍼런스 —
  const topBarBtn = document.querySelector(".top-bar .menu-btn");
  const topBarList = document.getElementById("post-menu-list");
  const postContainer = document.getElementById("post-detail-container");
  const commentsContainer = document.getElementById("comments-container");
  const commentInputWrap = document.querySelector(".comment-input");
  const commentInputEl = commentInputWrap.querySelector("input");
  const commentBtnEl = commentInputWrap.querySelector(".submit-btn");
  const defaultPlaceholder = "댓글을 입력해주세요.";

  // 모달용 전역 변수
  // 게시글 수정용
  const postEditModal = document.getElementById("post-edit-modal");
  const postEditTextarea = document.getElementById("post-edit-textarea");
  const postEditCancelBtn = document.getElementById("post-edit-cancel");
  const postEditSaveBtn = document.getElementById("post-edit-save");
  // 댓글용
  const commentEditModal = document.getElementById("comment-edit-modal");
  const commentEditTextarea = document.getElementById("comment-edit-textarea");
  const commentEditCancelBtn = document.getElementById("comment-edit-cancel");
  const commentEditSaveBtn = document.getElementById("comment-edit-save");

  // state: reply target
  let currentParentId = null;
  let editingCommentId = null;

  postEditCancelBtn.addEventListener("click", () => {
    postEditModal.style.display = "none";
  });
  
  postEditSaveBtn.addEventListener("click", async () => {
    const newContent = postEditTextarea.value.trim();
    if (!newContent) {
      alert("내용을 입력해주세요.");
      return;
    }
    try {
      const res = await fetch(
        `${baseURL}/api/posts/${postId}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            store_id: myStoreId,
            content:  newContent
          })
        }
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || res.statusText);
      postEditModal.style.display = "none";
      fetchPostDetail();
    } catch (err) {
      console.error("게시글 수정 실패:", err);
      alert("게시글 수정 중 오류가 발생했습니다:\n" + err.message);
    }
  });

  // bind modal buttons
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
      const res = await fetch(
        `${baseURL}/api/comments/${editingCommentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, content: newText })
        }
      );
      const body = await res.json();
      if (!res.ok) {
        console.error("PATCH /api/comments failed:", body);
        alert("댓글 수정 중 오류가 발생했습니다:\n" + (body.message || ""));
        return;
      }
      commentEditModal.style.display = "none";
      editingCommentId = null;
      fetchPostDetail();
    } catch (err) {
      console.error("댓글 수정 실패:", err);
      alert("댓글 수정 중 오류가 발생했습니다.");
    }
  });

  // --- 상태 변경 함수 ---
  async function changeStatus(newStatus) {
    try {
      const res = await fetch(
        `${baseURL}/api/posts/${postId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            store_id: myStoreId,
            status: newStatus
          })
        }
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || res.statusText);
      await fetchPostDetail(); // 갱신
    } catch (err) {
      console.error("상태 변경 실패:", err);
      alert("상태 변경 중 오류가 발생했습니다:\n" + err.message);
    }
  }

  // — 상단바 메뉴: 토글 & 이벤트 위임 — 
  topBarBtn.addEventListener("click", e => {
    e.stopPropagation();
    topBarList.style.display =
      topBarList.style.display === "block" ? "none" : "block";
  });
  document.addEventListener("click", () => {
    topBarList.style.display = "none";
  });
  topBarList.addEventListener("click", async e => {
    e.stopPropagation();
    const t = e.target;
    if (t.matches(".change-active")) changeStatus("ACTIVE");
    else if (t.matches(".change-reserved")) changeStatus("RESERVED");
    else if (t.matches(".change-completed")) changeStatus("COMPLETED");
  else if (t.matches(".edit-post")) {
  // ▶ 게시글 수정 모달 열기
  // 기존 내용을 textarea에 채워주고 포커스
  const contentEl = postContainer.querySelector(".post-content");
  const current   = contentEl.innerHTML.replace(/<br>/g, "\n");
  postEditTextarea.value = current;
  postEditModal.style.display = "flex";
  postEditTextarea.focus();
}
else if (t.matches(".delete-post")) {
  // ▶ 게시글 삭제
  if (!confirm("정말 이 게시글을 삭제하시겠습니까?")) return;
  try {
    const res2 = await fetch(
      `${baseURL}/api/posts/${postId}?storeId=${myStoreId}`, {
        method: "DELETE"
      }
    );
    const body2 = await res2.json();
    if (!res2.ok) throw new Error(body2.message || res2.statusText);
    // 삭제 성공 → 목록 페이지로 이동
    location.href = "board-store.html";
  } catch (err) {
    console.error("게시글 삭제 실패:", err);
    alert("게시글 삭제 중 오류가 발생했습니다:\n" + err.message);
  }
}
    topBarList.style.display = "none";
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


  // 3) 화면에 렌더링
  function renderDetail(data) {
    // — 상단 ⋮ 메뉴 노출 여부
    const isMine = userRole === "STORE_OWNER"
      && data.store_id === myStoreId;
    if (isMine) {
      // 현재 상태가 아닌 것들만 메뉴에 추가
      const items = [];
      if (data.status !== "ACTIVE") {
        items.push(`<li class="change-active">판매 중으로 변경</li>`);
      }
      if (data.status !== "RESERVED") {
        items.push(`<li class="change-reserved">예약 중으로 변경</li>`);
      }
      if (data.status !== "COMPLETED") {
        items.push(`<li class="change-completed">거래 완료로 변경</li>`);
      }
      // 언제나 수정/삭제는 노출
      items.push(`<li class="edit-post">수정</li>`);
      items.push(`<li class="delete-post">삭제</li>`);

      topBarList.innerHTML = items.join("");
      topBarBtn.style.display = "block";
      //bindTopBarMenu();
    } else {
      topBarBtn.style.display = "none";
      topBarList.style.display = "none";
    }
    // — 게시글 영역 (innerHTML으로 덮어쓰기) —
    let statusClass = "", statusText = "";
    switch (data.status) {
      case "ACTIVE": statusText = "판매 중"; statusClass = "badge--active"; break;
      case "RESERVED": statusText = "예약 중"; break;
      case "COMPLETED": statusText = "거래 완료"; break;
      default: statusText = data.status;
    }
    postContainer.innerHTML = `
      <div class="post-detail">
        <div class="post-header">
          <div class="info">
            <div class="name">${data.store_name}</div>
            <div class="timestamp">${data.created_at.replace("T", " ").slice(0, 16)}</div>
          </div>
          <span class="badge ${statusClass}">${statusText}</span>
        </div>
        <div class="post-content">${data.content.replace(/\n/g, "<br>")}</div>
      </div>
    `;

    // — 댓글 영역 (innerHTML으로 초기화 후 재렌더) —
    commentsContainer.innerHTML = `<h3>댓글</h3>`;
    renderComments(data.comments, commentsContainer, 0);

    // 메뉴/답글 바인딩
    bindCommentMenus();
    bindReplyButtons();
  }

  // 댓글·대댓글 재귀 렌더
  function renderComments(comments, container, depth) {
    comments.forEach(c => {
      const isParent = depth === 0;
      const isMine = c.user_id === userId;
      const div = document.createElement("div");
      div.className = "comment" + (isParent ? "" : " reply");
      div.dataset.commentId = c.comment_id;

      // “삭제된 댓글” 이거나 본인 댓글이 아니면 메뉴 숨기기
      const isDeleted = c.deleted; 
      const menuHtml = (isMine && !isDeleted)
        ? `<button class="menu-btn">⋮</button>
     <ul class="menu-list"><li>수정</li><li>삭제</li></ul>`
        : "";

      div.innerHTML = `
        <div class="comment-header">
          <div class="info">
            <div class="comment-author">${c.author_name}</div>
          </div>
          ${menuHtml}
        </div>
        <div class="comment-text">${c.content}</div>
        
            <div class="timestamp">${c.created_at.replace("T", " ").slice(0, 16)}</div>
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
    const btns = document.querySelectorAll(".comment .menu-btn");
    const lists = document.querySelectorAll(".comment .menu-list");
    const closeAll = () => lists.forEach(l => l.style.display = "none");

    btns.forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const ul = btn.nextElementSibling;
        const open = ul.style.display === "block";
        closeAll();
        ul.style.display = open ? "none" : "block";
      });
    });

    // “수정” / “삭제” 항목 클릭
    lists.forEach(list => {
      const editLi = list.children[0];
      const deleteLi = list.children[1];

      // 댓글 메뉴 바인딩 내부에서 수정 클릭할 때:
      editLi.addEventListener("click", e => {
        e.stopPropagation();
        closeAll();

        // 모달 열기
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
            `${baseURL}/api/comments/${commentId}?user_id=${userId}`,
            { method: "DELETE" }
          );
          if (!res.ok) throw new Error(res.statusText);
          fetchPostDetail();
        } catch (err) {
          console.error("댓글 삭제 실패:", err);
          alert("댓글을 삭제하는 중 오류가 발생했습니다.");
        }
      });
    });

    lists.forEach(l => l.addEventListener("click", e => e.stopPropagation()));
    document.addEventListener("click", () => lists.forEach(l => l.style.display = "none"));
  }

  
  // — 답글 쓰기 바인딩 —
  function bindReplyButtons() {
    document.querySelectorAll(".reply-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();

        // If a mention badge already exists, remove it and reset:
        const existing = commentInputWrap.querySelector(".mention-badge");
        if (existing) {
          existing.remove();
          commentInputEl.placeholder = defaultPlaceholder;
          commentInputEl.value = "";
          currentParentId = null;
          return;
        }

        // Otherwise start a new reply:
        const commentDiv = btn.closest(".comment");
        const author = commentDiv.querySelector(".comment-author").textContent;
        currentParentId = commentDiv.dataset.commentId;

        showMentionBadge(author);
      });
    });
  }


  // 회색 @뱃지
  function showMentionBadge(author) {
    // 이미 있으면 제거
    const existing = commentInputWrap.querySelector(".mention-badge");
    if (existing) existing.remove();

    const badge = document.createElement("span");
    badge.className = "mention-badge";
    badge.innerHTML = `
      @${author}
      <button type="button" class="remove-mention">×</button>
    `;
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
      post_id: Number(postId),
      parent_id: currentParentId ? Number(currentParentId) : null,
      user_id: Number(userId),
      content: content
    };
    try {
      const res = await fetch(`${baseURL}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(res.statusText);
      // 입력창 초기화
      commentInputEl.value = "";
      currentParentId = null;
      const badge = commentInputWrap.querySelector(".mention-badge");
      if (badge) badge.remove();
      commentInputEl.placeholder = defaultPlaceholder;
      // 새로고침 없이 다시 데이터 불러와서 화면 갱신
      fetchPostDetail();
    } catch (err) {
      console.error("댓글 등록 실패:", err);
      alert("댓글을 등록하는 중 오류가 발생했습니다.");
    }
  });

});
