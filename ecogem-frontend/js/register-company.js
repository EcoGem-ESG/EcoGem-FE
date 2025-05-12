document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.querySelector('input[placeholder="Enter company name"]').value;
    const address = document.querySelector('input[placeholder="Enter address"]').value;
    const managerName = document.querySelector('input[placeholder="Enter contact name"]').value;
    const companyPhone = document.querySelector('input[placeholder="Enter phone number"]').value;

    const selectedWasteTypes = [];
    document.querySelectorAll(".waste-buttons button.selected").forEach(btn => {
      selectedWasteTypes.push(btn.textContent.trim());
    });

    if (!name || !address || !managerName || !companyPhone || selectedWasteTypes.length === 0) {
      alert("모든 필수 항목을 입력해주세요.");
      return;
    }

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");

    try {
      const res = await fetch(`http://localhost:8080/api/companies/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          address,
          managerName,
          companyPhone,
          wasteTypes: selectedWasteTypes
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        alert("업체 등록 완료!");
        localStorage.setItem("status", "COMPLETE"); // 프론트에 상태도 갱신
        location.href = "mypage-company.html"; // 마이페이지로 이동
      } else {
        alert("등록 실패: " + result.message);
      }
    } catch (err) {
      console.error("업체 등록 실패:", err);
      alert("서버 오류가 발생했습니다.");
    }
  });

  // ✅ 폐기물 버튼 선택 토글
  const buttons = document.querySelectorAll(".waste-buttons button");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("selected");
    });
  });
});
