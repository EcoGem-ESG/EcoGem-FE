document.addEventListener("DOMContentLoaded", () => {
  const baseURL     = "http://localhost:8080";
  const token       = localStorage.getItem("token");
  const userId      = Number(localStorage.getItem("user_id"));
  const myStoreId   = Number(localStorage.getItem("store_id"));
  if (!token) {
    alert("Login is required.");
    window.location.href = "../../pages/auth/login.html";
    return;
  }

  // Parse postId from URL
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("postId");
  if (!postId) {
    alert("postId is missing.");
    return;
  }

  // DOM references
  const topBarBtn         = document.querySelector(".top-bar .menu-btn");
  const topBarList        = document.getElementById("post-menu-list");
  const postContainer     = document.getElementById("post-detail-container");
  const commentsContainer = document.getElementById("comments-container");
  const commentInputWrap  = document.querySelector(".comment-input");
  const commentInputEl    = commentInputWrap.querySelector("input");
  const commentBtnEl      = commentInputWrap.querySelector(".submit-btn");
  const defaultPlaceholder = "Enter a comment...";

  // Post edit modal references
  const postEditModal     = document.getElementById("post-edit-modal");
  const postEditTextarea  = document.getElementById("post-edit-textarea");
  const postEditCancelBtn = document.getElementById("post-edit-cancel");
  const postEditSaveBtn   = document.getElementById("post-edit-save");
  // Comment edit modal references
  const commentEditModal     = document.getElementById("comment-edit-modal");
  const commentEditTextarea  = document.getElementById("comment-edit-textarea");
  const commentEditCancelBtn = document.getElementById("comment-edit-cancel");
  const commentEditSaveBtn   = document.getElementById("comment-edit-save");

  let currentParentId  = null;
  let editingCommentId = null;

  // Hide menu initially
  topBarBtn.style.display = "none";

  // Post edit cancel
  postEditCancelBtn.addEventListener("click", () => {
    postEditModal.style.display = "none";
  });

  // Post edit save
  postEditSaveBtn.addEventListener("click", async () => {
    const newContent = postEditTextarea.value.trim();
    if (!newContent) {
      alert("Please enter content.");
      return;
    }
    try {
      const res = await fetch(`${baseURL}/api/posts/${postId}`, {
        method: "PATCH",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content: newContent })
      });
      const errorBody = res.ok ? null : await res.json().catch(() => null);
      if (!res.ok) throw new Error(errorBody?.message || res.statusText);
      postEditModal.style.display = "none";
      await fetchPostDetail();
    } catch (err) {
      console.error("Failed to update post:", err);
      alert(`Error updating post:\n${err.message}`);
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
      alert("Please enter content.");
      return;
    }
    try {
      const res = await fetch(`${baseURL}/api/comments/${editingCommentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content: newText })
      });
      const errorBody = res.ok ? null : await res.json().catch(() => null);
      if (!res.ok) throw new Error(errorBody?.message || res.statusText);
      commentEditModal.style.display = "none";
      editingCommentId = null;
      await fetchPostDetail();
    } catch (err) {
      console.error("Failed to update comment:", err);
      alert(`Error updating comment:\n${err.message}`);
    }
  });

  /** Change post status to ACTIVE/RESERVED/COMPLETED */
  async function changeStatus(newStatus) {
    try {
      const res = await fetch(`${baseURL}/api/posts/${postId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, store_id: myStoreId })
      });
      const errorBody = res.ok ? null : await res.json().catch(() => null);
      if (!res.ok) throw new Error(errorBody?.message || res.statusText);
      await fetchPostDetail();
    } catch (err) {
      console.error("Failed to change status:", err);
      alert(`Error changing status:\n${err.message}`);
    }
  }

  // Toggle top-bar menu
  topBarBtn.addEventListener("click", e => {
    e.stopPropagation();
    topBarList.style.display = topBarList.style.display === "block" ? "none" : "block";
  });
  document.addEventListener("click", () => {
    topBarList.style.display = "none";
  });

  // Handle top-bar menu item clicks
  topBarList.addEventListener("click", async e => {
    e.stopPropagation();
    const t = e.target;
    if (t.matches(".change-active")) {
      await changeStatus("ACTIVE");
    } else if (t.matches(".change-reserved")) {
      await changeStatus("RESERVED");
    } else if (t.matches(".change-completed")) {
      await changeStatus("COMPLETED");
    } else if (t.matches(".edit-post")) {
      const current = postContainer.querySelector(".post-content").innerHTML.replace(/<br>/g, "\n");
      postEditTextarea.value = current;
      postEditModal.style.display = "flex";
      postEditTextarea.focus();
    } else if (t.matches(".delete-post")) {
      if (!confirm("Are you sure you want to delete this post?")) return;
      try {
        const res = await fetch(`${baseURL}/api/posts/${postId}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });
        const errorBody = res.ok ? null : await res.json().catch(() => null);
        if (!res.ok) throw new Error(errorBody?.message || res.statusText);
        window.location.href = "board-store.html";
      } catch (err) {
        console.error("Failed to delete post:", err);
        alert(`Error deleting post:\n${err.message}`);
      }
    }
    topBarList.style.display = "none";
  });

  // Fetch post details and comments
  async function fetchPostDetail() {
    try {
      const res = await fetch(`${baseURL}/api/posts/${postId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(res.statusText);
      const { data } = await res.json();
      renderDetail(data);
    } catch (err) {
      console.error("Failed to load post detail:", err);
      alert("An error occurred while loading post details.");
    }
  }
  fetchPostDetail();

  // Render post header and comments
  function renderDetail(data) {
    const isMine = data.user_id === userId;
    topBarBtn.style.display = isMine ? "block" : "none";

    if (isMine) {
      const items = [];
      if (data.status !== "ACTIVE")    items.push(`<li class="change-active">Mark as Selling</li>`);
      if (data.status !== "RESERVED")  items.push(`<li class="change-reserved">Mark as Reserved</li>`);
      if (data.status !== "COMPLETED") items.push(`<li class="change-completed">Mark as Completed</li>`);
      items.push(`<li class="edit-post">Edit</li>`);
      items.push(`<li class="delete-post">Delete</li>`);
      topBarList.innerHTML = items.join("");
    }

    const statusMap = {
      ACTIVE:    ["Selling",    "badge--active"],
      RESERVED:  ["Reserved",   ""],
      COMPLETED: ["Completed",  ""]
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

    commentsContainer.innerHTML = `<h3>Comments</h3>`;
    renderComments(data.comments, commentsContainer, 0);
    bindCommentMenus();
    bindReplyButtons();
  }

  // Recursive comment and reply rendering
  function renderComments(comments, container, depth) {
    comments.forEach(c => {
      const isParent = depth === 0;
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
        <div class="timestamp">${c.created_at.replace("T"," ").slice(0,16)}</div>
        ${isParent ? `<button class="reply-btn">Reply</button>` : ""}
      `;
      container.appendChild(div);
      if (c.children?.length) renderComments(c.children, container, depth+1);
    });
  }

  // Bind comment menu actions
  function bindCommentMenus() {
    const btns = document.querySelectorAll(".comment .menu-btn");
    const lists = document.querySelectorAll(".comment .menu-list");
    const closeAll = () => lists.forEach(l => l.style.display = "none");

    btns.forEach(b => b.addEventListener("click", e => {
      e.stopPropagation();
      closeAll();
      const ul = b.nextElementSibling;
      ul.style.display = ul.style.display === "block" ? "none" : "block";
    }));

    lists.forEach(list => {
      const editLi = list.querySelector(".edit-comment");
      const deleteLi = list.querySelector(".delete-comment");

      // Edit comment
      editLi.addEventListener("click", e => {
        e.stopPropagation(); closeAll();
        editingCommentId = list.closest(".comment").dataset.commentId;
        commentEditTextarea.value = list.closest(".comment").querySelector(".comment-text").textContent;
        commentEditModal.style.display = "flex";
        commentEditTextarea.focus();
      });

      // Delete comment
      deleteLi.addEventListener("click", async e => {
        e.stopPropagation(); closeAll();
        if (!confirm("Are you sure you want to delete this comment?")) return;
        try {
          const res = await fetch(`${baseURL}/api/comments/${list.closest(".comment").dataset.commentId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!res.ok) throw new Error(res.statusText);
          await fetchPostDetail();
        } catch (err) {
          console.error("Failed to delete comment:", err);
          alert("An error occurred while deleting the comment.");
        }
      });
    });
    document.addEventListener("click", () => lists.forEach(l => l.style.display = "none"));
  }

  // Bind reply button events
  function bindReplyButtons() {
    document.querySelectorAll(".reply-btn").forEach(btn => btn.addEventListener("click", e => {
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
    }));
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

  // Submit new comment or reply
  commentBtnEl.addEventListener("click", async () => {
    const content = commentInputEl.value.trim();
    if (!content) {
      alert("Please enter content.");
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
      if (!res.ok) throw new Error(res.statusText);
      commentInputEl.value = "";
      currentParentId = null;
      const badge = commentInputWrap.querySelector(".mention-badge");
      if (badge) badge.remove();
      commentInputEl.placeholder = defaultPlaceholder;
      await fetchPostDetail();
    } catch (err) {
      console.error("Failed to create comment:", err);
      alert("An error occurred while creating the comment.");
    }
  });
});
