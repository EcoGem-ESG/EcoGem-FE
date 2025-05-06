document.addEventListener("DOMContentLoaded", () => {
    const baseURL = "http://localhost:8080";
  
    // ▶ 테스트용 하드코딩 (인증 연동 후 제거)
    const storeId  = 1; // 실제로는 로그인된 가게의 ID를 여기에 할당
  
    const textarea  = document.getElementById("post-content");
    const submitBtn = document.querySelector(".submit-btn");
  
    submitBtn.addEventListener("click", async () => {
      const content = textarea.value.trim();
      if (!content) {
        alert("게시글 내용을 입력해주세요.");
        textarea.focus();
        return;
      }
  
      try {
        const res = await fetch(`${baseURL}/api/posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            store_id: storeId,
            content:  content
          })
        });
  
        if (!res.ok) {
          // 서버가 400/500 등을 응답했을 때
          const errBody = await res.json().catch(() => null);
          console.error("응답 오류:", res.status, errBody);
          throw new Error(errBody?.message || res.statusText);
        }
  
        const body = await res.json();
        const newId = body.data.post_id;
        // 작성 성공 후 상세 페이지로 이동
        location.href = `post-detail-store.html?postId=${newId}`;
  
      } catch (err) {
        console.error("게시글 등록 실패:", err);
        alert("게시글 등록 중 오류가 발생했습니다.");
      }
    });
  });
  