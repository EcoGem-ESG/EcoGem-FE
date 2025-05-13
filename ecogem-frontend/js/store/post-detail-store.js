document.addEventListener("DOMContentLoaded", () => {
  const baseURL = "http://localhost:8080";
  const token = localStorage.getItem("token");
  const userId = Number(localStorage.getItem("user_id"));
  const myStoreId = Number(localStorage.getItem("store_id"));
  if (!token) {
    alert("로그인이 필요합니다.");
    location.href = "../../pages/auth/login.html";
    return;
  }

  // Parse postId from URL
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("postId");
  if (!postId) {
    alert("postId가 없습니다.");
    return;
  }

  // DOM refs
  const topBarBtn = document.querySelector(".top-bar .menu-btn");
  const topBarList = document.getElementById("post-menu-list");
  const postContainer = document.getElementById("post-detail-container");
  const commentsContainer = document.getElementById("comments-container");
  const commentInputWrap = document.querySelector(".comment-input");
  const commentInputEl = commentInputWrap.querySelector("input");
  const commentBtnEl = commentInputWrap.querySelector(".submit-btn");
  const defaultPlaceholder = "Enter a comment...";

  // Post edit modal refs
  const postEditModal = document.getElementById("post-edit-modal");
  const postEditTextarea = document.getElementById("post-edit-textarea");
  const postEditCancelBtn = document.getElementById("post-edit-cancel");
  const postEditSaveBtn = document.getElementById("post-edit-save");
  // Comment edit modal refs
  const commentEditModal = document.getElementById("comment-edit-modal");
  const commentEditTextarea = document.getElementById("comment-edit-textarea");
  const commentEditCancelBtn = document.getElementById("comment-edit-cancel");
  const commentEditSaveBtn = document.getElementById("comment-edit-save");

  let currentParentId = null;
  let editingCommentId = null;
  // 초기엔 무조건 숨기기
  topBarBtn.style.display = "none";

  // Post edit cancel
  postEditCancelBtn.addEventListener("click", () => {
    postEditModal.style.display = "none";
  });
  // Post edit save
  postEditSaveBtn.addEventListener("click", async () => {
    const newContent = postEditTextarea.value.trim();
    if (!newContent) {
      alert("내용을 입력해주세요.");
      return;
    }
    try {
      const res = await fetch(
        `${baseURL}/api/posts/${postId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content: newContent })
      }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || res.statusText);
      }
      postEditModal.style.display = "none";
      await fetchPostDetail();
    } catch (err) {
      console.error("게시글 수정 실패:", err);
      alert("수정 중 오류가 발생했습니다:\n" + err.message);
    }
  });

  // Comment edit cancel
  commentEditCancelBtn.addEventListener("click", () => {
    editingCommentId = null;
    commentEditModal.style.display = "none";
  });
  // Comment edit save
  commentEditSaveBtn.addEventListener("click", async () => {
    const newText = commentEditTextarea.value.trim();
    if (!newText) {
      alert("내용을 입력해주세요.");
      return;
    }
    try {
      const res = await fetch(
        `${baseURL}/api/comments/${editingCommentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content: newText })
      }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || res.statusText);
      }
      commentEditModal.style.display = "none";
      editingCommentId = null;
      await fetchPostDetail();
    } catch (err) {
      console.error("댓글 수정 실패:", err);
      alert("댓글 수정 중 오류가 발생했습니다:\n" + err.message);
    }
  });

  // Change status
  async function changeStatus(newStatus) {
    try {
      const res = await fetch(
        `${baseURL}/api/posts/${postId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || res.statusText);
      }
      await fetchPostDetail();
    } catch (err) {
      console.error("상태 변경 실패:", err);
      alert("상태 변경 중 오류가 발생했습니다:\n" + err.message);
    }
  }

  // Top-bar menu
  topBarBtn.addEventListener("click", e => {
    e.stopPropagation();
    topBarList.style.display = topBarList.style.display === "block" ? "none" : "block";
  });
  document.addEventListener("click", () => {
    topBarList.style.display = "none";
  });
  topBarList.addEventListener("click", async e => {
    e.stopPropagation();
    const t = e.target;
    if (t.matches(".change-active")) {
      changeStatus("ACTIVE");
    } else if (t.matches(".change-reserved")) {
      changeStatus("RESERVED");
    } else if (t.matches(".change-completed")) {
      changeStatus("COMPLETED");
    } else if (t.matches(".edit-post")) {
      const current = postContainer.querySelector(".post-content").innerHTML.replace(/<br>/g, "\n");
      postEditTextarea.value = current;
      postEditModal.style.display = "flex";
      postEditTextarea.focus();
    } else if (t.matches(".delete-post")) {
      if (!confirm("정말 게시글을 삭제하시겠습니까?")) return;
      try {
        const res = await fetch(
          `${baseURL}/api/posts/${postId}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.message || res.statusText);
        }
        location.href = "board-store.html";
      } catch (err) {
        console.error("게시글 삭제 실패:", err);
        alert("삭제 중 오류가 발생했습니다:\n" + err.message);
      }
    }
    topBarList.style.display = "none";
  });

  // Fetch detail
  fetchPostDetail();
  async function fetchPostDetail() {
    try {
      const res = await fetch(
        `${baseURL}/api/posts/${postId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      }
      );
      if (!res.ok) throw new Error(res.statusText);
      const { data } = await res.json();
      renderDetail(data);
    } catch (err) {
      console.error("게시글 상세 불러오기 실패:", err);
      alert("게시글 상세를 불러오는 중 오류가 발생했습니다.");
    }
  }

  function renderDetail(data) {
    const isMine = data.user_id === userId;

    // 1) 메뉴 버튼 보여줄지 여부
    topBarBtn.style.display = isMine ? "block" : "none";


    if (isMine) {
      const items = [];
      if (data.status !== "ACTIVE") items.push(`<li class="change-active">Mark as Selling</li>`);
      if (data.status !== "RESERVED") items.push(`<li class="change-reserved">Mark as Reserved</li>`);
      if (data.status !== "COMPLETED") items.push(`<li class="change-completed">Mark as Completed</li>`);
      items.push(`<li class="edit-post">Edit</li>`);
      items.push(`<li class="delete-post">Delete</li>`);
      topBarList.innerHTML = items.join("");
    }

    let statusClass = "", statusText = "";
    switch (data.status) {
      case "ACTIVE": statusText = "Selling"; statusClass = "badge--active"; break;
      case "RESERVED": statusText = "Reserved"; break;
      case "COMPLETED": statusText = "Completed"; break;
      default: statusText = data.status;
    }
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

    commentsContainer.innerHTML = `<h3>Comments</h3>`;
    renderComments(data.comments, commentsContainer, 0);
    bindCommentMenus();
    bindReplyButtons();
  }

  function renderComments(comments, container, depth) {
    comments.forEach(c => {
      const isParent = depth === 0;
      const isMineComm = c.user_id === userId && !c.deleted;  // ← 여기!
      const div = document.createElement("div");
      div.className = "comment" + (isParent ? "" : " reply");
      div.dataset.commentId = c.comment_id;

      // 메뉴 HTML: 내 댓글(isMineComm)일 때만
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

  // Bind comment ⋮ menu actions
  function bindCommentMenus() {
    const btns = document.querySelectorAll(".comment .menu-btn");
    const lists = document.querySelectorAll(".comment .menu-list");
    const closeAll = () => lists.forEach(l => l.style.display = "none");

    btns.forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const ul = btn.nextElementSibling;
        closeAll();
        ul.style.display = ul.style.display === "block" ? "none" : "block";
      });
    });

    lists.forEach(list => {
      const [editLi, deleteLi] = list.children;

      // Edit comment
      editLi.addEventListener("click", e => {
        e.stopPropagation();
        closeAll();
        editingCommentId = list.closest(".comment").dataset.commentId;
        const oldText = list.closest(".comment").querySelector(".comment-text").textContent;
        commentEditTextarea.value = oldText;
        commentEditModal.style.display = "flex";
        commentEditTextarea.focus();
      });

      // Delete comment
      deleteLi.addEventListener("click", async e => {
        e.stopPropagation();
        closeAll();
        const commentId = list.closest(".comment").dataset.commentId;
        if (!confirm("댓글을 삭제하시겠습니까?")) return;
        try {
          const res = await fetch(
            `${baseURL}/api/comments/${commentId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
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

    document.addEventListener("click", () => lists.forEach(l => l.style.display = "none"));
  }

  // Bind reply buttons
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

  // Show @ mention badge
  function showMentionBadge(author) {
    const existing = commentInputWrap.querySelector(".mention-badge");
    if (existing) existing.remove();
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

  // Submit comment or reply
  commentBtnEl.addEventListener("click", async () => {
    const content = commentInputEl.value.trim();
    if (!content) {
      alert("내용을 입력해주세요.");
      return;
    }
    const payload = {
      post_id: Number(postId),
      parent_id: currentParentId ? Number(currentParentId) : null,
      content
    };
    try {
      const res = await fetch(`${baseURL}/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(res.statusText);
      commentInputEl.value = "";
      currentParentId = null;
      const badge = commentInputWrap.querySelector(".mention-badge");
      if (badge) badge.remove();
      commentInputEl.placeholder = defaultPlaceholder;
      await fetchPostDetail();
    } catch (err) {
      console.error("댓글 작성 실패:", err);
      alert("댓글 작성 중 오류가 발생했습니다.");
    }
  });

});