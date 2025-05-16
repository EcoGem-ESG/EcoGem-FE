document.addEventListener("DOMContentLoaded", () => {
  const baseURL = "http://localhost:8080";
  const token   = localStorage.getItem("token");
  const userId  = Number(localStorage.getItem("user_id"));
  if (!token || !userId) {
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
  const defaultPlaceholder= "Enter a comment...";

  // Post edit modal
  const postEditModal     = document.getElementById("post-edit-modal");
  const postEditTextarea  = document.getElementById("post-edit-textarea");
  const postEditCancelBtn = document.getElementById("post-edit-cancel");
  const postEditSaveBtn   = document.getElementById("post-edit-save");
  // Comment edit modal
  const commentEditModal     = document.getElementById("comment-edit-modal");
  const commentEditTextarea  = document.getElementById("comment-edit-textarea");
  const commentEditCancelBtn = document.getElementById("comment-edit-cancel");
  const commentEditSaveBtn   = document.getElementById("comment-edit-save");

  let currentParentId  = null;
  let editingCommentId = null;

  // Initially hide the top-bar menu
  topBarBtn.style.display = "none";

  // Bind post edit modal buttons
  postEditCancelBtn.addEventListener("click", () => postEditModal.style.display = "none");
  postEditSaveBtn.addEventListener("click", async () => {
    const newContent = postEditTextarea.value.trim();
    if (!newContent) { alert("Please enter content."); return; }
    try {
      const res = await fetch(`${baseURL}/api/posts/${postId}`, {
        method: "PATCH",
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
      alert("An error occurred while updating the post.");
    }
  });

  // Bind comment edit modal buttons
  commentEditCancelBtn.addEventListener("click", () => {
    editingCommentId = null;
    commentEditModal.style.display = "none";
  });
  commentEditSaveBtn.addEventListener("click", async () => {
    const newText = commentEditTextarea.value.trim();
    if (!newText) { alert("Please enter content."); return; }
    try {
      const res = await fetch(`${baseURL}/api/comments/${editingCommentId}`, {
        method: "PATCH",
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
      alert("An error occurred while updating the comment.");
    }
  });

  // Toggle top-bar menu
  topBarBtn.addEventListener("click", e => {
    e.stopPropagation();
    topBarList.style.display = topBarList.style.display === "block" ? "none" : "block";
  });
  document.addEventListener("click", () => topBarList.style.display = "none");

  topBarList.addEventListener("click", async e => {
    e.stopPropagation();
    const cls = e.target.className;
    if (cls.startsWith("change-")) {
      const status = cls.split("-")[1].toUpperCase();
      await changeStatus(status);
    } else if (cls === "edit-post") {
      // Open post edit modal
      postEditTextarea.value = postContainer.querySelector(".post-content").innerHTML.replace(/<br>/g, "\n");
      postEditModal.style.display = "flex";
    } else if (cls === "delete-post") {
      if (!confirm("Are you sure you want to delete this post?")) return;
      await deletePost();
    }
    topBarList.style.display = "none";
  });

  async function changeStatus(newStatus) {
    try {
      const res = await fetch(`${baseURL}/api/posts/${postId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error();
      await fetchPostDetail();
    } catch {
      alert("An error occurred while changing status.");
    }
  }

  async function deletePost() {
    try {
      const res = await fetch(`${baseURL}/api/posts/${postId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      location.href = "board-company.html";
    } catch {
      alert("An error occurred while deleting the post.");
    }
  }

  async function fetchPostDetail() {
    try {
      const res = await fetch(`${baseURL}/api/posts/${postId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      renderDetail(data);
    } catch {
      alert("An error occurred while loading post details.");
    }
  }
  fetchPostDetail();

  function renderDetail(data) {
    // Check ownership
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

    // Render comments
    commentsContainer.innerHTML = `<h3>Comments</h3>`;
    renderComments(data.comments, commentsContainer, 0);
    bindCommentMenus();
    bindReplyButtons();
  }

  function renderComments(comments, container, depth) {
    comments.forEach(c => {
      const isParent   = depth === 0;
      const isMineComm = c.user_id === userId && !c.deleted;
      const div        = document.createElement("div");
      div.className    = "comment" + (isParent ? "" : " reply");
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

  function bindCommentMenus() {
    const btns  = document.querySelectorAll(".comment .menu-btn");
    const lists = document.querySelectorAll(".comment .menu-list");
    const closeAll = () => lists.forEach(l => l.style.display = "none");

    btns.forEach(b => {
      b.addEventListener("click", e => {
        e.stopPropagation();
        closeAll();
        const ul = b.nextElementSibling;
        ul.style.display = ul.style.display === "block" ? "none" : "block";
      });
    });

    lists.forEach(list => {
      const [editLi, deleteLi] = list.children;
      editLi.addEventListener("click", async e => {
        e.stopPropagation(); closeAll();
        editingCommentId = list.closest(".comment").dataset.commentId;
        commentEditTextarea.value = list.closest(".comment").querySelector(".comment-text").textContent;
        commentEditModal.style.display = "flex";
      });
      deleteLi.addEventListener("click", async e => {
        e.stopPropagation(); closeAll();
        if (!confirm("Are you sure you want to delete this comment?")) return;
        try {
          const res = await fetch(`${baseURL}/api/comments/${list.closest(".comment").dataset.commentId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!res.ok) throw new Error();
          await fetchPostDetail();
        } catch {
          alert("An error occurred while deleting the comment.");
        }
      });
    });
    document.addEventListener("click", () => lists.forEach(l => l.style.display = "none"));
  }

  function bindReplyButtons() {
    document.querySelectorAll(".reply-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        // mention badge logic goes here
      });
    });
  }

  // Create a new comment
  commentBtnEl.addEventListener("click", async () => {
    const content = commentInputEl.value.trim();
    if (!content) { alert("Please enter content."); return; }
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
      commentInputEl.placeholder = defaultPlaceholder;
      await fetchPostDetail();
    } catch {
      alert("An error occurred while creating the comment.");
    }
  });

});
