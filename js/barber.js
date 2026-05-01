// admin.html 專屬的簡易邏輯
document.addEventListener('DOMContentLoaded', function() {

    // === 新增：動態顯示使用者名稱 ===
    const adminNameDisplay = document.getElementById('adminNameDisplay');
    // 從 localStorage 抓取登入時存的 userName，如果因為某些原因沒抓到，預設顯示 '員工'
    const userName = localStorage.getItem('userName') || '員工';
    
    if (adminNameDisplay) {
        // 將 HTML 中的文字替換成實際登入者的名字
        adminNameDisplay.textContent = userName;
    }
    // ================================


    // 處理登出
    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            const statusModalEl = document.getElementById('statusModal');
            const statusModalContent = document.getElementById('statusModalContent');
            const statusModalInstance = bootstrap.Modal.getOrCreateInstance(statusModalEl);

            statusModalContent.innerHTML = `
                <i class="bi bi-box-arrow-right text-info mb-3" style="font-size: 3.5rem;"></i>
                <h5 class="text-white fw-bold">已安全登出</h5>
                <p class="text-light mb-0">即將返回首頁...</p>
            `;
            statusModalInstance.show();

            setTimeout(function() {
                localStorage.removeItem('userRole'); 
                window.location.href = 'home.html'; // 登出後導回首頁
            }, 1500);
        });
    }

    // 簡易的選單切換視覺效果
    // === 單頁切換 (SPA) 核心邏輯 ===
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    const adminViews = document.querySelectorAll('.admin-view'); // 抓取所有內容區塊
    const pageTitle = document.getElementById('pageTitle');      // 抓取大標題

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); // 阻止 a 標籤預設的跳轉行為

            // 1. 視覺切換：改變側邊欄的亮點 (active)
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            // 2. 更改標題：把被點擊的選單文字，同步到上方大標題
            pageTitle.textContent = this.textContent.trim();

            // 3. 內容切換：先隱藏全部，再顯示目標
            const targetViewName = this.getAttribute('data-view'); // 取得 dashboard, appointments 等名稱
            
            // 隱藏所有的 view
            adminViews.forEach(view => {
                view.style.display = 'none'; 
            });
            
            // 組合出目標 id (例如 view-dashboard)，並將其顯示出來
            const targetView = document.getElementById('view-' + targetViewName);
            if (targetView) {
                targetView.style.display = 'block';
            }
        });
    // === 處理「匯出報表」按鈕點擊事件 ===
    const exportReportBtn = document.getElementById('exportReportBtn');
    
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', function() {
            // 1. 抓取共用的狀態 Modal
            const statusModalEl = document.getElementById('statusModal');
            const statusModalContent = document.getElementById('statusModalContent');
            const statusModalInstance = bootstrap.Modal.getOrCreateInstance(statusModalEl);

            // 2. 塞入轉圈圈的 HTML (模擬報表產生中)
            statusModalContent.innerHTML = `
                <div class="spinner-border text-gold mb-3" role="status" style="width: 3rem; height: 3rem;"></div>
                <h5 class="text-white">報表產生中...</h5>
                <p class="text-muted small mb-0">系統正在彙整營收與預約資料，請稍候</p>
            `;
            
            // 3. 顯示對話框
            statusModalInstance.show();

            // 4. 模擬伺服器處理時間 (延遲 2 秒後顯示成功與下載按鈕)
            setTimeout(function() {
                statusModalContent.innerHTML = `
                    <i class="bi bi-file-earmark-check-fill text-success mb-3" style="font-size: 3.5rem;"></i>
                    <h5 class="text-white fw-bold">報表匯出成功！</h5>
                    <p class="text-light mb-4">檔案 (Weekly_Report.xlsx) 已準備就緒。</p>
                    <button type="button" class="btn w-100" style="background-color: #d4af37; color: #000; font-weight: bold;" data-bs-dismiss="modal">下載檔案</button>
                `;
            }, 2000); // 2000 毫秒 = 2 秒
        });
    }
    // === 處理「新增預約」按鈕點擊事件 ===
    const addReservationBtn = document.getElementById('addreservation');
    
    if (addReservationBtn) {
        addReservationBtn.addEventListener('click', function() {
            // 1. 抓取共用的狀態 Modal
            const statusModalEl = document.getElementById('statusModal');
            const statusModalContent = document.getElementById('statusModalContent');
            const statusModalInstance = bootstrap.Modal.getOrCreateInstance(statusModalEl);

            // 2. 塞入轉圈圈的 HTML (模擬實際處理)
            statusModalContent.innerHTML = `
                <div class="spinner-border text-gold mb-3" role="status" style="width: 3rem; height: 3rem;"></div>
                <h5 class="text-white">新增預約中...</h5>
                <p class="text-muted small mb-0">系統正在處理您的預約請求，請稍候</p>
            `;
            
            // 3. 顯示對話框
            statusModalInstance.show();

            // 4. 模擬伺服器處理時間 (延遲 2 秒後顯示成功與下載按鈕)
            setTimeout(function() {
                statusModalContent.innerHTML = `
                    <i class="bi bi-file-earmark-check-fill text-success mb-3" style="font-size: 3.5rem;"></i>
                    <h5 class="text-white fw-bold">預約新增成功！</h5>
                    <p class="text-light mb-4">您的預約已成功建立。</p>
                    <button type="button" class="btn w-100" style="background-color: #d4af37; color: #000; font-weight: bold;" data-bs-dismiss="modal">確認</button>
                `;
            }, 2000); // 2000 毫秒 = 2 秒
        });
    }
    // === 預約操作 (完成與修改) ===
    
    // 找出頁面上所有的表格主體 (tbody)
    const tbodies = document.querySelectorAll('tbody');
    let currentRowToEdit = null; // 用來記錄目前正在修改哪一列

    // 幫每一個 tbody 綁定點擊事件 (這叫事件委派，效能最好)
    tbodies.forEach(tbody => {
        tbody.addEventListener('click', function(e) {
            const target = e.target;
            const row = target.closest('tr'); // 往上找，確定點擊的是哪一個表格列 (tr)

            if (!row) return;

            // 情況 1：點擊了「完成」按鈕 (btn-success)
            if (target.classList.contains('btn-success') || target.closest('.btn-success')) {
                // 改變狀態欄位 (第5格) 為「已完成」
                const statusCell = row.cells[4];
                statusCell.innerHTML = '<span class="badge bg-secondary">已完成</span>';

                // 改變操作欄位 (第6格) 為「已結帳」且不可點擊
                const actionCell = row.cells[5];
                actionCell.innerHTML = '<button class="btn btn-sm btn-outline-secondary" disabled>已結帳</button>';

                // 呼叫共用提示框
                showStatusModal('<i class="bi bi-check-circle-fill text-success mb-3" style="font-size: 3.5rem;"></i>', '服務已完成', '系統已更新狀態並紀錄營收。');
            }

            // 情況 2：點擊了「修改」按鈕 (btn-outline-light)
            if (target.classList.contains('btn-outline-light') || target.closest('.btn-outline-light')) {
                // 排除點擊到的是「匯出報表」或「新增預約」的按鈕
                if(target.id === 'exportReportBtn' || target.id === 'addreservation') return; 

                currentRowToEdit = row; // 記下要修改的這列

                // 抓取該列目前的資料 (0是時間, 1是名字, 3是設計師)
                const time = row.cells[0].innerText;
                const name = row.cells[1].innerText;
                const designer = row.cells[3].innerText;

                // 將資料填入剛剛做好的 Edit Modal
                document.getElementById('editTime').value = time;
                document.getElementById('editCustomerName').value = name;
                document.getElementById('editDesigner').value = designer;

                // 呼叫 Bootstrap 打開 Edit Modal
                const editModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('editReservationModal'));
                editModal.show();
            }
        });
    });

    // === 儲存修改內容 ===
    const saveEditBtn = document.getElementById('saveEditBtn');
    if (saveEditBtn) {
        saveEditBtn.addEventListener('click', function() {
            if (currentRowToEdit) {
                // 取得表單內新修改的值
                const newTime = document.getElementById('editTime').value;
                const newDesigner = document.getElementById('editDesigner').value;

                // 更新回原本的表格列
                currentRowToEdit.cells[0].innerText = newTime;
                currentRowToEdit.cells[3].innerText = newDesigner;

                // 關閉 Edit Modal
                bootstrap.Modal.getInstance(document.getElementById('editReservationModal')).hide();

                // 呼叫共用提示框顯示成功
                showStatusModal('<i class="bi bi-check-circle-fill text-success mb-3" style="font-size: 3.5rem;"></i>', '修改成功', '預約資訊已更新！');
            }
        });
    }

    // === 抽取共用的狀態提示框邏輯 (讓程式碼更乾淨) ===
    function showStatusModal(iconHtml, title, message) {
        const statusModalEl = document.getElementById('statusModal');
        const statusModalContent = document.getElementById('statusModalContent');
        const statusModalInstance = bootstrap.Modal.getOrCreateInstance(statusModalEl);

        statusModalContent.innerHTML = `
            ${iconHtml}
            <h5 class="text-white fw-bold">${title}</h5>
            <p class="text-light mb-4">${message}</p>
            <button type="button" class="btn w-100" style="background-color: #d4af37; color: #000; font-weight: bold;" data-bs-dismiss="modal">確認</button>
        `;
        statusModalInstance.show();
    }    
    });
});