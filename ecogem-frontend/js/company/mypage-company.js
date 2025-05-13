document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("로그인이 필요합니다.");
    location.href = "../../index.html";
    return;
  }

  try {
    const res = await fetch("http://localhost:8080/api/mypage", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const result = await res.json();

    if (res.ok && result.success) {
      const data = result.data;

      // 회사명
      document.querySelector(".company-name").textContent = data.name;

      // Info 항목들 (0: 주소, 1: 관리자, 2: 폐기물 종류, 3: 전화번호)
      const items = document.querySelectorAll(".info-item");
      items[0].textContent = data.address;
      items[1].textContent = data.managerName;
      items[2].textContent = data.wasteTypes.join(", ");
      items[3].textContent = data.companyPhone;
    } else {
      alert("회사 정보를 불러오지 못했습니다.");
    }
  } catch (err) {
    console.error("마이페이지 조회 실패:", err);
    alert("서버 오류가 발생했습니다.");
  }
});
