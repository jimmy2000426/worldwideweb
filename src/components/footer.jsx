import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { NavBar } from './NavBar';

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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

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
      <main className="page-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <section className="site-footer__panel site-footer__panel--brand" aria-label="品牌資訊">
          <div className="site-footer__brand">
            <span className="site-footer__icon">S</span>
            <div className="site-footer__brand-copy">
              <strong>Style &amp; Trim</strong>
              <p>剪髮、預約、風格整理</p>
            </div>
          </div>
        </section>
        <section className="site-footer__panel site-footer__panel--contact" aria-label="電話資訊">
          <span className="site-footer__label">Phone</span>
          <strong className="site-footer__value">02-1234-5678</strong>
        </section>
        <section className="site-footer__panel site-footer__panel--contact" aria-label="地點資訊">
          <span className="site-footer__label">Location</span>
          <strong className="site-footer__value">高雄市燕巢區深水里67號</strong>
        </section>
        <section className="site-footer__panel site-footer__panel--social" aria-label="社群連結">
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
      </footer>
    </div>
  );
}
