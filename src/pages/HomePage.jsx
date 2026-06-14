import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../components/Ui';
import { makeSalonArtwork } from '../utils/visuals';
import { designerGroups, getDesignerGroup } from '../data/designers';
import cuttingSlide from '../assets/hero-slides/cutting.webp';
import coloringSlide from '../assets/hero-slides/coloring.webp';

const heroSlides = [
  {
    title: '',
    subtitle: '',
    image: '/hero-slides/shampoo-promo.png',
    fit: 'contain',
    background: '#f7efe1',
    position: 'center center',
    tone: 'gold',
  },
  {
    title: '',
    subtitle: '',
    image: cuttingSlide,
    fit: 'cover',
    background: '#f4e1c4',
    position: 'center center',
    tone: 'rose',
  },
  {
    title: '',
    subtitle: ' ',
    image: coloringSlide,
    fit: 'cover',
    background: '#f4e7e0',
    position: 'center center',
    tone: 'moss',
  },
];

const hairstyleStyles = [
  {
    name: '男生髮型',
    images: ['/hairstyles/male-1.png', '/hairstyles/male-2.png', '/hairstyles/male-3.png'],
    tones: ['gold', 'rose', 'moss'],
  },
  {
    name: '女生髮型',
    images: ['/hairstyles/female-1.png', '/hairstyles/female-2.png', '/hairstyles/female-3.png'],
    tones: ['ink', 'gold', 'rose'],
  },
  {
    name: '燙髮',
    images: ['/hairstyles/perm-1.png', '/hairstyles/perm-2.png', '/hairstyles/perm-3.png'],
    tones: ['moss', 'gold', 'ink'],
  },
  {
    name: '染髮',
    images: ['/hairstyles/color-1.png', '/hairstyles/color-2.png', '/hairstyles/color-3.png'],
    tones: ['rose', 'moss', 'gold'],
  },
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
  const image = useMemo(() => '/brand-intro/brand-intro-hero.png', []);

  return (
    <section className="brand-intro" id="brand">
      <div className="brand-intro__media" style={{ backgroundImage: `url("${image}")` }} aria-hidden="true" />
      <div className="brand-intro__copy">
        <h2>Style &amp; Trim</h2>
        <p className="brand-intro__text">
          Style & Trim 起初只是幾位設計師對「把剪髮做好」的共同堅持。從一開始的小型工作室，到現在成為結合預約、造型設計與風格提案的空間，我們始終相信，髮型不只是外表的改變，而是日常自信的延伸。一路走來，品牌不斷累積對髮流、輪廓、比例與整理習慣的理解，希望讓每一次剪髮、染髮與燙髮，都能更貼近每位客人的生活節奏與個人風格。現在的 Style & Trim，不只是理髮的地方，更是一個陪你找到最適合自己樣子的品牌。
        </p>
      </div>
    </section>
  );
}

function WorkCard({ work }) {
  const image = useMemo(() => work.image ?? makeSalonArtwork(work.tone), [work.image, work.tone]);

  return (
    <article className="work-card">
      <div className="work-card__image" style={{ backgroundImage: `url("${image}")` }} aria-hidden="true" />
    </article>
  );
}

function DesignerCard({ item }) {
  const image = useMemo(() => item.image ?? makeSalonArtwork(item.tone), [item.image, item.tone]);

  return (
    <Link to={`/designers/${item.id}`} className="designer-card" aria-label={`查看 ${item.name} 的個人介紹`}>
      <div
        className="designer-card__image"
        style={{ backgroundImage: `url("${image}")`, backgroundPosition: 'center top' }}
        aria-hidden="true"
      />
      <div className="designer-card__overlay">
        <span className="designer-card__hint">專長</span>
        <strong>{item.specialty}</strong>
        <p>{item.vibe}</p>
        <span className="designer-card__cta">點擊看個人介紹</span>
      </div>
      <div className="designer-card__body">
        <strong>{item.name}</strong>
        <span className="designer-card__hint">個人介紹</span>
      </div>
    </Link>
  );
}

export function HomePage() {
  const { state } = useApp();
  const [groupIndex, setGroupIndex] = useState(0);
  const [hairstyleIndex, setHairstyleIndex] = useState(0);
  const hairstyleSectionRef = useRef(null);
  const designerSectionRef = useRef(null);
  const [revealedSections, setRevealedSections] = useState({
    hairstyle: false,
    designers: false,
  });

  const services = state?.services?.filter((service) => service.isActive) ?? [];
  const activeDesigners = getDesignerGroup(groupIndex);
  const activeHairstyle = hairstyleStyles[hairstyleIndex];
  const displayWorks = activeHairstyle.images.map((image, index) => ({
    tone: activeHairstyle.tones[index % activeHairstyle.tones.length],
    image,
    id: `${activeHairstyle.name}-${index}`,
  }));

  useEffect(() => {
    const targets = [
      { ref: hairstyleSectionRef, key: 'hairstyle' },
      { ref: designerSectionRef, key: 'designers' },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const key = entry.target.dataset.revealKey;
          if (!key) {
            return;
          }

          if (!entry.isIntersecting) {
            return;
          }

          setRevealedSections((current) => (current[key] ? current : { ...current, [key]: true }));
        });
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -22% 0px',
      },
    );

    targets.forEach(({ ref, key }) => {
      if (ref.current) {
        ref.current.dataset.revealKey = key;
        observer.observe(ref.current);
      }
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <HeroCarousel />
      <BrandIntro />

      <section
        ref={hairstyleSectionRef}
        className={revealedSections.hairstyle ? 'page-block hairstyle-block is-revealed' : 'page-block hairstyle-block'}
        id="works"
      >
        <div className="page-block__head page-block__head--stacked">
          <p className="section-eyebrow">Hairstyle</p>
          <h2>髮型靈感</h2>
          <div className="style-tabs hairstyle-block__tabs" aria-label="風格分類">
            {hairstyleStyles.map((style, styleIndex) => (
              <button
                key={style.name}
                type="button"
                className={styleIndex === hairstyleIndex ? 'style-tabs__button is-active' : 'style-tabs__button'}
                onClick={() => setHairstyleIndex(styleIndex)}
              >
                {style.name}
              </button>
            ))}
          </div>
        </div>
        <div className="hairstyle-block__grid">
          {displayWorks.map((work, index) => (
            <div
              key={work.id}
              className="hairstyle-block__item"
              style={{ '--reveal-delay': `${index * 0.12}s` }}
            >
              <WorkCard work={work} />
            </div>
          ))}
        </div>
        <Link to="/works" className="hairstyle-block__more">
          查看更多作品
        </Link>
      </section>

      <section
        ref={designerSectionRef}
        className={
          revealedSections.designers
            ? 'page-block page-block--designers is-revealed'
            : 'page-block page-block--designers'
        }
        id="designers"
      >
        <div className="page-block__head">
          <div>
            <p className="designer-profile__title">設計師</p>
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
          {activeDesigners.map((designer, index) => (
            <div
              key={designer.name}
              className="designer-grid__item"
              style={{ '--reveal-delay': `${index * 0.12}s` }}
            >
              <DesignerCard item={designer} />
            </div>
          ))}
        </div>
      </section>

      <section className="page-block" id="services">
        <div className="page-block__head">
          <div>
            <p className="designer-profile__title">服務項目</p>
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
