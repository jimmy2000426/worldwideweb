const TONES = {
  gold: ['#f5d38a', '#d9b15f', '#7a4f17'],
  rose: ['#f1b9b0', '#c9786d', '#5d2530'],
  ink: ['#6a86b7', '#344d79', '#0d1729'],
  moss: ['#c7d8b7', '#85a46a', '#25361f'],
};

function svgNode(markup) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markup)}`;
}

export function makeSalonArtwork(seed = 'gold') {
  const [soft, main, deep] = TONES[seed] ?? TONES.gold;

  return svgNode(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" role="img" aria-label="Salon artwork">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#09111f" />
          <stop offset="100%" stop-color="#04080f" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="35%" r="55%">
          <stop offset="0%" stop-color="${soft}" stop-opacity="0.75" />
          <stop offset="100%" stop-color="${main}" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="hair" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${soft}" />
          <stop offset="52%" stop-color="${main}" />
          <stop offset="100%" stop-color="${deep}" />
        </linearGradient>
        <linearGradient id="glass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.03" />
        </linearGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#bg)" />
      <circle cx="900" cy="180" r="220" fill="url(#glow)" />
      <circle cx="220" cy="760" r="180" fill="url(#glow)" opacity="0.55" />
      <path d="M190 686c60-125 137-183 231-183 73 0 123 31 150 88 34-69 93-104 177-104 117 0 200 70 243 210" fill="none" stroke="${soft}" stroke-opacity="0.24" stroke-width="24" stroke-linecap="round" />
      <path d="M370 260c-78 54-118 123-118 208 0 118 73 194 188 194 49 0 93-13 130-38 39 27 84 40 136 40 118 0 194-78 194-195 0-87-40-157-119-211-31-22-68-31-109-31-35 0-71 8-108 26-35-18-71-26-108-26-38 0-74 9-86 33z" fill="url(#hair)" opacity="0.95" />
      <path d="M402 317c25-49 68-82 129-98 59-15 126-13 204 6 77 20 122 61 135 123 6 28 5 64-3 109-18 104-43 163-76 176-59 24-152 34-280 31-69-2-120-21-151-55-39-43-49-105-31-186 15-70 43-123 83-156z" fill="url(#glass)" />
      <ellipse cx="620" cy="560" rx="140" ry="34" fill="#000" opacity="0.28" />
      <path d="M484 450c31 34 71 51 121 51s90-17 121-51" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="12" stroke-linecap="round" />
      <path d="M455 400h290" stroke="#fff" stroke-opacity="0.08" stroke-width="8" stroke-linecap="round" />
      <rect x="92" y="92" width="240" height="72" rx="36" fill="#ffffff" fill-opacity="0.07" />
      <rect x="90" y="742" width="315" height="56" rx="28" fill="#ffffff" fill-opacity="0.07" />
      <circle cx="952" cy="618" r="118" fill="none" stroke="${soft}" stroke-opacity="0.25" stroke-width="18" />
      <path d="M873 618h158" stroke="${soft}" stroke-opacity="0.6" stroke-width="10" stroke-linecap="round" />
      <path d="M952 538v160" stroke="${soft}" stroke-opacity="0.6" stroke-width="10" stroke-linecap="round" />
    </svg>
  `);
}
