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

      // HTML 요소에 값 넣기
      document.querySelector(".store-name").textContent = data.name;
      document.querySelectorAll(".info-item")[0].textContent = data.address;
      document.querySelectorAll(".info-item")[1].textContent = data.storePhone;
      document.querySelectorAll(".info-item")[2].textContent = data.ownerPhone;
      document.querySelectorAll(".info-item")[3].textContent = formatDeliveryType(data.deliveryType);

    } else {
      alert("마이페이지 정보를 불러오지 못했습니다.");
    }
  } catch (err) {
    console.error("마이페이지 요청 실패:", err);
    alert("서버 오류가 발생했습니다.");
  }
});

function formatDeliveryType(type) {
  switch (type) {
    case "SMALL": return "Small Emission (1–5L/week)";
    case "MEDIUM": return "Medium Emission (6–20L/week)";
    case "LARGE": return "Large Emission (20L+/week)";
    case "ONETIME": return "One-time Emission";
    default: return type;
  }
}
