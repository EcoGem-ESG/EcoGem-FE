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

      document.querySelector(".company-name").textContent = data.name;
      document.querySelectorAll(".info-item")[0].textContent = data.address;
      document.querySelectorAll(".info-item")[1].textContent = data.managerName;
      document.querySelectorAll(".info-item")[2].textContent = data.wasteTypes.join(", ");
      document.querySelectorAll(".info-item")[3].textContent = data.companyPhone;

    } else {
      alert("회사 정보를 불러오지 못했습니다.");
    }
  } catch (err) {
    console.error("마이페이지 조회 실패:", err);
    alert("서버 오류가 발생했습니다.");
  }
});
