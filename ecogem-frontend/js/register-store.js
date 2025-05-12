document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 🔽 입력값 수집
    const name = document.getElementById("storeName").value;
    const address = document.getElementById("address").value;
    const storePhone = document.getElementById("storePhone").value;
    const ownerPhone = document.getElementById("ownerPhone").value;

    // 🔽 선택된 emission type 버튼 찾기
    const emissionTypeBtn = document.querySelector(".waste-buttons button.selected");
    const emissionType = emissionTypeBtn ? emissionTypeBtn.textContent.trim() : null;

    // 🔍 필수 입력 체크
    if (!name || !address || !storePhone || !ownerPhone || !emissionType) {
      alert("모든 필수 항목을 입력해주세요.");
      return;
    }

    // 🔐 토큰, userId 가져오기
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");

    try {
      const res = await fetch(`http://localhost:8080/api/stores/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          address,
          storePhone,
          ownerPhone,
          emissionType
        })
      });

      const result = await res.json();

      if (res.ok && result.success) {
        alert("가게 등록 완료!");
        localStorage.setItem("status", "COMPLETE");
        location.href = "home.html"; // 마이페이지로 이동
      } else {
        alert("등록 실패: " + result.message);
      }
    } catch (err) {
      console.error("등록 중 오류 발생:", err);
      alert("서버 통신 오류가 발생했습니다.");
    }
  });

  // ✅ emissionType 버튼 클릭 시 선택 처리
  const buttons = document.querySelectorAll(".waste-buttons button");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });
});
