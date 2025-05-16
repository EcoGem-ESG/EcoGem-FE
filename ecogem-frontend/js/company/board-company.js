document.addEventListener("DOMContentLoaded", () => {
  const baseURL = "http://localhost:8080";

  // Assume JWT token was stored in localStorage upon login
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Login is required.");
    return;
  }

  const rangeSelect = document.querySelector(".range-select");
  const dropdown    = document.querySelector(".dropdown");
  const postList    = document.querySelector(".post-list");
  let currentRadius = null; // null = All

  // Initialize dropdown
  dropdown.style.display = "none";
  const resetLi = document.createElement("li");
  resetLi.textContent = "All";
  dropdown.prepend(resetLi);
  const radiusItems = dropdown.querySelectorAll("li");
  
  // 1) Toggle dropdown
  rangeSelect.addEventListener("click", e => {
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    e.stopPropagation();
  });
  document.addEventListener("click", () => {
    dropdown.style.display = "none";
  });

  // 2) Select radius
  radiusItems.forEach(li => {
    li.addEventListener("click", () => {
      if (li.textContent === "All") {
        currentRadius = null;
        rangeSelect.firstChild.textContent = "Select Radius ⌄";
      } else {
        currentRadius = parseInt(li.textContent, 10);
        rangeSelect.firstChild.textContent = `${currentRadius} km ⌄`;
      }
      dropdown.style.display = "none";
      fetchPosts();
    });
  });

  // 3) Fetch posts
  async function fetchPosts() {
    let url = `${baseURL}/api/posts`;
    if (currentRadius) {
      url += `?radius=${currentRadius}`;
    }

    try {
      console.log("GET", url);
      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type":  "application/json"
        }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || res.statusText);
      }
      const body = await res.json();
      renderPosts(body.data || []);
    } catch (err) {
      console.error("Failed to load posts:", err);
      alert("Failed to load posts.");
    }
  }

  // 4) Render posts
  function renderPosts(posts) {
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
      card.addEventListener("click", () => {
        location.href = `post-detail-company.html?postId=${p.post_id}`;
      });
      postList.appendChild(card);
    });
  }

  // Initial load
  fetchPosts();
});
