document.addEventListener("DOMContentLoaded", () => {
    const baseURL     = "http://localhost:8080";
    const submitBtn   = document.querySelector(".submit-btn");
    const storeNameEl = document.getElementById("store-name");
    const addressEl   = document.getElementById("store-location");
    const phoneEl     = document.getElementById("store-phone");
    const ownerEl     = document.getElementById("store-owner-phone");
  
    // ▶ 테스트용 하드코딩 (실제 인증 로직 연동 후 제거)
    const userId   = 1;
    const userRole = "COMPANY_WORKER";
  
    submitBtn.addEventListener("click", async (e) => {
      e.preventDefault();
  
      const storeName  = storeNameEl.value.trim();
      const address    = addressEl.value.trim();
      const storePhone = phoneEl.value.trim();
      const ownerPhone = ownerEl.value.trim();
  
      if (!storeName) {
        alert("가게 이름은 필수 입력 항목입니다.");
        storeNameEl.focus();
        return;
      }
  
      const payload = {
        store_name:  storeName,
        address:     address,
        store_phone: storePhone,
        owner_phone: ownerPhone
      };
  
      const url = `${baseURL}/api/contracts/stores`
                + `?user_id=${userId}&role=${userRole}`;
  
      try {
        console.log("▶ POST", url, payload);
        const res = await fetch(url, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload)
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`${res.status} ${res.statusText}: ${errText}`);
        }
        alert("계약한 가게 리스트에 성공적으로 추가되었습니다.");
        // 목록 페이지로 돌아가기
        window.location.href = "store-list.html";
      } catch (err) {
        console.error(err);
        alert("가게 추가 중 오류가 발생했습니다.");
      }
    });
  });
  