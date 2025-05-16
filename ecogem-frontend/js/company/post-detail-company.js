document.addEventListener("DOMContentLoaded", () => {
  const baseURL = "http://localhost:8080";
  const token   = localStorage.getItem("token");
  const userId  = Number(localStorage.getItem("user_id"));
  if (!token || !userId) {
    alert("로그인이 필요합니다.");
    window.location.href = "../../pages/auth/login.html";
    return;
  }

  // URL에서 postId 가져오기
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("postId");
  if (!postId) {
    alert("postId가 없습니다.");
    return;
  }

  // DOM 참조
  const topBarBtn         = document.querySelector(".top-bar .menu-btn");
  const topBarList        = document.getElementById("post-menu-list");
  const postContainer     = document.getElementById("post-detail-container");
  const commentsContainer = document.getElementById("comments-container");
  const commentInputWrap  = document.querySelector(".comment-input");
  const commentInputEl    = commentInputWrap.querySelector("input");
  const commentBtnEl      = commentInputWrap.querySelector(".submit-btn");
  const defaultPlaceholder= "Enter a comment...";

  // 답글용 상태
  let currentParentId    = null;
  let editingCommentId   = null;

  // 메뉴 버튼 초기 숨김
  topBarBtn.style.display = "none";

  // 포스트 상세 가져오기
  fetchPostDetail();

  async function fetchPostDetail() {
    try {
      const res = await fetch(`${baseURL}/api/posts/${postId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(res.statusText);
      const { data } = await res.json();
      renderDetail(data);
    } catch (err) {
      console.error("게시글 상세 불러오기 실패:", err);
      alert("게시글 상세를 불러오는 중 오류가 발생했습니다.");
    }
  }

  function renderDetail(data) {
    // 게시글 소유 여부 판단 (user_id 비교)
    const isMine = data.user_id === userId;
    topBarBtn.style.display = isMine ? "block" : "none";

    // 메뉴 리스트 구성
    if (isMine) {
      const items = [];
      if (data.status !== "ACTIVE")   items.push(`<li class="change-active">Mark as Selling</li>`);
      if (data.status !== "RESERVED") items.push(`<li class="change-reserved">Mark as Reserved</li>`);
      if (data.status !== "COMPLETED")items.push(`<li class="change-completed">Mark as Completed</li>`);
      items.push(`<li class="edit-post">Edit</li>`);
      items.push(`<li class="delete-post">Delete</li>`);
      topBarList.innerHTML = items.join("");
    }

    // 헤더 렌더링
    const statusMap = {
      ACTIVE:   ["Selling",    "badge--active"],
      RESERVED: ["Reserved",   ""],
      COMPLETED:["Completed", ""]
    };
    const [statusText, statusClass] = statusMap[data.status] || [data.status, ""];
    postContainer.innerHTML = `
      <div class="post-header">
        <div class="info">
          <div class="name">${data.store_name}</div>
          <div class="timestamp">${data.created_at.replace("T", " ").slice(0, 16)}</div>
        </div>
        <span class="badge ${statusClass}">${statusText}</span>
      </div>
      <div class="post-content">${data.content.replace(/\n/g, "<br>")}</div>
    `;

    // 댓글 렌더링
    commentsContainer.innerHTML = `<h3>Comments</h3>`;
    renderComments(data.comments, commentsContainer, 0);

    bindCommentMenus();
    bindReplyButtons();
  }

  function renderComments(comments, container, depth) {
    comments.forEach(c => {
      const isParent   = depth === 0;
      const isMineComm = c.user_id === userId && !c.deleted;
      const div = document.createElement("div");
      div.className = "comment" + (isParent ? "" : " reply");
      div.dataset.commentId = c.comment_id;

      const menuHtml = isMineComm
        ? `<button class="menu-btn">⋮</button>
           <ul class="menu-list">
             <li class="edit-comment">Edit</li>
             <li class="delete-comment">Delete</li>
           </ul>`
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
        ${isParent ? `<button class="reply-btn">Reply</button>` : ""}
      `;
      container.appendChild(div);

      if (c.children?.length) {
        renderComments(c.children, container, depth + 1);
      }
    });
  }

  function bindCommentMenus() {
    const btns  = document.querySelectorAll(".comment .menu-btn");
    const lists = document.querySelectorAll(".comment .menu-list");
    const closeAll = () => lists.forEach(l => l.style.display = "none");

    btns.forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        closeAll();
        const ul = btn.nextElementSibling;
        ul.style.display = ul.style.display === "block" ? "none" : "block";
      });
    });

    lists.forEach(list => {
      const [editLi, deleteLi] = list.children;
      // 댓글 수정
      editLi.addEventListener("click", e => {
        e.stopPropagation();
        closeAll();
        editingCommentId = list.closest(".comment").dataset.commentId;
        commentEditTextarea.value = list.closest(".comment").querySelector(".comment-text").textContent;
        commentEditModal.style.display = "flex";
      });
      // 댓글 삭제
      deleteLi.addEventListener("click", async e => {
        e.stopPropagation();
        closeAll();
        if (!confirm("댓글을 삭제하시겠습니까?")) return;
        try {
          const cid = list.closest(".comment").dataset.commentId;
          const res = await fetch(`${baseURL}/api/comments/${cid}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!res.ok) throw new Error();
          await fetchPostDetail();
        } catch {
          alert("댓글 삭제 중 오류가 발생했습니다.");
        }
      });
    });

    document.addEventListener("click", () => lists.forEach(l => l.style.display = "none"));
  }

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
        currentParentId = btn.closest(".comment").dataset.commentId;
        const author = btn.closest(".comment").querySelector(".comment-author").textContent;
        showMentionBadge(author);
      });
    });
  }

  function showMentionBadge(author) {
    const badge = document.createElement("span");
    badge.className = "mention-badge";
    badge.innerHTML = `@${author} <button type="button" class="remove-mention">×</button>`;
    commentInputWrap.insertBefore(badge, commentInputEl);
    commentInputEl.placeholder = "";
    commentInputEl.focus();
    badge.querySelector(".remove-mention").addEventListener("click", () => {
      badge.remove();
      currentParentId = null;
      commentInputEl.placeholder = defaultPlaceholder;
      commentInputEl.focus();
    });
  }

  // 댓글/답글 작성
  commentBtnEl.addEventListener("click", async () => {
    const content = commentInputEl.value.trim();
    if (!content) {
      alert("내용을 입력해주세요.");
      return;
    }
    try {
      const res = await fetch(`${baseURL}/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          post_id:   Number(postId),
          parent_id: currentParentId ? Number(currentParentId) : null,
          content
        })
      });
      if (!res.ok) throw new Error();
      commentInputEl.value = "";
      currentParentId = null;
      const badge = commentInputWrap.querySelector(".mention-badge");
      if (badge) badge.remove();
      commentInputEl.placeholder = defaultPlaceholder;
      await fetchPostDetail();
    } catch {
      alert("댓글 작성 중 오류가 발생했습니다.");
    }
  });

  // — 포스트 메뉴(수정/삭제/상태변경) 바인딩 — 
  topBarBtn.addEventListener("click", e => {
    e.stopPropagation();
    topBarList.style.display = topBarList.style.display === "block" ? "none" : "block";
  });
  document.addEventListener("click", () => topBarList.style.display = "none");
  topBarList.addEventListener("click", async e => {
    e.stopPropagation();
    const cls = e.target.className;
    if (cls === "edit-post") {
      postEditTextarea.value = postContainer.querySelector(".post-content").innerHTML.replace(/<br>/g, "\n");
      postEditModal.style.display = "flex";
    } else if (cls === "delete-post") {
      if (confirm("정말 삭제하시겠습니까?")) {
        await fetch(`${baseURL}/api/posts/${postId}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });
        window.location.href = "board-company.html";
      }
    } else if (cls.startsWith("change-")) {
      const status = cls.split("-")[1].toUpperCase();
      await fetch(`${baseURL}/api/posts/${postId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      await fetchPostDetail();
    }
    topBarList.style.display = "none";
  });
});
