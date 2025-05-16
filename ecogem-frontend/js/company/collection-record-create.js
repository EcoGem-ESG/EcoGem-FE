document.addEventListener('DOMContentLoaded', () => {
  const baseURL = 'http://localhost:8080';
  const token   = localStorage.getItem('token');
  if (!token) {
    alert('Login is required.');
    return;
  }

  const dateInput        = document.getElementById('collection-date');
  const storeNameInput   = document.getElementById('store-name');
  const collectedByInput = document.getElementById('collected-by');
  const quantityInput    = document.getElementById('quantity');
  const unitPriceInput   = document.getElementById('unit-price');
  const totalPriceInput  = document.getElementById('total-price');
  const submitBtn        = document.querySelector('.submit-btn');

  // Calculate total price = quantity * unit price
  function updateTotalPrice() {
    const qty  = parseFloat(quantityInput.value) || 0;
    const unit = parseInt(unitPriceInput.value, 10) || 0;
    totalPriceInput.value = Math.floor(qty * unit);
  }

  quantityInput.addEventListener('input', updateTotalPrice);
  unitPriceInput.addEventListener('input', updateTotalPrice);

  // Handle submit button click
  submitBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!dateInput.value
      || !storeNameInput.value.trim()
      || !collectedByInput.value.trim()
      || !quantityInput.value
      || !unitPriceInput.value
      || !totalPriceInput.value
    ) {
      alert('Please fill in all required fields.');
      return;
    }

    const payload = {
      collected_at:    dateInput.value,
      store_name:      storeNameInput.value.trim(),
      collected_by:    collectedByInput.value.trim(),
      volume_liter:    parseFloat(quantityInput.value),
      price_per_liter: parseInt(unitPriceInput.value, 10),
      total_price:     parseInt(totalPriceInput.value, 10)
    };

    try {
      const res = await fetch(`${baseURL}/api/collection-records`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`
        },
        body:    JSON.stringify(payload)
      });

      const text = await res.text();
      let result = {};
      try {
        result = text ? JSON.parse(text) : {};
      } catch {
        console.error('Failed to parse response JSON:', text);
      }

      if (res.ok && result.success) {
        alert('Collection record successfully added.');
        window.location.href = 'collection-record-company.html';
      } else {
        throw new Error(result.message || res.statusText);
      }
    } catch (err) {
      console.error('Error adding collection record:', err);
      alert(`Error: ${err.message}`);
    }
  });
});
