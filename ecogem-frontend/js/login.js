document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const loginId = document.getElementById("loginId").value.trim();
    const pwd     = document.getElementById("pwd").value.trim();

    if (!loginId || !pwd) {
      alert("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ loginId, pwd })
      });

      const result = await res.json();

      if (res.ok && result.success) {
        const { token, role, status, user_id } = result.data;

        // 토큰·유저 정보 저장
        localStorage.setItem("token",   token);
        localStorage.setItem("role",    role);
        localStorage.setItem("status",  status);
        localStorage.setItem("user_id", user_id);

        // 상태+역할에 따라 분기
        if (status === "INCOMPLETE") {
          if (role === "COMPANY_WORKER") {
            location.href = "../pages/company/register-company.html";
          } else if (role === "STORE_OWNER") {
            location.href = "../pages/store/register-store.html";
          }
        } else {
          if (role === "COMPANY_WORKER") {
            location.href = "../pages/company/board-company.html";
          } else if (role === "STORE_OWNER") {
            location.href = "../pages/store/board-store.html";
          }
        }
      } else {
        alert("로그인 실패: " + (result.message || res.statusText));
      }
    } catch (err) {
      console.error("로그인 요청 실패:", err);
      alert("서버 오류가 발생했습니다.");
    }
  });
});
