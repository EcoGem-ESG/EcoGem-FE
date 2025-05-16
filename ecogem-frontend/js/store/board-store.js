document.addEventListener("DOMContentLoaded", () => {
  const baseURL = "http://localhost:8080";
  const token   = localStorage.getItem("token");
  if (!token) {
    alert("Login is required.");
    window.location.href = "../../pages/index.html";
    return;
  }

  const registerBtn = document.querySelector(".register-post-btn");
  const postList    = document.querySelector(".post-list");

  // Navigate to the "Create Post" page when button is clicked
  registerBtn.addEventListener("click", () => {
    window.location.href = "../../pages/register-post.html";
  });

  // Initial load of posts
  fetchPosts();

  /**
   * Fetch the list of posts from the server
   */
  async function fetchPosts() {
    const url = `${baseURL}/api/posts`;
    try {
      console.log("GET", url);
      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type":  "application/json"
        }
      });
      if (!res.ok) throw new Error(res.statusText);
      const { data } = await res.json();
      renderPosts(data || []);
    } catch (err) {
      console.error("Failed to load posts:", err);
      alert("An error occurred while loading posts.");
    }
  }

  /**
   * Render post cards in the UI
   */
  function renderPosts(posts) {
    // Remove existing cards
    postList.querySelectorAll(".post-card").forEach(el => el.remove());

    posts.forEach(p => {
      const card = document.createElement("div");
      card.className = "post-card";

      let badgeText, badgeClass = "badge";
      switch (p.status) {
        case "ACTIVE":
          badgeText = "Selling";
          badgeClass += " badge--active";
          break;
        case "RESERVED":
          badgeText = "Reserved";
          break;
        case "COMPLETED":
          badgeText = "Completed";
          break;
        default:
          badgeText = p.status;
      }

      card.innerHTML = `
        <div class="store-name">${p.store_name}</div>
        <div class="post-content">${p.content}</div>
        <span class="${badgeClass}">${badgeText}</span>
      `;

      // Navigate to post detail on click
      card.addEventListener("click", () => {
        window.location.href = `../../pages/store/post-detail-store.html?postId=${p.post_id}`;
      });

      postList.appendChild(card);
    });
  }
});
