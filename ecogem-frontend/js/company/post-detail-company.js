document.addEventListener("DOMContentLoaded", () => {
  const baseURL = "http://localhost:8080";

  // ▶ Hardcoded for testing (remove after auth integration)
  const userId   = 1;
  const userRole = "COMPANY_WORKER";

  // 1) Parse postId from URL
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("postId");
  if (!postId) {
    alert("postId is missing.");
    return;
  }

  // — DOM references —
  const postContainer       = document.getElementById("post-detail-container");
  const commentsContainer   = document.getElementById("comments-container");
  const commentInputWrap    = document.querySelector(".comment-input");
  const commentInputEl      = commentInputWrap.querySelector("input");
  const commentBtnEl        = commentInputWrap.querySelector(".submit-btn");
  const defaultPlaceholder  = "Enter a comment...";

  // Comment edit modal
  const commentEditModal     = document.getElementById("comment-edit-modal");
  const commentEditTextarea  = document.getElementById("comment-edit-textarea");
  const commentEditCancelBtn = document.getElementById("comment-edit-cancel");
  const commentEditSaveBtn   = document.getElementById("comment-edit-save");

  // state
  let currentParentId  = null;
  let editingCommentId = null;

  // — Bind comment edit modal —
  commentEditCancelBtn.addEventListener("click", () => {
    editingCommentId = null;
    commentEditModal.style.display = "none";
  });
  commentEditSaveBtn.addEventListener("click", async () => {
    const newText = commentEditTextarea.value.trim();
    if (!newText) {
      alert("Please enter content.");
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
      if (!res.ok) throw new Error(body.message || res.statusText);

      commentEditModal.style.display = "none";
      editingCommentId = null;
      await fetchPostDetail();   // reload details
    } catch (err) {
      console.error("Comment update failed:", err);
      alert("An error occurred while updating the comment.");
    }
  });

  // 2) Fetch post detail
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
      console.error("Failed to load post detail:", err);
      alert("An error occurred while loading post details.");
    }
  }

  // 3) Render detail
  function renderDetail(data) {
    // — Post section —
    let statusClass = "", statusText = "";
    switch (data.status) {
      case "ACTIVE":    statusText = "Selling";   statusClass = "badge--active"; break;
      case "RESERVED":  statusText = "Reserved";                       break;
      case "COMPLETED": statusText = "Completed";                      break;
      default:           statusText = data.status;
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

    // — Comments section —
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
          <div class="profile-icon"></div>
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

  // Bind comment ⋮ menu and edit/delete actions
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
      // Edit
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
      // Delete
      deleteLi.addEventListener("click", async e => {
        e.stopPropagation();
        closeAll();
        const commentId = list.closest(".comment").dataset.commentId;
        if (!confirm("Are you sure you want to delete this comment?")) return;
        try {
          const res = await fetch(
            `${baseURL}/api/comments/${commentId}?user_id=${userId}`, {
              method: "DELETE"
            }
          );
          if (!res.ok) throw new Error(res.statusText);
          await fetchPostDetail();
        } catch (err) {
          console.error("Comment delete failed:", err);
          alert("An error occurred while deleting the comment.");
        }
      });
    });

    // Close menus on outside click
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
    badge.querySelector(".remove-mention")
      .addEventListener("click", () => {
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
      await fetchPostDetail();
    } catch (err) {
      console.error("Comment creation failed:", err);
      alert("An error occurred while creating the comment.");
    }
  });

});
