document.addEventListener("DOMContentLoaded", () => {
    const baseURL = "http://localhost:8080";

    // ▶ Hardcoded for testing (remove before auth integration)
    const userId = 1;
    const userRole = "COMPANY_WORKER";
    const companyLat = 37.5000;   // Test latitude
    const companyLng = 127.0000;  // Test longitude

    const rangeSelect = document.querySelector(".range-select");
    const dropdown = document.querySelector(".dropdown");
    const postList = document.querySelector(".post-list");

    let currentRadius = null;   // null = all

    // 0) Hide dropdown & add 'All' option
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
    document.addEventListener("click", () => dropdown.style.display = "none");

    // 2) Select radius or 'All'
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
        let url = `${baseURL}/api/posts`
            + `?lat=${companyLat}&lng=${companyLng}`
            + `&user_id=${userId}&role=${userRole}`;
        if (currentRadius) {
            url += `&radius=${currentRadius}`;
        }

        try {
            console.log("▶ GET", url);
            const res = await fetch(url);
            const body = await res.json();
            renderPosts(body.data || []);
        } catch (err) {
            console.error("Failed to load posts:", err);
            alert("An error occurred while loading posts.");
        }
    }

    // 4) Render posts
    function renderPosts(posts) {
        // Remove existing cards
        postList.querySelectorAll(".post-card").forEach(el => el.remove());

        posts.forEach(p => {
            const card = document.createElement("div");
            card.className = "post-card";

            // Map status to badge text & class
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

            // Navigate to detail page
            card.addEventListener("click", () => {
                location.href = `post-detail-company.html?postId=${p.post_id}`;
            });

            postList.appendChild(card);
        });
    }

    // Initial load
    fetchPosts();
});