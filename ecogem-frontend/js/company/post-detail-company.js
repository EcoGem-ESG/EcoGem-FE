document.addEventListener("DOMContentLoaded", () => {
  const baseURL = "http://localhost:8080";
  const token   = localStorage.getItem("token");
  const userId  = Number(localStorage.getItem("user_id"));
  const myStoreId = Number(localStorage.getItem("store_id"));
  if (!token || !userId || !myStoreId) {
    alert("로그인이 필요합니다.");
    location.href = "../../pages/auth/login.html";
    return;
  }

  //— URL에서 postId 가져오기
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("postId");
  if (!postId) {
    alert("postId가 없습니다.");
    return;
  }

  //— DOM refs
  const topBarBtn         = document.querySelector(".top-bar .menu-btn");
  const topBarList        = document.getElementById("post-menu-list");
  const postContainer     = document.getElementById("post-detail-container");
  const commentsContainer = document.getElementById("comments-container");
  const commentInputWrap  = document.querySelector(".comment-input");
  const commentInputEl    = commentInputWrap.querySelector("input");
  const commentBtnEl      = commentInputWrap.querySelector(".submit-btn");
  const defaultPlaceholder = "Enter a comment...";

  //— Modals
  const postEditModal      = document.getElementById("post-edit-modal");
  const postEditTextarea   = document.getElementById("post-edit-textarea");
  const postEditCancelBtn  = document.getElementById("post-edit-cancel");
  const postEditSaveBtn    = document.getElementById("post-edit-save");

  const commentEditModal     = document.getElementById("comment-edit-modal");
  const commentEditTextarea  = document.getElementById("comment-edit-textarea");
  const commentEditCancelBtn = document.getElementById("comment-edit-cancel");
  const commentEditSaveBtn   = document.getElementById("comment-edit-save");

  let currentParentId  = null;
  let editingCommentId = null;

  //— Post edit cancel/save
  postEditCancelBtn.addEventListener("click", () => {
    postEditModal.style.display = "none";
  });
  postEditSaveBtn.addEventListener("click", async () => {
    const newContent = postEditTextarea.value.trim();
    if (!newContent) { alert("내용을 입력해주세요."); return; }
    try {
      const res = await fetch(`${baseURL}/api/posts/${postId}`, {
        method:  "PATCH",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content: newContent })
      });
      if (!res.ok) throw new Error();
      postEditModal.style.display = "none";
      await fetchPostDetail();
    } catch {
      alert("게시글 수정 중 오류가 발생했습니다.");
    }
  });

  //— Comment edit cancel/save
  commentEditCancelBtn.addEventListener("click", () => {
    editingCommentId = null;
    commentEditModal.style.display = "none";
  });
  commentEditSaveBtn.addEventListener("click", async () => {
    const newText = commentEditTextarea.value.trim();
    if (!newText) { alert("내용을 입력해주세요."); return; }
    try {
      const res = await fetch(`${baseURL}/api/comments/${editingCommentId}`, {
        method:  "PATCH",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content: newText })
      });
      if (!res.ok) throw new Error();
      commentEditModal.style.display = "none";
      editingCommentId = null;
      await fetchPostDetail();
    } catch {
      alert("댓글 수정 중 오류가 발생했습니다.");
    }
  });

  //— Top-bar menu toggle
  topBarBtn.addEventListener("click", e => {
    e.stopPropagation();
    topBarList.style.display = topBarList.style.display === "block" ? "none" : "block";
  });
  document.addEventListener("click", () => topBarList.style.display = "none");

  topBarList.addEventListener("click", async e => {
    e.stopPropagation();
    const action = e.target.className;
    // 상태 변경, 편집, 삭제
    if (action.startsWith("change-")) {
      const status = action.split("-")[1].toUpperCase();
      await changeStatus(status);
    } else if (action === "edit-post") {
      postEditTextarea.value = postContainer.querySelector(".post-content").innerHTML.replace(/<br>/g, "\n");
      postEditModal.style.display = "flex";
    } else if (action === "delete-post") {
      if (!confirm("정말 삭제하시겠습니까?")) return;
      await deletePost();
    }
    topBarList.style.display = "none";
  });

  async function changeStatus(newStatus) {
    try {
      const res = await fetch(`${baseURL}/api/posts/${postId}/status`, {
        method:  "PATCH",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error();
      await fetchPostDetail();
    } catch {
      alert("상태 변경 중 오류가 발생했습니다.");
    }
  }

  async function deletePost() {
    try {
      const res = await fetch(`${baseURL}/api/posts/${postId}`, {
        method:  "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      location.href = "board-store.html";
    } catch {
      alert("게시글 삭제 중 오류가 발생했습니다.");
    }
  }

  //— Fetch & render
  async function fetchPostDetail() {
    try {
      const res = await fetch(`${baseURL}/api/posts/${postId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      renderDetail(data);
    } catch {
      alert("게시글 상세를 불러오는 중 오류가 발생했습니다.");
    }
  }
  fetchPostDetail();

  function renderDetail(data) {
    // Post header
    const isMinePost = data.store_id === myStoreId;
    const statusMap = {
      ACTIVE:   ["Selling",   "badge--active"],
      RESERVED: ["Reserved",  ""],
      COMPLETED:["Completed",""]
    };
    const [statusText, statusClass] = statusMap[data.status] || [data.status, ""];
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
    // Top-bar menu items
    if (isMinePost) {
      const items = [];
      if (data.status !== "ACTIVE")   items.push(`<li class="change-active">Mark as Selling</li>`);
      if (data.status !== "RESERVED") items.push(`<li class="change-reserved">Mark as Reserved</li>`);
      if (data.status !== "COMPLETED")items.push(`<li class="change-completed">Mark as Completed</li>`);
      items.push(`<li class="edit-post">Edit</li>`, `<li class="delete-post">Delete</li>`);
      topBarList.innerHTML = items.join("");
      topBarBtn.style.display = "block";
    } else {
      topBarBtn.style.display = "none";
    }

    // Comments
    commentsContainer.innerHTML = `<h3>Comments</h3>`;
    renderComments(data.comments, commentsContainer, 0);
    bindCommentMenus();
    bindReplyButtons();
  }

  function renderComments(comments, container, depth) {
    comments.forEach(c => {
      const isParent    = depth === 0;
      const isMineComm  = c.user_id === userId && !c.deleted;
      const div         = document.createElement("div");
      div.className     = "comment" + (isParent ? "" : " reply");
      div.dataset.commentId = c.comment_id;

      const menuHtml = isMineComm
        ? `<button class="menu-btn">⋮</button>
           <ul class="menu-list"><li class="edit-comment">Edit</li><li class="delete-comment">Delete</li></ul>`
        : "";

      div.innerHTML = `
        <div class="comment-header">
          <div class="info">
            <div class="comment-author">${c.author_name}</div>
          </div>
          ${menuHtml}
        </div>
        <div class="comment-text">${c.content}</div>
        <div class="timestamp">${c.created_at.replace("T"," ").slice(0,16)}</div>
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
        const old = list.closest(".comment").querySelector(".comment-text").textContent;
        commentEditTextarea.value = old;
        commentEditModal.style.display = "flex";
        commentEditTextarea.focus();
      });
      // Delete comment
      deleteLi.addEventListener("click", async e => {
        e.stopPropagation();
        closeAll();
        if (!confirm("댓글을 삭제하시겠습니까?")) return;
        const cid = list.closest(".comment").dataset.commentId;
        try {
          const res = await fetch(`${baseURL}/api/comments/${cid}`, {
            method:  "DELETE",
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
          currentParentId = null;
          commentInputEl.placeholder = defaultPlaceholder;
          commentInputEl.value = "";
          return;
        }
        currentParentId = btn.closest(".comment").dataset.commentId;
        showMentionBadge(btn.closest(".comment").querySelector(".comment-author").textContent);
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
    });
  }

  commentBtnEl.addEventListener("click", async () => {
    const content = commentInputEl.value.trim();
    if (!content) { alert("내용을 입력해주세요."); return; }
    try {
      const res = await fetch(`${baseURL}/api/comments`, {
        method:  "POST",
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
      commentInputEl.placeholder = defaultPlaceholder;
      await fetchPostDetail();
    } catch {
      alert("댓글 작성 중 오류가 발생했습니다.");
    }
  });

});
