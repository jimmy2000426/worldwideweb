// auth.js - 全局身分驗證與導覽列狀態控制

// 1. 取得當前使用者身分 (預設為 guest)
const userRole = localStorage.getItem('userRole') || 'guest';
const currentPath = window.location.pathname;

// ==========================================
// 任務一：路由保護 (Route Protection)
// ==========================================
// 如果目前頁面是後台 (檔名包含 admin.html)，且身分不是 adminc或barber，立刻踢回首頁
if (currentPath.includes('admin.html') && (userRole !== 'admin' && userRole !== 'barber')) {
    alert(' 權限不足！您沒有存取員工後台的權限。');
    // 使用 replace 而不是 href，這樣使用者按瀏覽器的「上一頁」才不會又卡在無限迴圈
    window.location.replace('index.html'); 
}


// ==========================================
// 任務二：更新前台導覽列按鈕狀態
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    // 抓取前台的導覽列按鈕 (這些 ID 在 index.html )
    const loginBtn = document.getElementById('customerlogin');
    const adminBtn = document.getElementById('adminLogin');
    const logoutBtn = document.getElementById('logoutLogin');
    const myAppointmentsBtn = document.getElementById('myAppointmentsBtn');

    // 根據權限顯示/隱藏按鈕
    if (userRole === 'admin') {
        if(loginBtn) loginBtn.style.display = 'none';
        if(adminBtn) adminBtn.style.display = 'inline-block';
        if(logoutBtn) logoutBtn.style.display = 'inline-block';
        if(myAppointmentsBtn) myAppointmentsBtn.style.display = 'inline-block';
    } else if (userRole === 'customer') {
        if(loginBtn) loginBtn.style.display = 'none';
        if(adminBtn) adminBtn.style.display = 'none';
        if(logoutBtn) logoutBtn.style.display = 'inline-block';
        if(myAppointmentsBtn) myAppointmentsBtn.style.display = 'inline-block';
    } else if (userRole === 'barber') {
        if(loginBtn) loginBtn.style.display = 'none';
        if(adminBtn) adminBtn.style.display = 'inline-block';
        if(logoutBtn) logoutBtn.style.display = 'inline-block';
        if(myAppointmentsBtn) myAppointmentsBtn.style.display = 'inline-block';
    } else {
        if(loginBtn) loginBtn.style.display = 'inline-block';
        if(adminBtn) adminBtn.style.display = 'none';
        if(logoutBtn) logoutBtn.style.display = 'none';
        if(myAppointmentsBtn) myAppointmentsBtn.style.display = 'none'; 
    }

    // --- 以下是前台導覽列按鈕的點擊事件 ---

    // 點擊「登入/註冊」
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            window.location.href = 'login.html';
        });
    }

    // 點擊「管理員」入口
    if (adminBtn) {
        adminBtn.addEventListener('click', function() {
            window.location.href = 'admin.html';
        });
    }

    // 前台「登出」邏輯 (使用精緻的 Modal 轉場)
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            const statusModalEl = document.getElementById('statusModal');
            const statusModalContent = document.getElementById('statusModalContent');
            
            // 如果畫面中有狀態 Modal，就用漂亮的動畫登出
            if (statusModalEl && statusModalContent) {
                const statusModalInstance = bootstrap.Modal.getOrCreateInstance(statusModalEl);
                statusModalContent.innerHTML = `
                    <i class="bi bi-box-arrow-right text-info mb-3" style="font-size: 3.5rem;"></i>
                    <h5 class="text-white fw-bold">已安全登出</h5>
                    <p class="text-light mb-0">期待您的再次光臨！</p>
                `;
                statusModalInstance.show();

                setTimeout(function() {
                    localStorage.removeItem('userRole'); 
                    window.location.reload(); 
                }, 1500);
            } else {
                // 防呆機制：如果頁面剛好沒有 Modal，就用傳統方式登出
                localStorage.removeItem('userRole');
                alert('您已成功登出！');
                window.location.reload();
            }
        });
    }
});
// 動態隱藏管理員專屬元素 (理髮師看不見)
document.addEventListener('DOMContentLoaded', function() {
    if (userRole === 'barber') {
        // 找出所有帶有 admin-only class 的元素並隱藏
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(el => el.style.display = 'none');
    }
});