import { Link, useParams } from 'react-router-dom';
import { SectionHeader } from '../components/Ui';
import { makeSalonArtwork } from '../utils/visuals';
import { getDesignerById } from '../data/designers';

export function DesignerProfilePage() {
  const { designerId } = useParams();
  const designer = getDesignerById(designerId);

  if (!designer) {
    return (
      <section className="page-section page-section--designer-profile">
        <SectionHeader
          eyebrow="設計師介紹"
          description="這個個人頁面不存在，可能是連結已更新。你可以回首頁重新選擇設計師。"
        />
        <Link to="/" className="button button--gold">
          回首頁
        </Link>
      </section>
    );
  }

  const backgroundImage = designer.image ?? makeSalonArtwork(designer.tone);

  return (
    <section className="page-section page-section--designer-profile">
      <div className="page-hero page-hero--designer-profile">
        <SectionHeader eyebrow="設計師介紹" title={designer.name} description={designer.specialty} />
        <div className="designer-profile__hero-actions">
          <Link to="/works" className="button button--ghost">
            看作品靈感
          </Link>
          <Link to="/booking" className="button button--gold">
            預約這位設計師
          </Link>
        </div>
      </div>

      <div className="designer-profile__hero">
        <div
          className="designer-profile__portrait"
          style={{ backgroundImage: `url("${backgroundImage}")` }}
          aria-hidden="true"
        />
        <div className="designer-profile__copy">
          <p className="designer-profile__title">專長</p>
          <p className="designer-profile__bio">{designer.bio}</p>
          <blockquote className="designer-profile__quote">{designer.philosophy}</blockquote>
          <div className="designer-profile__chips" aria-label="設計師專長">
            {designer.strengths.map((item) => (
              <span key={item} className="designer-profile__chip">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="designer-profile__grid">
        <article className="designer-profile__panel">
          <h2>擅長項目</h2>
          <ul className="designer-profile__list">
            {designer.featuredServices.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="designer-profile__panel">
          <h2>設計語氣</h2>
          <p>{designer.vibe}</p>
          <p>{designer.signature}</p>
        </article>
        <article className="designer-profile__panel">
          <h2>風格定位</h2>
          <p>{designer.specialty}</p>
          <p>{designer.philosophy}</p>
        </article>
      </div>
    </section>
  );
}
