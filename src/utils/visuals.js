const TONES = {
  gold: ['#f5d38a', '#d9b15f', '#7a4f17'],
  rose: ['#f1b9b0', '#c9786d', '#5d2530'],
  ink: ['#6a86b7', '#344d79', '#0d1729'],
  moss: ['#c7d8b7', '#85a46a', '#25361f'],
};

const TAG_THEMES = {
  柔和: { accent: 'soft', frame: 'round' },
  輪廓: { accent: 'sharp', frame: 'angled' },
  質感: { accent: 'refined', frame: 'layered' },
  日常: { accent: 'warm', frame: 'soft' },
  線條: { accent: 'graphic', frame: 'line' },
  輕盈: { accent: 'airy', frame: 'mist' },
  清爽: { accent: 'fresh', frame: 'clear' },
  沉穩: { accent: 'calm', frame: 'dark' },
  俐落: { accent: 'crisp', frame: 'clean' },
};

const WORK_ARTWORK_PRESETS = {
  '奶茶霧棕': {
    gender: 'female',
    hair: 'long-wave',
    expression: 'soft',
    pose: 'gentle-turn',
    camera: 'three-quarter-right',
  },
  '俐落短髮': {
    gender: 'male',
    hair: 'short-fade',
    expression: 'confident',
    pose: 'upright',
    camera: 'front',
  },
  '霧面灰棕': {
    gender: 'female',
    hair: 'bob',
    expression: 'calm',
    pose: 'three-quarter-left',
    camera: 'front',
  },
  '自然內彎': {
    gender: 'female',
    hair: 'inward-bob',
    expression: 'gentle',
    pose: 'soft-lean',
    camera: 'three-quarter-right',
  },
  '層次捲度': {
    gender: 'female',
    hair: 'curl',
    expression: 'playful',
    pose: 'dynamic',
    camera: 'low-angle',
  },
  '透明感染髮': {
    gender: 'male',
    hair: 'airy-short',
    expression: 'cool',
    pose: 'profile-left',
    camera: 'profile-left',
  },
  '鬆感短層次': {
    gender: 'female',
    hair: 'layered-short',
    expression: 'relaxed',
    pose: 'relaxed',
    camera: 'three-quarter-left',
  },
  '深色光澤染': {
    gender: 'female',
    hair: 'sleek-long',
    expression: 'quiet',
    pose: 'front',
    camera: 'front',
  },
  '油頭推剪': {
    gender: 'male',
    hair: 'slick-back',
    expression: 'bold',
    pose: 'upright',
    camera: 'low-angle',
  },
};

const CAMERA_PRESETS = {
  front: {
    faceX: 0,
    faceY: 0,
    faceRotate: 0,
    faceScaleX: 1,
    eyeMode: 'two',
    eyeLeftX: -40,
    eyeRightX: 40,
    eyeYOffset: 0,
  },
  'three-quarter-left': {
    faceX: -24,
    faceY: 0,
    faceRotate: -6,
    faceScaleX: 0.97,
    eyeMode: 'two',
    eyeLeftX: -44,
    eyeRightX: 20,
    eyeYOffset: 0,
  },
  'three-quarter-right': {
    faceX: 24,
    faceY: 0,
    faceRotate: 6,
    faceScaleX: 0.97,
    eyeMode: 'two',
    eyeLeftX: -20,
    eyeRightX: 44,
    eyeYOffset: 0,
  },
  'profile-left': {
    faceX: -54,
    faceY: 2,
    faceRotate: -15,
    faceScaleX: 0.88,
    eyeMode: 'left',
    eyeLeftX: -6,
    eyeRightX: 0,
    eyeYOffset: 0,
  },
  'profile-right': {
    faceX: 54,
    faceY: 2,
    faceRotate: 15,
    faceScaleX: 0.88,
    eyeMode: 'right',
    eyeLeftX: 0,
    eyeRightX: 6,
    eyeYOffset: 0,
  },
  'low-angle': {
    faceX: 0,
    faceY: 12,
    faceRotate: 4,
    faceScaleX: 1.02,
    eyeMode: 'two',
    eyeLeftX: -42,
    eyeRightX: 40,
    eyeYOffset: 2,
  },
};

const EXPRESSION_PRESETS = {
  soft: {
    brow: -2,
    eyeTilt: 0,
    mouth: 'smile',
    pupilShiftX: 0,
    pupilShiftY: 1,
  },
  confident: {
    brow: 4,
    eyeTilt: 1,
    mouth: 'smirk',
    pupilShiftX: 1,
    pupilShiftY: 0,
  },
  calm: {
    brow: 0,
    eyeTilt: 0,
    mouth: 'calm',
    pupilShiftX: 0,
    pupilShiftY: 0,
  },
  gentle: {
    brow: -1,
    eyeTilt: 0,
    mouth: 'gentle',
    pupilShiftX: -1,
    pupilShiftY: 0,
  },
  playful: {
    brow: 5,
    eyeTilt: -1,
    mouth: 'playful',
    pupilShiftX: 2,
    pupilShiftY: -1,
  },
  cool: {
    brow: 2,
    eyeTilt: -1,
    mouth: 'cool',
    pupilShiftX: 1,
    pupilShiftY: 0,
  },
  relaxed: {
    brow: -1,
    eyeTilt: 0,
    mouth: 'relaxed',
    pupilShiftX: 0,
    pupilShiftY: 1,
  },
  quiet: {
    brow: 0,
    eyeTilt: 0,
    mouth: 'quiet',
    pupilShiftX: 0,
    pupilShiftY: 0,
  },
  bold: {
    brow: 6,
    eyeTilt: 0,
    mouth: 'bold',
    pupilShiftX: 2,
    pupilShiftY: 0,
  },
};

const POSE_ROTATIONS = {
  upright: 0,
  front: 0,
  'three-quarter': -5,
  'soft-lean': 6,
  relaxed: 3,
  dynamic: -8,
  'gentle-turn': 5,
  'profile-left': -9,
};

function svgNode(markup) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markup)}`;
}

function hashString(input) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickFromHash(values, seed, offset = 0) {
  return values[(seed + offset) % values.length];
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function buildPalette(seed) {
  return TONES[seed] ?? TONES.gold;
}

function buildWorkPalette(work) {
  const paletteKey = work.tone && TONES[work.tone] ? work.tone : pickFromHash(Object.keys(TONES), hashString(work.title), 0);
  const [soft, main, deep] = buildPalette(paletteKey);
  return { soft, main, deep, toneKey: paletteKey };
}

function resolveWorkArtwork(work) {
  const seed = hashString(`${work.title}|${work.tag}|${work.tone}`);
  const preset = WORK_ARTWORK_PRESETS[work.title] ?? {};
  const camera = CAMERA_PRESETS[preset.camera ?? pickFromHash(Object.keys(CAMERA_PRESETS), seed, 1)];
  const expression = EXPRESSION_PRESETS[preset.expression ?? pickFromHash(Object.keys(EXPRESSION_PRESETS), seed, 2)];
  const gender = preset.gender ?? (seed % 2 === 0 ? 'male' : 'female');
  const hair = preset.hair ?? pickFromHash(['short-fade', 'bob', 'curl', 'layered-short', 'sleek-long', 'inward-bob'], seed, 3);
  const pose = preset.pose ?? pickFromHash(['upright', 'three-quarter', 'soft-lean', 'relaxed', 'dynamic', 'front'], seed, 4);
  const tagTheme = TAG_THEMES[work.tag] ?? pickFromHash(Object.values(TAG_THEMES), seed, 5);
  const palette = buildWorkPalette(work);

  return {
    seed,
    gender,
    hair,
    pose,
    expression,
    camera,
    tagTheme,
    palette,
  };
}

function makeHairPath(style) {
  switch (style) {
    case 'short-fade':
      return 'M -130 -122C -110 -186 -58 -214 0 -214C 58 -214 110 -186 130 -122C 112 -76 90 -50 62 -34C 42 -21 22 -16 0 -16C -22 -16 -42 -21 -62 -34C -90 -50 -112 -76 -130 -122Z';
    case 'bob':
      return 'M -158 -98C -130 -220 130 -220 158 -98C 182 -8 144 78 88 114C 56 135 26 144 0 144C -26 144 -56 135 -88 114C -144 78 -182 -8 -158 -98Z';
    case 'inward-bob':
      return 'M -150 -90C -124 -200 124 -200 150 -90C 166 -8 134 58 88 90C 60 109 32 118 0 118C -32 118 -60 109 -88 90C -134 58 -166 -8 -150 -90Z';
    case 'curl':
      return 'M -160 -108C -132 -208 -52 -244 0 -244C 52 -244 132 -208 160 -108C 178 -40 154 42 110 102C 78 144 46 168 0 176C -46 168 -78 144 -110 102C -154 42 -178 -40 -160 -108Z';
    case 'airy-short':
      return 'M -126 -108C -104 -180 -52 -212 0 -212C 52 -212 104 -180 126 -108C 112 -64 96 -46 66 -26C 42 -11 22 -6 0 -6C -22 -6 -42 -11 -66 -26C -96 -46 -112 -64 -126 -108Z';
    case 'layered-short':
      return 'M -144 -108C -120 -190 -56 -220 0 -220C 56 -220 120 -190 144 -108C 126 -56 108 -22 74 8C 46 33 24 46 0 48C -24 46 -46 33 -74 8C -108 -22 -126 -56 -144 -108Z';
    case 'sleek-long':
      return 'M -150 -92C -126 -198 -66 -232 0 -232C 66 -232 126 -198 150 -92C 142 -18 118 66 96 138C 82 185 58 214 0 226C -58 214 -82 185 -96 138C -118 66 -142 -18 -150 -92Z';
    case 'slick-back':
      return 'M -132 -120C -108 -188 -56 -216 0 -216C 56 -216 108 -188 132 -120C 122 -70 98 -40 66 -22C 44 -10 22 -6 0 -6C -22 -6 -44 -10 -66 -22C -98 -40 -122 -70 -132 -120Z';
    default:
      return 'M -144 -108C -120 -190 -56 -220 0 -220C 56 -220 120 -190 144 -108C 126 -56 108 -22 74 8C 46 33 24 46 0 48C -24 46 -46 33 -74 8C -108 -22 -126 -56 -144 -108Z';
  }
}

function makeClothingPath(gender) {
  if (gender === 'male') {
    return 'M -220 126C -170 68 -112 38 -40 28C -14 24 14 24 40 28C 112 38 170 68 220 126C 196 176 162 214 108 236C 70 252 34 258 0 258C -34 258 -70 252 -108 236C -162 214 -196 176 -220 126Z';
  }

  return 'M -228 136C -178 80 -116 48 -46 34C -16 28 16 28 46 34C 116 48 178 80 228 136C 198 184 156 220 98 244C 64 258 32 264 0 264C -32 264 -64 258 -98 244C -156 220 -198 184 -228 136Z';
}

function makeFacePath(gender) {
  if (gender === 'male') {
    return 'M -92 -58C -88 -118 -40 -154 0 -154C 40 -154 88 -118 92 -58C 96 12 72 86 0 94C -72 86 -96 12 -92 -58Z';
  }

  return 'M -82 -56C -78 -110 -36 -142 0 -142C 36 -142 78 -110 82 -56C 86 8 62 78 0 86C -62 78 -86 8 -82 -56Z';
}

function makeEyePath({ x, y, open = 1, tilt = 0, wide = 1 }) {
  if (open < 0.4) {
    return `<path d="M ${x - 14} ${y}C ${x - 7} ${y + tilt} ${x + 7} ${y + tilt} ${x + 14} ${y}" fill="none" stroke="#1f1a16" stroke-width="5" stroke-linecap="round" />`;
  }

  return `
    <ellipse cx="${x}" cy="${y}" rx="${12 * wide}" ry="${8 * open}" fill="#fffaf3" />
    <circle cx="${x}" cy="${y + 1}" r="${4.4 * wide}" fill="#201912" />
    <circle cx="${x + 1.5}" cy="${y - 1.5}" r="1.4" fill="#fffaf3" />
  `;
}

function makeBrowPath({ x, y, tilt }) {
  return `<path d="M ${x - 16} ${y + 4}C ${x - 6} ${y - 1 - tilt} ${x + 6} ${y - 1 + tilt} ${x + 16} ${y + 4}" fill="none" stroke="#241d18" stroke-width="5" stroke-linecap="round" />`;
}

function makeMouthPath(type) {
  switch (type) {
    case 'smile':
      return 'M -24 42C -10 55 10 55 24 42';
    case 'smirk':
      return 'M -20 42C -5 48 6 49 22 44';
    case 'calm':
      return 'M -18 44C -6 46 6 46 18 44';
    case 'gentle':
      return 'M -22 40C -8 50 8 50 22 40';
    case 'playful':
      return 'M -22 38C -10 62 12 62 28 38';
    case 'cool':
      return 'M -18 42C -4 50 8 50 22 42';
    case 'relaxed':
      return 'M -20 44C -6 48 6 48 20 44';
    case 'quiet':
      return 'M -16 44C -4 45 4 45 16 44';
    case 'bold':
      return 'M -20 42C -4 47 8 45 24 40';
    default:
      return 'M -18 44C -6 46 6 46 18 44';
  }
}

function renderBackgroundMotifs(theme, palette, seed) {
  const offset = seed % 100;
  switch (theme.accent) {
    case 'sharp':
      return `
        <path d="M 54 182H 332" stroke="${palette.soft}" stroke-opacity="0.24" stroke-width="14" stroke-linecap="round" />
        <path d="M 862 716L 1088 518" stroke="${palette.main}" stroke-opacity="0.28" stroke-width="12" stroke-linecap="round" />
        <path d="M 100 812H 402" stroke="${palette.soft}" stroke-opacity="0.12" stroke-width="16" stroke-linecap="round" />
      `;
    case 'graphic':
      return `
        <path d="M 90 140V 308" stroke="${palette.soft}" stroke-opacity="0.5" stroke-width="10" stroke-linecap="round" />
        <path d="M 108 124V 336" stroke="${palette.main}" stroke-opacity="0.18" stroke-width="6" stroke-linecap="round" />
        <path d="M 920 112V 306" stroke="${palette.soft}" stroke-opacity="0.3" stroke-width="16" stroke-linecap="round" />
        <path d="M 1020 776H 1120" stroke="${palette.main}" stroke-opacity="0.22" stroke-width="14" stroke-linecap="round" />
      `;
    case 'airy':
      return `
        <circle cx="${180 + offset}" cy="${190 + (offset % 60)}" r="74" fill="${palette.soft}" fill-opacity="0.14" />
        <circle cx="956" cy="180" r="108" fill="${palette.soft}" fill-opacity="0.14" />
        <circle cx="1088" cy="752" r="72" fill="${palette.main}" fill-opacity="0.14" />
      `;
    case 'calm':
      return `
        <rect x="72" y="86" width="240" height="84" rx="34" fill="${palette.soft}" fill-opacity="0.08" />
        <rect x="874" y="740" width="248" height="70" rx="30" fill="${palette.deep}" fill-opacity="0.10" />
      `;
    case 'crisp':
      return `
        <rect x="76" y="116" width="170" height="170" rx="36" fill="${palette.soft}" fill-opacity="0.12" />
        <rect x="924" y="94" width="170" height="170" rx="36" fill="${palette.main}" fill-opacity="0.12" />
      `;
    default:
      return `
        <circle cx="176" cy="190" r="92" fill="${palette.soft}" fill-opacity="0.12" />
        <circle cx="944" cy="178" r="132" fill="${palette.main}" fill-opacity="0.14" />
        <circle cx="1046" cy="728" r="104" fill="${palette.deep}" fill-opacity="0.12" />
      `;
  }
}

function renderClothing(palette, gender, theme) {
  const fill = gender === 'male' ? palette.deep : palette.main;
  const stroke = theme.frame === 'angled' || theme.frame === 'clean' ? palette.soft : palette.main;
  return `
    <path d="${makeClothingPath(gender)}" fill="${fill}" fill-opacity="${gender === 'male' ? '0.75' : '0.68'}" />
    <path d="M -126 124C -72 96 -24 82 0 82C 24 82 72 96 126 124" fill="none" stroke="${stroke}" stroke-opacity="0.3" stroke-width="10" stroke-linecap="round" />
  `;
}

function renderHair(style, palette, seed) {
  const hairFill = `url(#hair-${seed})`;
  const highlightFill = palette.soft;
  const shapes = {
    'short-fade': `
      <path d="${makeHairPath(style)}" fill="${hairFill}" />
      <path d="M -88 -144C -48 -172 48 -172 88 -144" fill="none" stroke="${highlightFill}" stroke-opacity="0.35" stroke-width="8" stroke-linecap="round" />
    `,
    bob: `
      <path d="${makeHairPath(style)}" fill="${hairFill}" />
      <path d="M -124 -52C -96 -26 -62 -12 -22 -10" fill="none" stroke="${highlightFill}" stroke-opacity="0.25" stroke-width="8" stroke-linecap="round" />
      <path d="M 126 -48C 98 -22 64 -10 20 -8" fill="none" stroke="${highlightFill}" stroke-opacity="0.25" stroke-width="8" stroke-linecap="round" />
    `,
    'inward-bob': `
      <path d="${makeHairPath(style)}" fill="${hairFill}" />
      <path d="M -116 -14C -94 12 -72 22 -46 26" fill="none" stroke="${highlightFill}" stroke-opacity="0.3" stroke-width="8" stroke-linecap="round" />
      <path d="M 116 -14C 94 12 72 22 46 26" fill="none" stroke="${highlightFill}" stroke-opacity="0.3" stroke-width="8" stroke-linecap="round" />
    `,
    curl: `
      <path d="${makeHairPath(style)}" fill="${hairFill}" />
      <circle cx="-84" cy="-132" r="22" fill="${palette.main}" fill-opacity="0.82" />
      <circle cx="84" cy="-130" r="22" fill="${palette.main}" fill-opacity="0.82" />
      <circle cx="-40" cy="-180" r="24" fill="${palette.soft}" fill-opacity="0.42" />
      <circle cx="42" cy="-178" r="24" fill="${palette.soft}" fill-opacity="0.42" />
    `,
    'airy-short': `
      <path d="${makeHairPath(style)}" fill="${hairFill}" />
      <path d="M -82 -126C -56 -164 -16 -184 20 -180" fill="none" stroke="${highlightFill}" stroke-opacity="0.34" stroke-width="8" stroke-linecap="round" />
      <path d="M 60 -130C 84 -158 108 -166 124 -160" fill="none" stroke="${highlightFill}" stroke-opacity="0.22" stroke-width="7" stroke-linecap="round" />
    `,
    'layered-short': `
      <path d="${makeHairPath(style)}" fill="${hairFill}" />
      <path d="M -106 -116C -70 -140 -30 -150 0 -148" fill="none" stroke="${highlightFill}" stroke-opacity="0.24" stroke-width="8" stroke-linecap="round" />
      <path d="M 106 -116C 70 -140 30 -150 0 -148" fill="none" stroke="${highlightFill}" stroke-opacity="0.24" stroke-width="8" stroke-linecap="round" />
    `,
    'sleek-long': `
      <path d="${makeHairPath(style)}" fill="${hairFill}" />
      <path d="M -110 -112C -104 -12 -98 64 -88 194" fill="none" stroke="${highlightFill}" stroke-opacity="0.2" stroke-width="8" stroke-linecap="round" />
      <path d="M 110 -112C 104 -12 98 64 88 194" fill="none" stroke="${highlightFill}" stroke-opacity="0.2" stroke-width="8" stroke-linecap="round" />
    `,
    'slick-back': `
      <path d="${makeHairPath(style)}" fill="${hairFill}" />
      <path d="M -86 -154C -20 -132 20 -132 86 -154" fill="none" stroke="${highlightFill}" stroke-opacity="0.28" stroke-width="10" stroke-linecap="round" />
    `,
    'long-wave': `
      <path d="${makeHairPath(style)}" fill="${hairFill}" />
      <path d="M -124 -58C -144 18 -132 96 -102 190" fill="none" stroke="${highlightFill}" stroke-opacity="0.24" stroke-width="10" stroke-linecap="round" />
      <path d="M 124 -58C 144 18 132 96 102 190" fill="none" stroke="${highlightFill}" stroke-opacity="0.24" stroke-width="10" stroke-linecap="round" />
    `,
  };

  return shapes[style] ?? shapes['layered-short'];
}

function renderFace(gender, camera, expression, palette, seed, hairStyle) {
  const faceWidth = gender === 'male' ? 96 : 84;
  const faceHeight = gender === 'male' ? 96 : 88;
  const eyeWidth = gender === 'male' ? 14 : 13;
  const eyeY = -16 + (camera.eyeYOffset ?? 0);
  const browY = eyeY - 26;
  const cheekY = gender === 'male' ? 22 : 18;
  const eyeTilt = expression.eyeTilt ?? 0;
  const pupilShiftX = expression.pupilShiftX ?? 0;
  const pupilShiftY = expression.pupilShiftY ?? 0;
  const hairline = gender === 'male' ? -62 : -56;
  const faceFill = `url(#skin-${seed})`;
  const shadowFill = `url(#skin-shadow-${seed})`;
  const eyeMode = camera.eyeMode ?? 'two';

  const leftEye = makeEyePath({
    x: camera.eyeLeftX ?? -40,
    y: eyeY,
    open: eyeMode === 'left' || eyeMode === 'right' ? 0.5 : 1,
    tilt: eyeTilt,
    wide: eyeMode === 'left' ? 1.1 : 1,
  });
  const rightEye = makeEyePath({
    x: camera.eyeRightX ?? 40,
    y: eyeY,
    open: eyeMode === 'left' || eyeMode === 'right' ? 0.5 : 1,
    tilt: eyeTilt,
    wide: eyeMode === 'right' ? 1.1 : 1,
  });

  const leftBrow = makeBrowPath({
    x: camera.eyeLeftX ?? -40,
    y: browY,
    tilt: expression.brow ?? 0,
  });
  const rightBrow = makeBrowPath({
    x: camera.eyeRightX ?? 40,
    y: browY,
    tilt: -(expression.brow ?? 0),
  });

  const mouth = makeMouthPath(expression.mouth ?? 'calm');
  const nose = eyeMode === 'left'
    ? 'M 12 -2C 20 10 21 20 18 32'
    : eyeMode === 'right'
      ? 'M -12 -2C -20 10 -21 20 -18 32'
      : 'M 0 -4C 8 8 10 22 6 34';

  const cheek = eyeMode === 'left'
    ? `<ellipse cx="${faceWidth / 2 - 26}" cy="${cheekY}" rx="16" ry="10" fill="${palette.main}" fill-opacity="0.16" />`
    : eyeMode === 'right'
      ? `<ellipse cx="${-(faceWidth / 2 - 26)}" cy="${cheekY}" rx="16" ry="10" fill="${palette.main}" fill-opacity="0.16" />`
      : `
        <ellipse cx="-28" cy="${cheekY}" rx="16" ry="10" fill="${palette.main}" fill-opacity="0.14" />
        <ellipse cx="28" cy="${cheekY}" rx="16" ry="10" fill="${palette.main}" fill-opacity="0.14" />
      `;

  const ear = gender === 'male'
    ? `<ellipse cx="${camera.eyeMode === 'right' ? -faceWidth / 2 + 6 : faceWidth / 2 - 6}" cy="-10" rx="10" ry="16" fill="${palette.deep}" fill-opacity="0.22" />`
    : `<ellipse cx="${camera.eyeMode === 'right' ? -faceWidth / 2 + 4 : faceWidth / 2 - 4}" cy="-10" rx="8" ry="14" fill="${palette.deep}" fill-opacity="0.16" />`;

  return `
    <g transform="translate(${camera.faceX},${camera.faceY}) rotate(${camera.faceRotate}) scale(${camera.faceScaleX},1)">
      <g opacity="0.18">
        <path d="M -78 -82C -44 -104 44 -104 78 -82C 74 -30 72 16 66 60C 60 102 34 130 0 138C -34 130 -60 102 -66 60C -72 16 -74 -30 -78 -82Z" fill="${palette.deep}" />
      </g>
      <path d="${makeFacePath(gender)}" fill="${faceFill}" />
      <path d="${makeFacePath(gender)}" fill="${shadowFill}" opacity="0.18" transform="translate(10,8)" />
      ${renderHair(hairStyle, palette, seed)}
      ${ear}
      ${cheek}
      ${eyeMode !== 'right' ? leftEye : ''}
      ${eyeMode !== 'left' ? rightEye : ''}
      ${leftBrow}
      ${rightBrow}
      <path d="${nose}" fill="none" stroke="#2b211b" stroke-opacity="0.5" stroke-width="6" stroke-linecap="round" />
      <path d="${mouth}" fill="none" stroke="#241a15" stroke-opacity="0.7" stroke-width="7" stroke-linecap="round" />
      <circle cx="${camera.eyeMode === 'right' ? -18 : 18}" cy="${eyeY + pupilShiftY - 8}" r="2.5" fill="#fffaf3" fill-opacity="0.8" />
      <path d="M -16 ${hairline}C -6 ${hairline - 14} 6 ${hairline - 14} 16 ${hairline}" fill="none" stroke="${palette.soft}" stroke-opacity="0.18" stroke-width="8" stroke-linecap="round" />
    </g>
  `;
}

function presetHairStyle(seed) {
  return pickFromHash(
    ['short-fade', 'bob', 'curl', 'layered-short', 'sleek-long', 'inward-bob', 'airy-short', 'slick-back', 'long-wave'],
    seed,
    6,
  );
}

function renderWorkArtwork(work) {
  const traits = resolveWorkArtwork(work);
  const { soft, main, deep } = traits.palette;
  const seed = traits.seed;
  const theme = traits.tagTheme;

  const bgStops = theme.accent === 'dark'
    ? ['#07101e', '#0d1625']
    : theme.accent === 'fresh'
      ? ['#191d27', '#0c1018']
      : ['#111723', '#070b12'];

  const accentSpot = theme.accent === 'calm' ? soft : main;
  const hairFillId = `hair-${seed}`;
  const skinId = `skin-${seed}`;
  const shadowId = `skin-shadow-${seed}`;

  return svgNode(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" role="img" aria-label="${escapeXml(work.title)} ${escapeXml(work.tag)} hairstyle artwork">
      <defs>
        <linearGradient id="bg-${seed}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgStops[0]}" />
          <stop offset="100%" stop-color="${bgStops[1]}" />
        </linearGradient>
        <radialGradient id="glow-${seed}" cx="50%" cy="34%" r="58%">
          <stop offset="0%" stop-color="${soft}" stop-opacity="0.7" />
          <stop offset="100%" stop-color="${main}" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="${hairFillId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${soft}" />
          <stop offset="46%" stop-color="${main}" />
          <stop offset="100%" stop-color="${deep}" />
        </linearGradient>
        <linearGradient id="${skinId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${traits.gender === 'male' ? '#f2d2b4' : '#f7d8c4'}" />
          <stop offset="100%" stop-color="${traits.gender === 'male' ? '#d8ab8e' : '#e7b597'}" />
        </linearGradient>
        <linearGradient id="${shadowId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${deep}" stop-opacity="0.42" />
          <stop offset="100%" stop-color="${deep}" stop-opacity="0" />
        </linearGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#bg-${seed})" />
      <circle cx="894" cy="178" r="226" fill="url(#glow-${seed})" opacity="0.9" />
      <circle cx="196" cy="768" r="170" fill="${accentSpot}" fill-opacity="0.12" />
      <circle cx="1120" cy="140" r="64" fill="${main}" fill-opacity="0.08" />
      <circle cx="140" cy="154" r="54" fill="${soft}" fill-opacity="0.08" />
      ${renderBackgroundMotifs(theme, traits.palette, seed)}
      <g transform="translate(600 504) rotate(${POSE_ROTATIONS[traits.pose] ?? 0})">
        ${renderClothing(traits.palette, traits.gender, theme)}
        <g transform="translate(0 -36)">
          ${renderFace(traits.gender, traits.camera, traits.expression, traits.palette, seed, traits.hair)}
        </g>
      </g>
      <path d="M 180 694C 252 626 344 596 446 596C 548 596 630 624 694 680C 760 624 844 596 948 596C 1052 596 1128 618 1180 662" fill="none" stroke="${soft}" stroke-opacity="0.18" stroke-width="20" stroke-linecap="round" />
      <path d="M 154 742C 268 700 392 680 526 680C 658 680 782 702 896 744" fill="none" stroke="${main}" stroke-opacity="0.12" stroke-width="10" stroke-linecap="round" />
      <rect x="92" y="92" width="240" height="72" rx="36" fill="#ffffff" fill-opacity="0.06" />
      <rect x="88" y="742" width="322" height="56" rx="28" fill="#ffffff" fill-opacity="0.06" />
    </svg>
  `);
}

export function makeSalonArtwork(seed = 'gold') {
  const [soft, main, deep] = buildPalette(seed);

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

export function makeWorkArtwork(work) {
  return renderWorkArtwork(work);
}
