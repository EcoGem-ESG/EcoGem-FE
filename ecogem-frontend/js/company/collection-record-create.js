document.addEventListener('DOMContentLoaded', () => {
    // TODO: 실제 로그인된 업체 userId, role 값을 설정
    const userId = 1;
    const role = 'COMPANY_WORKER';
    const baseURL = "http://localhost:8080";

    const dateInput       = document.getElementById('collection-date');
    const storeNameInput  = document.getElementById('store-name');
    const collectedByInput= document.getElementById('collected-by');
    const quantityInput   = document.getElementById('quantity');
    const unitPriceInput  = document.getElementById('unit-price');
    const totalPriceInput = document.getElementById('total-price');
    const submitBtn       = document.querySelector('.submit-btn');
  
    // 수거량 * 단가 → 총금액 자동 계산
    function updateTotalPrice() {
      const qty  = parseFloat(quantityInput.value) || 0;
      const unit = parseInt(unitPriceInput.value, 10) || 0;
      totalPriceInput.value = Math.floor(qty * unit);
    }
  
    quantityInput.addEventListener('input', updateTotalPrice);
    unitPriceInput.addEventListener('input', updateTotalPrice);
  
    // 등록 버튼 클릭 이벤트
    submitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
  
      // 필수 입력값 검증
      if (!dateInput.value || !storeNameInput.value.trim() || !collectedByInput.value.trim()
          || !quantityInput.value || !unitPriceInput.value || !totalPriceInput.value) {
        alert('모든 필수 항목을 입력해주세요.');
        return;
      }
  
      // 요청 바디 구성
      const payload = {
        collected_at:    dateInput.value,
        store_name:      storeNameInput.value.trim(),
        collected_by:    collectedByInput.value.trim(),
        volume_liter:    parseFloat(quantityInput.value),
        price_per_liter: parseInt(unitPriceInput.value, 10),
        total_price:     parseInt(totalPriceInput.value, 10)
      };
  
      try {
        const response = await fetch(
          `${baseURL}/api/collection-records?user_id=${userId}&role=${role}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }
        );
  
        const text = await response.text();
  let result;
  try {
    result = text ? JSON.parse(text) : {};
  } catch (parseError) {
    console.error('Failed to parse JSON:', text);
    result = {};
  }
        if (response.ok && result.success) {
          alert('수거기록이 성공적으로 등록되었습니다.');
          // 등록 후 목록 페이지로 이동
          window.location.href = 'collection-record-company.html';
        } else {
          throw new Error(result.message || '등록에 실패했습니다.');
        }
      } catch (err) {
        console.error(err);
        alert(`오류 발생: ${err.message}`);
      }
    });
  });
  