document.addEventListener("DOMContentLoaded", () => {
  const baseURL = "http://localhost:8080";

  // ▶ Hardcoded for testing (remove after auth integration)
  const storeLat  = 37.5000;    // Test latitude
  const storeLng  = 127.0000;   // Test longitude

  const registerBtn = document.querySelector(".register-post-btn");
  const postList    = document.querySelector(".post-list");

  // "Create Post" button click
  registerBtn.addEventListener("click", () => {
    window.location.href = "register-post.html";
  });

  // Initial load
  fetchPosts();

  // Fetch posts
  async function fetchPosts() {
    const url = `${baseURL}/api/posts?lat=${storeLat}&lng=${storeLng}`;
    try {
      console.log("▶ GET", url);
      const res  = await fetch(url);
      const body = await res.json();
      renderPosts(body.data || []);
    } catch (err) {
      console.error("Failed to load posts:", err);
      alert("An error occurred while loading posts.");
    }
  }

  // Render on screen
  function renderPosts(posts) {
    // Remove existing cards
    postList.querySelectorAll(".post-card").forEach(el => el.remove());

    posts.forEach(p => {
      const card = document.createElement("div");
      card.className = "post-card";

      // Determine badge text & class based on status
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

      // Navigate to store post detail on click
      card.addEventListener("click", () => {
        window.location.href = `post-detail-store.html?postId=${p.post_id}`;
      });

      postList.appendChild(card);
    });
  }
});
