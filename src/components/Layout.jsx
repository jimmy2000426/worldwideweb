import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { NavBar } from './NavBar';
import { LoadingScreen } from './Ui';
import { AssistantChatPanel } from './AssistantChatPanel';

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f9ce34" />
          <stop offset="38%" stopColor="#ee2a7b" />
          <stop offset="72%" stopColor="#6228d7" />
          <stop offset="100%" stopColor="#4f5bd5" />
        </linearGradient>
      </defs>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="url(#instagram-gradient)" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.1" fill="none" stroke="url(#instagram-gradient)" strokeWidth="2" />
      <circle cx="17.4" cy="6.8" r="1.2" fill="url(#instagram-gradient)" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M13.5 20.5v-7h2.4l.4-2.8h-2.8V8.9c0-.8.2-1.4 1.4-1.4h1.5V5c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2h-2.4v2.8h2.4v7h3z"
        fill="#1877f2"
      />
    </svg>
  );
}

function LineIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.6 10.8c0-4.3-3.8-7.8-8.6-7.8s-8.6 3.5-8.6 7.8c0 3.8 3 7 7 7.7v2.5c0 .2.2.4.4.3l2.9-2.6h.3c4.8 0 8.6-3.5 8.6-7.9z"
        fill="#06c755"
      />
      <path
        d="M8.1 9.1h1.2v4.2h2.1v1.1H8.1zm4 0h1.2v5.3h-1.2zm2.5 0h1.2l2.2 3v-3H19v5.3h-1.1l-2.3-3.1v3.1h-1.1zm-8.8 0h1.2v5.3H5.8z"
        fill="#fff"
      />
    </svg>
  );
}

export function Layout() {
  const location = useLocation();
  const { busy, isAuthed, assistantOpen, closeAssistant, toggleAssistant } = useApp();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  useEffect(() => {
    if (!assistantOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeAssistant();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [assistantOpen, closeAssistant]);

  const socialLinks = [
    {
      href: 'https://instagram.com',
      label: 'Instagram',
      className: 'site-footer__social-link site-footer__social-link--instagram',
      icon: <InstagramIcon />,
    },
    {
      href: 'https://facebook.com',
      label: 'Facebook',
      className: 'site-footer__social-link site-footer__social-link--facebook',
      icon: <FacebookIcon />,
    },
    {
      href: 'https://line.me',
      label: 'LINE',
      className: 'site-footer__social-link site-footer__social-link--line',
      icon: <LineIcon />,
    },
  ];

  return (
    <div className="app-shell">
      <NavBar />
      {busy && isAuthed ? (
        <div className="global-loading" role="status" aria-live="polite" aria-label="登出中，請稍候…">
          <div className="global-loading__panel">
            <LoadingScreen label="登出中，請稍候…" />
          </div>
        </div>
      ) : null}
      <main className="page-main">
        <Outlet />
      </main>
      {assistantOpen ? (
        <button type="button" className="assistant-backdrop" aria-label="關閉聊天窗" onClick={closeAssistant} />
      ) : null}
      <div className={assistantOpen ? 'assistant-fab is-open' : 'assistant-fab'} aria-live="polite">
        <div
          className="assistant-fab__panel"
          role="dialog"
          aria-modal="true"
          aria-hidden={!assistantOpen}
          aria-label="聊天對話框"
        >
          <AssistantChatPanel mode="dock" onClose={closeAssistant} />
        </div>
        <button
          type="button"
          className="assistant-fab__button"
          onClick={toggleAssistant}
          aria-label={assistantOpen ? '關閉聊天窗' : '開啟聊天窗'}
          aria-expanded={assistantOpen}
        >
          <span className="assistant-fab__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path
                d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v5A3.5 3.5 0 0 1 15.5 15H11l-4.2 3.6c-.5.4-1.3.1-1.3-.6V15H8.5A3.5 3.5 0 0 1 5 11.5v-5Z"
                fill="currentColor"
              />
            </svg>
          </span>
        </button>
      </div>
      <footer className="site-footer">
        <div className="site-footer__inner">
          <section className="site-footer__brand" aria-label="品牌資訊">
            <img className="site-footer__icon" src="/icon.png" alt="" aria-hidden="true" />
            <div className="site-footer__brand-copy">
              <span className="site-footer__brand-name">Style &amp; Trim</span>
              <p>理髮預約、作品與風格</p>
            </div>
          </section>
          <section className="site-footer__contact" aria-label="聯絡資訊">
            <span className="site-footer__label">Contact</span>
            <ul className="site-footer__contact-list">
              <li className="site-footer__contact-item">
                <span className="site-footer__contact-name">Phone:</span>
                <a className="site-footer__contact-value" href="tel:0212345678">
                  01234567
                </a>
              </li>
              <li className="site-footer__contact-item">
                <span className="site-footer__contact-name">Location:</span>
                <span className="site-footer__contact-value">高雄市燕巢區深水里67號</span>
              </li>
            </ul>
          </section>
          <section className="site-footer__social" aria-label="社群連結">
            <span className="site-footer__label">Social</span>
            <div className="site-footer__socials">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  className={item.className}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={item.label}
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </section>
        </div>
      </footer>
    </div>
  );
}
