document.addEventListener("DOMContentLoaded", () => {
  const baseURL  = "http://localhost:8080";

  // ▶ Hardcoded for testing (remove after auth integration)
  const storeId  = 1; // Replace with the ID of the logged-in store

  const textarea  = document.getElementById("post-content");
  const submitBtn = document.querySelector(".submit-btn");

  submitBtn.addEventListener("click", async () => {
      const content = textarea.value.trim();
      if (!content) {
          alert("Please enter the post content.");
          textarea.focus();
          return;
      }

      try {
          const res = await fetch(`${baseURL}/api/posts`, {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  store_id: storeId,
                  content:  content
              })
          });

          if (!res.ok) {
              // Handle HTTP errors (400, 500, etc.)
              const errBody = await res.json().catch(() => null);
              console.error("Error response:", res.status, errBody);
              throw new Error(errBody?.message || res.statusText);
          }

          const body = await res.json();
          const newPostId = body.data.post_id;
          // Redirect to the post detail page after successful creation
          window.location.href = `post-detail-store.html?postId=${newPostId}`;

      } catch (err) {
          console.error("Failed to create post:", err);
          alert("An error occurred while creating the post.");
      }
  });
});
