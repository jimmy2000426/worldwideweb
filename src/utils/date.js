export function pad2(value) {
  return String(value).padStart(2, '0');
}

export function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function formatDateInput(date) {
  const value = new Date(date);
  return [
    value.getFullYear(),
    pad2(value.getMonth() + 1),
    pad2(value.getDate()),
  ].join('-');
}

export function formatDateLabel(dateInput) {
  const date = new Date(`${dateInput}T00:00:00`);
  const weekdayMap = ['日', '一', '二', '三', '四', '五', '六'];

  return `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(
    date.getDate(),
  )}（週${weekdayMap[date.getDay()]}）`;
}

export function getWeekdayIndex(dateInput) {
  return new Date(`${dateInput}T00:00:00`).getDay();
}

export function isToday(dateInput) {
  return formatDateInput(new Date()) === dateInput;
}

export function isPastDate(dateInput) {
  return formatDateInput(new Date()) > dateInput;
}

export function formatDateTime(dateInput, timeInput) {
  return `${dateInput} ${timeInput}`;
}

export function formatCreatedAt(input) {
  const date = new Date(input);
  return `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(
    date.getDate(),
  )} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function getRelativeDaysLabel(dateInput) {
  const diff = Math.round(
    (new Date(`${dateInput}T00:00:00`).getTime() -
      new Date(`${formatDateInput(new Date())}T00:00:00`).getTime()) /
      86400000,
  );

  if (diff === 0) return '今天';
  if (diff === 1) return '明天';
  if (diff === 2) return '後天';
  if (diff > 2) return `未來 ${diff} 天`;
  return '過去日期';
}

export function combineDateTime(dateInput, timeInput) {
  return new Date(`${dateInput}T${timeInput}:00`);
}
