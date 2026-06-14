import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';

export function NavBar() {
  const { currentUser, isAuthed, logout, busy } = useApp();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const displayName = currentUser?.name ?? '訪客';
  const isStaff = currentUser?.role === 'barber' || currentUser?.role === 'admin';
  const memberLabel = currentUser?.role === 'customer' ? '會員' : '已登入';

  const navItems = useMemo(
    () => [
      { label: '首頁', to: '/' },
      { label: '作品', to: '/works' },
      { label: '預約服務', to: '/booking' },
      { label: '我的預約', to: '/appointments', authOnly: true },
    ],
    [],
  );

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <Link to="/" className="brand">
          <img className="brand__mark" src="/icon.png" alt="" aria-hidden="true" />
          <span className="brand__text">
            <strong>Style &amp; Trim</strong>
            <small>理髮預約與風格設計</small>
          </span>
        </Link>

        <button
          type="button"
          className="topbar__toggle"
          onClick={() => setOpen((value) => !value)}
          aria-label="切換導覽選單"
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`topbar__nav ${open ? 'is-open' : ''}`}>
          {navItems
            .filter((item) => !item.authOnly || isAuthed)
            .map((item) => (
              <Link key={item.to} to={item.to} className="nav-link-button nav-link-button--pill" onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}

          {!isAuthed ? (
            <Link to="/login" className="button button--gold nav-action-button" onClick={() => setOpen(false)}>
              登入 / 註冊
            </Link>
          ) : (
            <>
              {isStaff ? (
                <Link
                  to="/dashboard"
                  className="button button--ghost nav-action-button nav-action-button--subtle"
                  onClick={() => setOpen(false)}
                >
                  後台管理
                </Link>
              ) : null}
              <div className="nav-user">
                <div>
                  <strong>{displayName}</strong>
                  <small>{memberLabel}</small>
                </div>
              </div>
              <button
                type="button"
                className="button button--ghost nav-action-button"
                onClick={handleLogout}
                disabled={busy}
              >
                {busy ? '登出中...' : '登出'}
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
