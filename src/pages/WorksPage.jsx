import { Link } from 'react-router-dom';
import { SectionHeader } from '../components/Ui';

const works = [
  { title: '奶茶霧棕', tag: '柔和', image: '/works-portraits/milk-tea-ash-brown.png' },
  { title: '俐落短髮', tag: '輪廓', image: '/works-portraits/short-fade.png' },
  { title: '霧面灰棕', tag: '質感', image: '/works-portraits/misty-bob.png' },
  { title: '自然內彎', tag: '日常', image: '/works-portraits/inward-bob.png' },
  { title: '層次捲度', tag: '線條', image: '/works-portraits/perm-curls.png' },
  { title: '透明感染髮', tag: '輕盈', image: '/works-portraits/transparent-dye.png' },
  { title: '鬆感短層次', tag: '清爽', image: '/works-portraits/layered-short-texture.png' },
  { title: '深色光澤染', tag: '沉穩', image: '/works-portraits/deep-gloss-dye.png' },
  { title: '油頭推剪', tag: '俐落', image: '/works-portraits/slick-back-cut.png' },
];

function WorkCard({ work }) {
  return (
    <article className="work-card work-card--gallery">
      <div className="work-card__image" style={{ backgroundImage: `url("${work.image}")` }} aria-hidden="true" />
      <div className="work-card__meta">
        <span>{work.tag}</span>
        <strong>{work.title}</strong>
      </div>
    </article>
  );
}

export function WorksPage() {
  return (
    <section className="page-section page-section--works">
      <div className="page-hero page-hero--works">
        <SectionHeader title="作品集" />
        <Link to="/" className="button button--ghost">
          回首頁
        </Link>
      </div>

      <div className="work-grid work-grid--page">
        {works.map((work) => (
          <WorkCard key={work.title} work={work} />
        ))}
      </div>
    </section>
  );
}
