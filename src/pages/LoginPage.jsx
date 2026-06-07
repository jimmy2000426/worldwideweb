import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArtworkPanel, FeaturePill } from '../components/Ui';

const loginSeed = {
  account: '',
  password: '',
  rememberMe: true,
};

const registerSeed = {
  name: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: true,
  rememberMe: true,
};

function LoginHint() {
  return (
    <div className="hint-card">
      <h3>登入後可以做什麼</h3>
      <ul>
        <li>查看自己的預約紀錄</li>
        <li>快速確認時間與設計師</li>
        <li>需要時可以改期或取消</li>
      </ul>
      <p>註冊後就能用同一個帳號持續預約。</p>
    </div>
  );
}

export function LoginPage() {
  const { login, register, busy, error, clearError } = useApp();
  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState(loginSeed);
  const [registerForm, setRegisterForm] = useState(registerSeed);
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    clearError();
    setLocalError('');
  }, [mode, clearError]);

  const goNext = (role) => {
    const from = location.state?.from;
    if (from) {
      navigate(from, { replace: true });
      return;
    }
    if (role === 'barber' || role === 'admin') {
      navigate('/dashboard', { replace: true });
      return;
    }
    if (role === 'customer') {
      navigate('/appointments', { replace: true });
      return;
    }
    navigate('/', { replace: true });
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    setLocalError('');
    try {
      const user = await login(loginForm);
      goNext(user.role);
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const submitRegister = async (event) => {
    event.preventDefault();
    setLocalError('');
    try {
      const user = await register(registerForm);
      goNext(user.role);
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const shownError = localError || error;

  return (
    <section className="auth-layout">
      <div className="auth-visual">
        <ArtworkPanel
          label="會員空間"
          title="把預約留給自己，接下來交給我們"
          description="登入後可以快速查看預約、確認時間與管理紀錄。"
          tone="gold"
          className="artwork-panel--auth"
        />
        <div className="auth-visual__pills">
          <FeaturePill>快速查看預約</FeaturePill>
          <FeaturePill>可改期 / 取消</FeaturePill>
          <FeaturePill>一次記住你的資料</FeaturePill>
        </div>
      </div>

      <div className="auth-card">
        <div className="auth-card__header">
          <h1>會員登入</h1>
          <p>先登入，再預約。</p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'auth-tabs__button is-active' : 'auth-tabs__button'}
            onClick={() => setMode('login')}
          >
            登入
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'auth-tabs__button is-active' : 'auth-tabs__button'}
            onClick={() => setMode('register')}
          >
            註冊
          </button>
        </div>

        {shownError ? <div className="form-alert">{shownError}</div> : null}

        {mode === 'login' ? (
          <form className="auth-form" onSubmit={submitLogin}>
            <label>
              電子郵件或手機
              <input
                type="text"
                value={loginForm.account}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, account: event.target.value }))
                }
                placeholder="輸入 Email 或手機號碼"
                required
              />
            </label>
            <label>
              密碼
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="輸入密碼"
                required
              />
            </label>
            <div className="auth-form__row">
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={loginForm.rememberMe}
                  onChange={(event) =>
                    setLoginForm((current) => ({ ...current, rememberMe: event.target.checked }))
                  }
                />
                保持登入
              </label>
              <button type="button" className="text-button" onClick={() => setMode('register')}>
                還沒有帳號？
              </button>
            </div>
            <button type="submit" className="button button--gold button--full" disabled={busy}>
              {busy ? '登入中...' : '登入'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={submitRegister}>
            <label>
              姓名 / 稱呼
              <input
                type="text"
                value={registerForm.name}
                onChange={(event) =>
                  setRegisterForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="例如：王小明"
                required
              />
            </label>
            <label>
              手機號碼
              <input
                type="tel"
                value={registerForm.phone}
                onChange={(event) =>
                  setRegisterForm((current) => ({ ...current, phone: event.target.value }))
                }
                placeholder="09XX-XXX-XXX"
                required
              />
            </label>
            <label>
              電子郵件（選填）
              <input
                type="email"
                value={registerForm.email}
                onChange={(event) =>
                  setRegisterForm((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="name@example.com"
              />
            </label>
            <label>
              設定密碼
              <input
                type="password"
                value={registerForm.password}
                onChange={(event) =>
                  setRegisterForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="至少 8 碼並包含英數字"
                required
              />
            </label>
            <label>
              確認密碼
              <input
                type="password"
                value={registerForm.confirmPassword}
                onChange={(event) =>
                  setRegisterForm((current) => ({
                    ...current,
                    confirmPassword: event.target.value,
                  }))
                }
                placeholder="再次輸入密碼"
                required
              />
            </label>
            <div className="auth-form__row auth-form__row--stack">
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={registerForm.acceptTerms}
                  onChange={(event) =>
                    setRegisterForm((current) => ({
                      ...current,
                      acceptTerms: event.target.checked,
                    }))
                  }
                />
                我已閱讀並同意服務條款
              </label>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={registerForm.rememberMe}
                  onChange={(event) =>
                    setRegisterForm((current) => ({
                      ...current,
                      rememberMe: event.target.checked,
                    }))
                  }
                />
                保持登入
              </label>
            </div>
            <button type="submit" className="button button--gold button--full" disabled={busy}>
              {busy ? '建立帳號中...' : '建立帳號'}
            </button>
          </form>
        )}
      </div>

      <LoginHint />
    </section>
  );
}
