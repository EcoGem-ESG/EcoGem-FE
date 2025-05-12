document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const loginId = document.querySelector('input[placeholder="Enter username"]').value;
    const pwd = document.querySelector('input[placeholder="Enter password"]').value;
    const confirmPwd = document.querySelector('input[placeholder="Confirm password"]').value;
    const email = document.querySelector('input[placeholder="Enter email"]').value;

    // 역할 버튼 중 선택된 거 찾기
    const roleButtons = document.querySelectorAll(".role-buttons-inline button");
    let role = null;
    roleButtons.forEach((btn) => {
      if (btn.classList.contains("selected")) {
        role = btn.textContent.includes("Store") ? "STORE_OWNER" : "COMPANY_OWNER";
      }
    });

    // 입력 체크
    if (!loginId || !pwd || !confirmPwd || !email || !role) {
      alert("모든 필드를 입력해주세요.");
      return;
    }
    if (pwd !== confirmPwd) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, pwd, email, role })
      });

      const result = await res.json();
      if (res.ok) {
        alert("회원가입 성공! 로그인 페이지로 이동합니다.");
        location.href = "index.html";
      } else {
        alert("회원가입 실패: " + result.message);
      }
    } catch (err) {
      console.error("오류:", err);
      alert("서버 오류가 발생했습니다.");
    }
  });

  // 역할 버튼 클릭 시 selected 토글
  const roleButtons = document.querySelectorAll(".role-buttons-inline button");
  roleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      roleButtons.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });
});
