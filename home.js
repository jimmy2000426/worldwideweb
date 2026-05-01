// 檢查登入狀態，決定是否開啟預約 Modal
function checkLoginAndBook() {
    // 1. 從瀏覽器讀取目前的使用者權限
    const userRole = localStorage.getItem('userRole');

    // 2. 判斷是否有登入 (如果有值且是 customer 或 admin，代表已登入)
    if (userRole === 'customer' || userRole === 'admin' || userRole === 'barber') {
        
        // 已登入：先重置預約步驟的畫面
        resetBookingSteps(); 
        
        // 呼叫 Bootstrap 的 API 來手動強制打開 Modal
        const modalEl = document.getElementById('bookingModal');
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
        modalInstance.show();

    } else {
        window.location.href = 'login.html'; // 確保這裡的路徑與你的登入頁面一致
    }
}

// 全域變數儲存當前總價
let currentBasePrice = 600; // 預設經典洗剪價格

// 1. 監聽步驟一的服務選擇，更新基礎價格
document.addEventListener('DOMContentLoaded', function() {
    const serviceSelect = document.getElementById('serviceSelect'); // 記得在步驟一的 select 加上這個 ID
    const addonCheckboxes = document.querySelectorAll('.addon-item');

    // 如果找到服務選擇下拉選單 (假設你已在 HTML 中為其加上 id="serviceSelect")
    if (serviceSelect) {
        serviceSelect.addEventListener('change', function() {
            // 根據選擇設定基礎價格 (這可以改用物件或從後端獲取)
            if (this.value === 'cut') currentBasePrice = 600;
            else if (this.value === 'color') currentBasePrice = 1500;
            else if (this.value === 'care') currentBasePrice = 800;
            
            calculateTotal(); // 重新計算總價
        });
    }

    // 2. 監聽所有加購項目的勾選狀態變化
    addonCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            calculateTotal(); // 只要有勾選變化，就重新計算
        });
    });
});

// 計算總金額的共用函式
function calculateTotal() {
    let total = currentBasePrice;
    
    // 找出所有被打勾的加購項目
    const checkedAddons = document.querySelectorAll('.addon-item:checked');
    
    // 將每個加購項目的 value (價格) 加總
    checkedAddons.forEach(addon => {
        total += parseInt(addon.value, 10);
    });

    // 更新畫面上的總金額顯示
    const displayElement = document.getElementById('totalPriceDisplay');
    if (displayElement) {
        displayElement.textContent = `NT$ ${total}`;
    }
}

function goToStep(stepNumber) {
    // === 加入表單驗證邏輯 ===

    // 如果是要前往步驟 3 (代表使用者剛點了步驟 2 的下一步)
    if (stepNumber === 3) {
        const dateInput = document.getElementById('bookingDate');
        // 檢查日期是否有填
        if (!dateInput.value) {
            // 如果沒填：幫 input 加上 'is-invalid' 這個 class
            dateInput.classList.add('is-invalid');
            return; // 終止，停留在這一步
        }else{
            // 如果有填：移除 'is-invalid'，消除紅框與紅字
            dateInput.classList.remove('is-invalid');
            }
        }
    

    // 更新進度條
    const progress = document.getElementById('bookingProgress');
    progress.style.width = (stepNumber * 33.33) + '%';

    // 切換顯示的步驟區塊
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    document.getElementById('step' + stepNumber).classList.add('active');
}

function submitBooking() {
    // === 表單驗證邏輯 (檢查電話) ===
    const phoneInput = document.getElementById('bookingPhone');
    const phoneErrorMsg = document.getElementById('phoneErrorMsg'); // 抓取紅字區塊
    const phoneRegex = /^09\d{8}$/;  //正規表達式

    // 先重置錯誤狀態
    phoneInput.classList.remove('is-invalid');

    if (!phoneInput.value) {
        // 如果沒填：顯示預設錯誤
        phoneErrorMsg.textContent = '請輸入聯絡電話！'; // 這裡結合了 textContent 動態改字
        phoneInput.classList.add('is-invalid');
        return; 
    }

    // 使用 test() 方法來檢查輸入值是否符合正規表達式
    if (!phoneRegex.test(phoneInput.value)) {
        phoneErrorMsg.textContent = '電話格式不正確，請輸入 09 開頭的 10 位數字！'; 
        phoneInput.classList.add('is-invalid');
        return;
    }

    if (phoneInput.value.length < 9) {
        // 如果填錯格式：動態改變紅字內容
        phoneErrorMsg.textContent = '電話格式不正確，請至少輸入9碼！'; 
        phoneInput.classList.add('is-invalid');
        return;
    }
    // =========================

    // 收集資料準備送出
    const totalAmount = document.getElementById('totalPriceDisplay').textContent;
    const selectedAddons = [];
    document.querySelectorAll('.addon-item:checked').forEach(addon => {
        // 抓取 label 的文字作為加購項目名稱
        const labelText = addon.nextElementSibling.textContent;
        selectedAddons.push(labelText);
    });

    // === 3. 畫面切換：隱藏預約表單，顯示轉圈圈對話框 ===
    // 隱藏預約表單 Modal
    const bookingModalEl = document.getElementById('bookingModal');
    const bookingModalInstance = bootstrap.Modal.getInstance(bookingModalEl);
    bookingModalInstance.hide();

    // 抓取新的狀態 Modal 與內容區塊
    const statusModalEl = document.getElementById('statusModal');
    const statusModalContent = document.getElementById('statusModalContent');
    const statusModalInstance = bootstrap.Modal.getOrCreateInstance(statusModalEl);

    // 塞入轉圈圈的 HTML
    statusModalContent.innerHTML = `
        <div class="spinner-border text-gold mb-3" role="status" style="width: 3rem; height: 3rem;"></div>
        <h5 class="text-white">訂單處理中...</h5>
        <p class="text-muted small mb-0">請稍候，正在為您保留專屬時段</p>
    `;
    
    // 顯示狀態 Modal
    statusModalInstance.show();

    // === 4. 模擬伺服器處理時間 (延遲 2 秒後顯示成功) ===
    setTimeout(function() {
        // 整理加購文字
        let addonsText = '';
        if (selectedAddons.length > 0) {
            addonsText = `<div class="text-muted small mt-2">包含加購：${selectedAddons.join(', ')}</div>`;
        }

        // 把轉圈圈替換成「打勾圖示」與「成功訊息」
        statusModalContent.innerHTML = `
            <i class="bi bi-check-circle-fill text-success mb-3" style="font-size: 3.5rem;"></i>
            <h5 class="text-white fw-bold"> 預約成功！</h5>
            <p class="text-light mb-4">系統已發送通知給設計師。<br><strong>${totalAmount}</strong>${addonsText}</p>
            <button type="button" class="btn w-100" style="background-color: #d4af37; color: #000; font-weight: bold;" data-bs-dismiss="modal">完成</button>
        `;
    }, 2000); // 2000 毫秒 = 2 秒
}

// 貼心功能：每次重新打開 Modal 時，把所有紅字紅框清空
function resetBookingSteps() {
    const dateInput = document.getElementById('bookingDate');
    const phoneInput = document.getElementById('bookingPhone');
    
    dateInput.value = '';
    phoneInput.value = '';
    
    // 移除紅框錯誤狀態
    dateInput.classList.remove('is-invalid');
    phoneInput.classList.remove('is-invalid');
    
    // 清空所有加購項目的勾選
    document.querySelectorAll('.addon-item').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // 重置價格顯示 (如果有選擇特定服務，應回到該服務的基礎價)
    currentBasePrice = 600; // 假設預設回 600
    calculateTotal();

    goToStep(1);
}