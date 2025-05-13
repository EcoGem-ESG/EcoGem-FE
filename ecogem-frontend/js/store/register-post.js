document.addEventListener("DOMContentLoaded", () => {
  const baseURL  = "http://localhost:8080";
  const token    = localStorage.getItem("token");
  if (!token) {
    alert("로그인이 필요합니다.");
    location.href = "../../pages/auth/login.html";
    return;
  }

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
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        console.error("Error response:", res.status, errBody);
        throw new Error(errBody?.message || res.statusText);
      }

      const { data } = await res.json();
      const newPostId = data.post_id;
      window.location.href = `post-detail-store.html?postId=${newPostId}`;

    } catch (err) {
      console.error("Failed to create post:", err);
      alert("An error occurred while creating the post.");
    }
  });
});
