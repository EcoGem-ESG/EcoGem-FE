document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const loginId = document.getElementById("loginId").value;
    const pwd = document.getElementById("pwd").value;

    if (!loginId || !pwd) {
      alert("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, pwd })
      });

      const result = await res.json();

      if (res.ok && result.success) {
        const { token, role, status, user_id } = result.data;

        // 저장
        localStorage.setItem("token", token);
        localStorage.setItem("role", role);
        localStorage.setItem("status", status);
        localStorage.setItem("user_id", user_id);

        alert("로그인 성공!");

        // ✅ 역할 + 상태에 따라 이동 분기
        if (status === "INCOMPLETE") {
          if (role === "COMPANY_OWNER") {
            location.href = "pages/company/register.html";
          } else if (role === "STORE_OWNER") {
            location.href = "pages/store/register.html";
          }
        } else {
          // COMPLETE → 마이페이지로
          if (role === "COMPANY_OWNER") {
            location.href = "pages/company/home.html";
          } else if (role === "STORE_OWNER") {
            location.href = "pages/store/home.html";
          }
        }
      } else {
        alert("로그인 실패: " + result.message);
      }
    } catch (err) {
      console.error("로그인 요청 실패:", err);
      alert("서버 오류가 발생했습니다.");
    }
  });
});
