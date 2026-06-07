import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="content-section">
      <div className="empty-state">
        <h2>找不到這個頁面</h2>
        <p>可能是網址輸入錯誤，或你正在找一個尚未建立的路由。</p>
        <Link to="/" className="button button--gold">
          回首頁
        </Link>
      </div>
    </section>
  );
}
