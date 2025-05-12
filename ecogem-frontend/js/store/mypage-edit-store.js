document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("로그인이 필요합니다.");
    location.href = "../../index.html";
    return;
  }

  // 🔄 기존 정보 불러오기
  try {
    const res = await fetch("http://localhost:8080/api/mypage", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const result = await res.json();
    if (res.ok && result.success) {
      const data = result.data;

      document.getElementById("store-name").value = data.name;
      document.getElementById("store-address").value = data.address;
      document.getElementById("store-phone-number").value = data.storePhone;
      document.getElementById("owner-phone-number").value = data.ownerPhone;
      document.getElementById("oil-emission-type").value = formatDeliveryType(data.deliveryType);

    } else {
      alert("정보를 불러오지 못했습니다.");
    }
  } catch (err) {
    console.error("정보 조회 실패:", err);
    alert("서버 오류가 발생했습니다.");
  }

  // ✅ 폼 제출 이벤트
  const form = document.getElementById("edit-store-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const address = document.getElementById("store-address").value;
    const storePhone = document.getElementById("store-phone-number").value;
    const ownerPhone = document.getElementById("owner-phone-number").value;
    const deliveryTypeText = document.getElementById("oil-emission-type").value;
    const deliveryType = parseDeliveryType(deliveryTypeText);

    if (!address || !storePhone || !ownerPhone || !deliveryType) {
      alert("모든 항목을 입력해주세요.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/mypage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          address,
          storePhone,
          ownerPhone,
          deliveryType
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        alert("정보가 성공적으로 수정되었습니다.");
        location.href = "mypage-store.html";
      } else {
        alert("수정 실패: " + result.message);
      }
    } catch (err) {
      console.error("수정 요청 실패:", err);
      alert("서버 오류가 발생했습니다.");
    }
  });
});

// ✅ "보여지는 글자" → "ENUM 코드" 변환
function parseDeliveryType(text) {
  if (text.includes("Small")) return "SMALL";
  if (text.includes("Medium")) return "MEDIUM";
  if (text.includes("Large")) return "LARGE";
  if (text.includes("One-time")) return "ONETIME";
  return null;
}

// ✅ ENUM 코드 → 보여질 글자
function formatDeliveryType(type) {
  switch (type) {
    case "SMALL": return "Small Emission (1–5L/week)";
    case "MEDIUM": return "Medium Emission (6–20L/week)";
    case "LARGE": return "Large Emission (20L+/week)";
    case "ONETIME": return "One-time Emission";
    default: return type;
  }
}
