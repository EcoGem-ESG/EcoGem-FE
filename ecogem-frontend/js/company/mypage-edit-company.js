document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("로그인이 필요합니다.");
    location.href = "../../index.html";
    return;
  }

  // 기존 정보 불러오기
  try {
    const res = await fetch("http://localhost:8080/api/mypage", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const result = await res.json();
    if (res.ok && result.success) {
      const data = result.data;

      document.getElementById("company-name").value = data.name;
      document.getElementById("company-address").value = data.address;
      document.getElementById("contact-name").value = data.managerName;
      document.getElementById("waste-types").value = data.wasteTypes.join(", ");
      document.getElementById("phone-number").value = data.companyPhone;

    } else {
      alert("회사 정보를 불러오지 못했습니다.");
    }
  } catch (err) {
    console.error("정보 조회 실패:", err);
    alert("서버 오류가 발생했습니다.");
  }

  // 수정 제출
  const form = document.getElementById("edit-company-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const address = document.getElementById("company-address").value;
    const managerName = document.getElementById("contact-name").value;
    const companyPhone = document.getElementById("phone-number").value;
    const wasteTypes = document.getElementById("waste-types").value
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch("http://localhost:8080/api/mypage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ address, managerName, companyPhone, wasteTypes })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        alert("정보가 수정되었습니다.");
        location.href = "mypage-company.html";
      } else {
        alert("수정 실패: " + result.message);
      }
    } catch (err) {
      console.error("수정 요청 실패:", err);
      alert("서버 오류가 발생했습니다.");
    }
  });
});
