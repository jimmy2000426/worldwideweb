export const designerCatalog = [
  {
    id: 'alex',
    name: 'Alex',
    specialty: '油頭 / 漸層推剪',
    vibe: '輪廓乾淨，線條俐落。',
    bio: '擅長先看頭型與髮流，再把層次和分線收得很乾淨。想要好整理、又看起來有精神的造型，通常都很適合找他。',
    philosophy: '把細節修到位，造型就會自然站得住。',
    strengths: ['油頭造型', '漸層推剪', '頭型修飾'],
    signature: '俐落分線與飽滿後腦輪廓',
    featuredServices: ['男士剪髮', '頭型修飾', '日常整理建議'],
    tone: 'gold',
    image: '/designer-portraits/portrait-6.png',
  },
  {
    id: 'ben',
    name: 'BEN',
    specialty: '燙髮 / 染髮設計',
    vibe: '偏日韓感，顏色和層次都細緻。',
    bio: '喜歡把燙度、髮色和臉部比例一起考量，做出柔和但不扁塌的線條。適合想要更有層次、又保留質感的人。',
    philosophy: '髮型不只是改變長度，而是重新整理整體比例。',
    strengths: ['燙染設計', '髮色提亮', '層次感修剪'],
    signature: '霧感色系與柔順捲度',
    featuredServices: ['燙髮設計', '染髮設計', '髮色維護'],
    tone: 'rose',
    image: '/designer-portraits/portrait-5.png',
  },
  {
    id: 'joy',
    name: 'Joy',
    specialty: '短髮 / 質感造型',
    vibe: '擅長把日常髮型做得更有精神。',
    bio: '很會處理短髮的比例與走向，讓造型看起來乾淨但不死板。想要每天快速整理、又保有俐落感的人會很喜歡她的做法。',
    philosophy: '短髮最重要的是輪廓，耐看才是關鍵。',
    strengths: ['短髮設計', '自然蓬鬆', '日常整理'],
    signature: '輕盈層次與清爽輪廓',
    featuredServices: ['短髮設計', '層次剪裁', '造型整理'],
    tone: 'ink',
    image: '/designer-portraits/portrait-3.png',
  },
  {
    id: 'mila',
    name: 'Mila',
    specialty: '長髮 / 柔霧染髮',
    vibe: '適合想保留柔軟感的客人。',
    bio: '擅長把長髮做得輕盈、有空氣感，也很重視髮絲的光澤和柔和轉折。整體風格偏溫柔，卻不會缺少存在感。',
    philosophy: '保留髮絲的呼吸感，造型就會更耐看。',
    strengths: ['長髮設計', '柔霧染髮', '空氣感層次'],
    signature: '柔亮髮色與輕盈層次',
    featuredServices: ['長髮整理', '染髮提亮', '柔和層次'],
    tone: 'moss',
    image: '/designer-portraits/portrait-4.png',
  },
  {
    id: 'neo',
    name: 'Neo',
    specialty: '男生髮 / 油頭剪裁',
    vibe: '重視輪廓與整理手感。',
    bio: '會先確認你平常的整理習慣，再決定層次和長度。重視髮型的實用性，也希望剪完能維持很久的線條。',
    philosophy: '能夠每天整理的造型，才是真的完成。',
    strengths: ['男士短髮', '油頭剪裁', '耐整理髮型'],
    signature: '乾淨側邊與扎實髮頂',
    featuredServices: ['男士剪髮', '側邊修整', '造型教學'],
    tone: 'gold',
    image: '/designer-portraits/portrait-2.png',
  },
  {
    id: 'luna',
    name: 'Luna',
    specialty: '中長髮 / 空氣感',
    vibe: '自然、輕盈，日常也很好打理。',
    bio: '擅長做出不厚重的中長髮輪廓，讓頭髮在不同角度都保有輕盈線條。喜歡自然、舒服、但仍有風格的客人通常很合拍。',
    philosophy: '讓造型跟著髮流走，會比硬做更有生命力。',
    strengths: ['中長髮', '空氣感瀏海', '柔和線條'],
    signature: '輕薄瀏海與柔軟包覆感',
    featuredServices: ['中長髮設計', '瀏海調整', '自然整理'],
    tone: 'rose',
    image: '/designer-portraits/portrait-1.png',
  },
];

export const designerGroups = [
  ['alex', 'ben', 'joy'],
  ['mila', 'neo', 'luna'],
];

export function getDesignerById(designerId) {
  return designerCatalog.find((designer) => designer.id === designerId) ?? null;
}

export function getDesignerGroup(groupIndex) {
  return designerGroups[groupIndex].map((designerId) => getDesignerById(designerId)).filter(Boolean);
}
