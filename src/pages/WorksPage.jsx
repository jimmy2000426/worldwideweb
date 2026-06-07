import { Link } from 'react-router-dom';
import { SectionHeader } from '../components/Ui';
import { makeSalonArtwork } from '../utils/visuals';

const works = [
  { title: '奶茶霧棕', tag: '柔和', tone: 'gold' },
  { title: '俐落短髮', tag: '輪廓', tone: 'ink' },
  { title: '霧面灰棕', tag: '質感', tone: 'rose' },
  { title: '自然內彎', tag: '日常', tone: 'moss' },
  { title: '層次捲度', tag: '線條', tone: 'gold' },
  { title: '透明感染髮', tag: '輕盈', tone: 'ink' },
  { title: '鬆感短層次', tag: '清爽', tone: 'rose' },
  { title: '深色光澤染', tag: '沉穩', tone: 'moss' },
  { title: '油頭推剪', tag: '俐落', tone: 'gold' },
];

function WorkCard({ work }) {
  const backgroundImage = makeSalonArtwork(work.tone);

  return (
    <article className="work-card work-card--gallery">
      <div className="work-card__image" style={{ backgroundImage: `url("${backgroundImage}")` }} aria-hidden="true" />
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
        <SectionHeader eyebrow="作品集" title="查看更多作品" />
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
