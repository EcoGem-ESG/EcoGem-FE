document.addEventListener("DOMContentLoaded", () => {
  const baseURL = "http://localhost:8080";

  // ▶ Hardcoded for testing (remove after auth integration)
  const userId    = 2;
  const userRole  = "STORE_OWNER";
  const myStoreId = 1;   // ← Replace with actual store ID from API

  // Parse postId from URL
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("postId");
  if (!postId) {
    alert("postId is missing.");
    return;
  }

  // — DOM References —
  const topBarBtn         = document.querySelector(".top-bar .menu-btn");
  const topBarList        = document.getElementById("post-menu-list");
  const postContainer     = document.getElementById("post-detail-container");
  const commentsContainer = document.getElementById("comments-container");
  const commentInputWrap  = document.querySelector(".comment-input");
  const commentInputEl    = commentInputWrap.querySelector("input");
  const commentBtnEl      = commentInputWrap.querySelector(".submit-btn");
  const defaultPlaceholder = "Enter a comment...";

  // Modals
  // Post edit modal
  const postEditModal       = document.getElementById("post-edit-modal");
  const postEditTextarea    = document.getElementById("post-edit-textarea");
  const postEditCancelBtn   = document.getElementById("post-edit-cancel");
  const postEditSaveBtn     = document.getElementById("post-edit-save");
  // Comment edit modal
  const commentEditModal     = document.getElementById("comment-edit-modal");
  const commentEditTextarea  = document.getElementById("comment-edit-textarea");
  const commentEditCancelBtn = document.getElementById("comment-edit-cancel");
  const commentEditSaveBtn   = document.getElementById("comment-edit-save");

  // State for replies/comments
  let currentParentId    = null;
  let editingCommentId   = null;

  // Post edit modal cancel
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
      const res = await fetch(
        `${baseURL}/api/posts/${postId}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ store_id: myStoreId, content: newContent })
        }
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || res.statusText);
      postEditModal.style.display = "none";
      fetchPostDetail();
    } catch (err) {
      console.error("Failed to update post:", err);
      alert("An error occurred while updating the post:\n" + err.message);
    }
  });

  // Comment edit modal cancel
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
      const res = await fetch(
        `${baseURL}/api/comments/${editingCommentId}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ user_id: userId, content: newText })
        }
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || res.statusText);
      commentEditModal.style.display = "none";
      editingCommentId = null;
      fetchPostDetail();
    } catch (err) {
      console.error("Failed to update comment:", err);
      alert("An error occurred while updating the comment.");
    }
  });

  // Function to change post status
  async function changeStatus(newStatus) {
    try {
      const res = await fetch(
        `${baseURL}/api/posts/${postId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ store_id: myStoreId, status: newStatus })
        }
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || res.statusText);
      await fetchPostDetail();
    } catch (err) {
      console.error("Failed to change status:", err);
      alert("An error occurred while changing status:\n" + err.message);
    }
  }

  // Top-bar menu toggle and event delegation
  topBarBtn.addEventListener("click", e => {
    e.stopPropagation();
    topBarList.style.display = topBarList.style.display === "block" ? "none" : "block";
  });
  document.addEventListener("click", () => {
    topBarList.style.display = "none";
  });
  topBarList.addEventListener("click", async e => {
    e.stopPropagation();
    const target = e.target;
    if (target.matches(".change-active")) {
      changeStatus("ACTIVE");
    } else if (target.matches(".change-reserved")) {
      changeStatus("RESERVED");
    } else if (target.matches(".change-completed")) {
      changeStatus("COMPLETED");
    } else if (target.matches(".edit-post")) {
      // Open post edit modal
      const current = postContainer.querySelector(".post-content").innerHTML.replace(/<br>/g, "\n");
      postEditTextarea.value = current;
      postEditModal.style.display = "flex";
      postEditTextarea.focus();
    } else if (target.matches(".delete-post")) {
      // Delete post
      if (!confirm("Are you sure you want to delete this post?")) return;
      try {
        const res2 = await fetch(
          `${baseURL}/api/posts/${postId}?storeId=${myStoreId}`, { method: "DELETE" }
        );
        const body2 = await res2.json();
        if (!res2.ok) throw new Error(body2.message || res2.statusText);
        location.href = "board-store.html";
      } catch (err) {
        console.error("Failed to delete post:", err);
        alert("An error occurred while deleting the post:\n" + err.message);
      }
    }
    topBarList.style.display = "none";
  });

  // Fetch post detail on load
  fetchPostDetail();
  async function fetchPostDetail() {
    try {
      const res = await fetch(
        `${baseURL}/api/posts/${postId}?user_id=${userId}&role=${userRole}`
      );
      const { data } = await res.json();
      renderDetail(data);
    } catch (err) {
      console.error("Failed to load post detail:", err);
      alert("An error occurred while loading post details.");
    }
  }

  // Render post and comments
  function renderDetail(data) {
    // Show or hide top-bar menu based on ownership
    const isMine = userRole === "STORE_OWNER" && data.store_id === myStoreId;
    if (isMine) {
      const items = [];
      if (data.status !== "ACTIVE")    items.push(`<li class="change-active">Mark as Selling</li>`);
      if (data.status !== "RESERVED")  items.push(`<li class="change-reserved">Mark as Reserved</li>`);
      if (data.status !== "COMPLETED") items.push(`<li class="change-completed">Mark as Completed</li>`);
      items.push(`<li class="edit-post">Edit</li>`);
      items.push(`<li class="delete-post">Delete</li>`);
      topBarList.innerHTML = items.join("");
      topBarBtn.style.display = "block";
    } else {
      topBarBtn.style.display = "none";
      topBarList.style.display = "none";
    }

    // Render post section
    let statusClass = "", statusText = "";
    switch (data.status) {
      case "ACTIVE":    statusText = "Selling";   statusClass = "badge--active"; break;
      case "RESERVED":  statusText = "Reserved";                      break;
      case "COMPLETED": statusText = "Completed";                     break;
      default:           statusText = data.status;
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

    // Render comments section
    commentsContainer.innerHTML = `<h3>Comments</h3>`;
    renderComments(data.comments, commentsContainer, 0);

    bindCommentMenus();
    bindReplyButtons();
  }

  // Recursive render for comments and replies
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
           <ul class="menu-list"><li>Edit</li><li>Delete</li></ul>`
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
    const btns  = document.querySelectorAll(".comment .menu-btn");
    const lists = document.querySelectorAll(".comment .menu-list");
    const closeAll = () => lists.forEach(l => l.style.display = "none");

    btns.forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const ul = btn.nextElementSibling;
        const isOpen = ul.style.display === "block";
        closeAll();
        ul.style.display = isOpen ? "none" : "block";
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
        if (!confirm("Are you sure you want to delete this comment?")) return;
        try {
          const res = await fetch(
            `${baseURL}/api/comments/${commentId}?user_id=${userId}`, { method: "DELETE" }
          );
          if (!res.ok) throw new Error(res.statusText);
          fetchPostDetail();
        } catch (err) {
          console.error("Failed to delete comment:", err);
          alert("An error occurred while deleting the comment.");
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
      alert("Please enter content.");
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
      fetchPostDetail();
    } catch (err) {
      console.error("Failed to create comment:", err);
      alert("An error occurred while creating the comment.");
    }
  });

});