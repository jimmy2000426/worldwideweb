import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../components/Ui';
import { makeSalonArtwork } from '../utils/visuals';
import shampooSlide from '../assets/hero-slides/shampoo.webp';
import cuttingSlide from '../assets/hero-slides/cutting.webp';
import coloringSlide from '../assets/hero-slides/coloring.webp';

const heroSlides = [
  {
    eyebrow: 'Salon Mood',
    title: '',
    subtitle: '',
    image: shampooSlide,
    fit: 'contain',
    background: '#f7efe1',
    position: 'center center',
    tone: 'gold',
  },
  {
    eyebrow: 'Hair Story',
    title: '',
    subtitle: '',
    image: cuttingSlide,
    fit: 'cover',
    background: '#f4e1c4',
    position: 'center center',
    tone: 'rose',
  },
  {
    eyebrow: 'Style & Trim',
    title: '',
    subtitle: ' ',
    image: coloringSlide,
    fit: 'cover',
    background: '#f4e7e0',
    position: 'center center',
    tone: 'moss',
  },
];

const featuredWorks = [
  { title: '奶茶霧棕', tags: ['柔霧', '好整理'], tone: 'gold' },
  { title: '俐落短髮', tags: ['輪廓感', '清爽'], tone: 'ink' },
  { title: '霧面灰棕', tags: ['氣質感', '低調'], tone: 'rose' },
  { title: '自然內彎', tags: ['日常感', '柔和'], tone: 'moss' },
  { title: '鬆感燙髮', tags: ['空氣感', '蓬鬆'], tone: 'gold' },
  { title: '深色光澤染', tags: ['沉穩', '有質感'], tone: 'ink' },
];

const designerGroups = [
  [
    { name: 'Alex', style: '油頭 / 漸層推剪', vibe: '輪廓乾淨，線條俐落。', tone: 'gold' },
    { name: 'BEN', style: '燙髮 / 染髮設計', vibe: '偏日韓感，顏色和層次都細緻。', tone: 'rose' },
    { name: 'Joy', style: '短髮 / 質感造型', vibe: '擅長把日常髮型做得更有精神。', tone: 'ink' },
  ],
  [
    { name: 'Mila', style: '長髮 / 柔霧染髮', vibe: '適合想保留柔軟感的客人。', tone: 'moss' },
    { name: 'Neo', style: '男生髮 / 油頭剪裁', vibe: '重視輪廓與整理手感。', tone: 'gold' },
    { name: 'Luna', style: '中長髮 / 空氣感', vibe: '自然、輕盈，日常也很好打理。', tone: 'rose' },
  ],
];

function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const current = heroSlides[index];
  const image = useMemo(() => current.image ?? makeSalonArtwork(current.tone), [current.image, current.tone]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % heroSlides.length);
    }, 12000);

    return () => window.clearInterval(timer);
  }, []);

  const goToPrevious = () => {
    setIndex((value) => (value + heroSlides.length - 1) % heroSlides.length);
  };

  const goToNext = () => {
    setIndex((value) => (value + 1) % heroSlides.length);
  };

  return (
    <section className="hero-carousel">
      <div
        className="hero-carousel__media"
        style={{
          backgroundImage: `url("${image}")`,
          backgroundSize: current.fit ?? 'cover',
          backgroundColor: current.background ?? 'transparent',
          backgroundPosition: current.position ?? 'center center',
        }}
        aria-hidden="true"
      />
      <div className="hero-carousel__scrim" />
      <button
        type="button"
        className="hero-carousel__arrow hero-carousel__arrow--prev"
        onClick={goToPrevious}
        aria-label="切換到上一張圖片"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        className="hero-carousel__arrow hero-carousel__arrow--next"
        onClick={goToNext}
        aria-label="切換到下一張圖片"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="hero-carousel__content">
        <p className="section-eyebrow">{current.eyebrow}</p>
        <h1>{current.title}</h1>
        <p>{current.subtitle}</p>
        <div className="hero-carousel__actions">
          <Link to="/booking" className="button button--gold">
            立即預約
          </Link>
          <Link to="/works" className="button button--ghost">
            查看作品
          </Link>
        </div>
      </div>
      <div className="hero-carousel__dots" aria-label="形象輪播切換">
        {heroSlides.map((slide, slideIndex) => (
          <button
            key={slide.eyebrow}
            type="button"
            className={index === slideIndex ? 'hero-carousel__dot is-active' : 'hero-carousel__dot'}
            onClick={() => setIndex(slideIndex)}
            aria-label={`切換到 ${slide.eyebrow}`}
          />
        ))}
      </div>
    </section>
  );
}

function BrandIntro() {
  const image = useMemo(() => makeSalonArtwork('gold'), []);

  return (
    <section className="brand-intro" id="brand">
      <div className="brand-intro__media" style={{ backgroundImage: `url("${image}")` }} aria-hidden="true" />
      <div className="brand-intro__copy">
        <h2>Style &amp; Trim</h2>
        <p className="brand-intro__text">
          讓焦點留給髮型本身。
        </p>
      </div>
    </section>
  );
}

function WorkCard({ work }) {
  const image = useMemo(() => makeSalonArtwork(work.tone), [work.tone]);

  return (
    <article className="work-card">
      <div className="work-card__image" style={{ backgroundImage: `url("${image}")` }} aria-hidden="true" />
      <div className="work-card__meta">
        <strong>{work.title}</strong>
        <div className="work-card__tags">
          {work.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>
    </article>
  );
}

function DesignerCard({ item }) {
  const image = useMemo(() => makeSalonArtwork(item.tone), [item.tone]);

  return (
    <article className="designer-card">
      <div className="designer-card__image" style={{ backgroundImage: `url("${image}")` }} aria-hidden="true" />
      <div className="designer-card__body">
        <strong>{item.name}</strong>
        <span className="designer-card__hint"></span>
      </div>
      <div className="designer-card__overlay">
        <p>{item.style}</p>
        <small>{item.vibe}</small>
      </div>
    </article>
  );
}

export function HomePage() {
  const { state } = useApp();
  const [groupIndex, setGroupIndex] = useState(0);

  const services = state?.services?.filter((service) => service.isActive) ?? [];
  const activeDesigners = designerGroups[groupIndex];
  const displayWorks = featuredWorks.slice(0, 6);

  return (
    <>
      <HeroCarousel />
      <BrandIntro />

      <section className="page-block" id="works">
        <div className="page-block__head">
          <div>
            <p className="section-eyebrow"></p>
            <h2>hair stlye</h2>
          </div>
          <Link to="/works" className="button button--ghost">
            查看更多作品
          </Link>
        </div>
        <div className="work-grid">
          {displayWorks.map((work) => (
            <WorkCard key={work.title} work={work} />
          ))}
        </div>
      </section>

      <section className="page-block page-block--designers" id="designers">
        <div className="page-block__head">
          <div>
            <p className="section-eyebrow">設計師</p>
            <h2></h2>
          </div>
        </div>
        <button
          type="button"
          className="designer-nav designer-nav--prev"
          onClick={() => setGroupIndex((value) => (value + designerGroups.length - 1) % designerGroups.length)}
          aria-label="切換到上一組設計師"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M15 5l-7 7 7 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          className="designer-nav designer-nav--next"
          onClick={() => setGroupIndex((value) => (value + 1) % designerGroups.length)}
          aria-label="切換到下一組設計師"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M9 5l7 7-7 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="designer-grid">
          {activeDesigners.map((designer) => (
            <DesignerCard key={designer.name} item={designer} />
          ))}
        </div>
      </section>

      <section className="page-block" id="services">
        <div className="page-block__head">
          <div>
            <p className="section-eyebrow">服務項目</p>
            <h2></h2>
          </div>
        </div>
        <div className="service-grid--lite">
          {services.map((service) => (
            <article key={service.id} className="service-lite-card">
              <div className="service-lite-card__top">
                <strong>{service.name}</strong>
                <span>{service.priceRange}</span>
              </div>
              <p>{service.teaser}</p>
              <small>
                {formatCurrency(service.basePrice)} 起，約 {service.durationMinutes} 分鐘
              </small>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
