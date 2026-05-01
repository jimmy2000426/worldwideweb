function loginValidation(){      
    document.addEventListener('DOMContentLoaded', function() {
    const submitLoginBtn = document.getElementById('submitLoginBtn');
    
    // 確保這段程式碼只在有登入按鈕的頁面(login.html)執行
    if (submitLoginBtn) {
        submitLoginBtn.addEventListener('click', function() {
            const accountInput = document.getElementById('loginAccount');
            const passwordInput = document.getElementById('loginPassword');
            const accountError = document.getElementById('loginAccountError');
            const passwordError = document.getElementById('loginPasswordError');

            // 1. 初始化：先移除所有錯誤紅框
            accountInput.classList.remove('is-invalid');
            passwordInput.classList.remove('is-invalid');

            let isValid = true;

            // 2. 驗證帳號 (必須是信箱格式 或 09開頭的10碼手機)
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // 基本的 Email 檢查
            const phoneRegex = /^09\d{8}$/;                  // 手機號碼檢查

            const accountValue = accountInput.value.trim(); // trim()可以去除前後多餘的空白
            
            if (!accountValue) {
                accountError.textContent = '帳號不能為空！';
                accountInput.classList.add('is-invalid');
                isValid = false;
            } else if (!emailRegex.test(accountValue) && !phoneRegex.test(accountValue)) {
                // 如果既不是 Email 也不是手機號碼
                accountError.textContent = '格式錯誤，請輸入有效的 Email 或手機號碼！';
                accountInput.classList.add('is-invalid');
                isValid = false;
            }

            // 3. 驗證密碼 (前端只檢查有沒有填，以及長度是否合理)
            const passwordValue = passwordInput.value.trim();
            
            if (!passwordValue) {
                passwordError.textContent = '密碼不能為空！';
                passwordInput.classList.add('is-invalid');
                isValid = false;
            } else if (passwordValue.length < 6) {
                passwordError.textContent = '密碼長度不能小於 6 位數！';
                passwordInput.classList.add('is-invalid');
                isValid = false;
            }

            // 4. 如果驗證都通過，才執行登入動作
            if (isValid) {
                submitLoginBtn.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                登入成功，跳轉中...
            `;
                // 把按鈕設為「禁用 (disabled)」狀態，防止使用者因為心急而重複點擊
                submitLoginBtn.disabled = true;

                // 改變按鈕的顏色，從金色變成綠色 (Bootstrap 的 btn-success) 來暗示成功
                submitLoginBtn.classList.remove('btn-gold');
                submitLoginBtn.classList.add('btn-success', 'text-white');
               
                // 假設輸入特定帳號可以模擬管理員登入
                if (accountValue === 'admin@test.com') {
                    localStorage.setItem('userRole', 'admin');
                } else if (accountValue === 'barber@test.com') {
                    localStorage.setItem('userRole', 'barber');
                } else {
                    localStorage.setItem('userRole', 'customer');
                }
                
                // 設定一個計時器 (setTimeout)，模擬伺服器處理時間，然後跳轉
                // 這裡設定 1500 毫秒 (1.5秒) 後執行裡面的換頁動作
                setTimeout(function() {
                    window.location.href = 'index.html';
                }, 1500);
            }
        });
    }
})};
loginValidation()

function registerValidation(){      
    document.addEventListener('DOMContentLoaded', function() {
    const submitRegisterBtn = document.getElementById('submitRegisterBtn');
    
    // 確保這段程式碼只在有註冊按鈕的頁面(login.html)執行
    if (submitRegisterBtn) {
        submitRegisterBtn.addEventListener('click', function() {
            const nameInput = document.getElementById('registerName');
            const phoneInput = document.getElementById('registerPhone');
            const emailInput = document.getElementById('registerEmail');
            const passwordInput = document.getElementById('registerPassword');
            const confirmPasswordInput = document.getElementById('registerConfirmPassword');

            const nameError = document.getElementById('registerNameError');
            const phoneError = document.getElementById('registerPhoneError');
            const emailError = document.getElementById('registerEmailError');
            const passwordError = document.getElementById('registerPasswordError');
            const confirmPasswordError = document.getElementById('registerConfirmPasswordError');


            // 1. 初始化：先移除所有錯誤紅框
            nameInput.classList.remove('is-invalid');
            phoneInput.classList.remove('is-invalid');
            emailInput.classList.remove('is-invalid');
            passwordInput.classList.remove('is-invalid');
            confirmPasswordInput.classList.remove('is-invalid');

            let isValid = true;

            // 2. 驗證帳號 (必須是信箱格式 或 09開頭的10碼手機)
            const nameRegex = /^[a-zA-Z\u4e00-\u9fa5]{2,20}$/; // 姓名檢查
            const phoneRegex = /^09\d{8}$/;                  // 手機號碼檢查
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // 基本的 Email 檢查
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/; // 密碼至少6位，包含字母和數字

            // trim()可以去除前後多餘的空白
            const confirmPasswordValue = confirmPasswordInput.value.trim();
            const nameValue = nameInput.value.trim(); 
            const phoneValue = phoneInput.value.trim();
            const emailValue = emailInput.value.trim();
            const passwordValue = passwordInput.value.trim();

            // 驗證姓名
            if (!nameValue) {
                nameError.textContent = '姓名不能為空！';
                nameInput.classList.add('is-invalid');
                isValid = false;
            } else if (!nameRegex.test(nameValue)) {
                nameError.textContent = '姓名格式錯誤，請輸入2-20個字元！';
                nameInput.classList.add('is-invalid');
                isValid = false;
            }

            // 驗證手機號碼
            if (!phoneValue) {
                phoneError.textContent = '手機號碼不能為空！';
                phoneInput.classList.add('is-invalid');
                isValid = false;
            } else if (!phoneRegex.test(phoneValue)) {
                phoneError.textContent = '手機號碼格式錯誤，請輸入09開頭的10碼手機號碼！';
                phoneInput.classList.add('is-invalid');
                isValid = false;
            }

            // 驗證電子郵件
            if (!emailValue) {
                emailError.textContent = '電子郵件不能為空！';
                emailInput.classList.add('is-invalid');
                isValid = false;
            } else if (!emailRegex.test(emailValue)) {
                emailError.textContent = '電子郵件格式錯誤！';
                emailInput.classList.add('is-invalid');
                isValid = false;
            }

            // 驗證密碼
            if (!passwordValue) {
                passwordError.textContent = '密碼不能為空！';
                passwordInput.classList.add('is-invalid');
                isValid = false;
            } else if (passwordValue.length < 6) {
                passwordError.textContent = '密碼長度不能小於 6 位數！';
                passwordInput.classList.add('is-invalid');
                isValid = false;
            } else if (!passwordRegex.test(passwordValue)) {
                passwordError.textContent = '密碼必須包含字母和數字，且至少6個字元！';
                passwordInput.classList.add('is-invalid');
                isValid = false;
            }

            // 驗證確認密碼
            if (!confirmPasswordValue) {
                confirmPasswordError.textContent = '請確認密碼！';
                confirmPasswordInput.classList.add('is-invalid');
                isValid = false;
            } else if (passwordValue !== confirmPasswordValue) {
                confirmPasswordError.textContent = '兩次輸入的密碼不一致！';
                confirmPasswordInput.classList.add('is-invalid');
                isValid = false;
            }

            // 4. 如果驗證都通過，才執行註冊動作
            if (isValid) {
                submitRegisterBtn.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                註冊成功，跳轉中...
            `;
                // 把按鈕設為「禁用 (disabled)」狀態，防止使用者因為心急而重複點擊
                submitRegisterBtn.disabled = true;

                // 改變按鈕的顏色，從金色變成綠色 (Bootstrap 的 btn-success) 來暗示成功
                submitRegisterBtn.classList.remove('btn-gold');
                submitRegisterBtn.classList.add('btn-success', 'text-white');
                

                // 假設輸入特定帳號可以模擬管理員登入
                if (emailValue === 'admin@test.com') {
                    localStorage.setItem('userRole', 'admin');
                }else if(emailValue === 'barber@test.com'){ 
                    localStorage.setItem('userRole', 'barber');
                }else {
                    localStorage.setItem('userRole', 'customer');
                }
                
                // 跳轉回首頁
                setTimeout(function() {
                    window.location.href = 'index.html';
                }, 1500);
            }
        });
    }
})};
registerValidation()