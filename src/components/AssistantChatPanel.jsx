import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArtworkPanel, FeaturePill, SectionHeader, formatCurrency } from './Ui';
import { addDays, formatDateInput, formatDateLabel } from '../utils/date';
import { buildTimeOptions, calculateAppointmentEnd, getAvailableBarbers, toMinutes } from '../utils/booking';
import * as api from '../services/api';

const quickPrompts = [
  '今天晚上想剪髮',
  '明天最早什麼時候可以約',
  '我想指定 Alex',
  '今天有沒有染髮空檔',
];

function normalizeQueryText(value) {
  return (value ?? '').toLowerCase().replace(/\s+/g, '');
}

function findServiceFromText(message, services) {
  const normalized = normalizeQueryText(message);
  const keywordMap = {
    'service-cut': ['洗剪', '剪髮', '剪发', '修剪', 'cut'],
    'service-color': ['染髮', '染发', '染色', '染', 'color'],
    'service-care': ['護髮', '頭皮', '養護', 'care'],
  };

  for (const service of services) {
    const serviceName = normalizeQueryText(service.name);
    if (serviceName && normalized.includes(serviceName)) {
      return service;
    }

    const keywords = keywordMap[service.id] ?? [];
    if (keywords.some((keyword) => normalized.includes(normalizeQueryText(keyword)))) {
      return service;
    }
  }

  return null;
}

function findBarberFromText(message, barbers, barberProfiles) {
  const normalized = normalizeQueryText(message);
  if (!normalized) return null;

  for (const barber of barbers) {
    const profile = barberProfiles.find((item) => item.userId === barber.id);
    const candidates = [barber.name, profile?.displayName, profile?.specialty].filter(Boolean);
    if (candidates.some((candidate) => normalized.includes(normalizeQueryText(candidate)))) {
      return barber;
    }
  }

  return null;
}

function parseDateFromText(message) {
  const normalized = normalizeQueryText(message);
  const today = formatDateInput(new Date());

  if (normalized.includes('今天') || normalized.includes('今日')) {
    return { date: today, label: '今天' };
  }
  if (normalized.includes('明天') || normalized.includes('明日')) {
    const date = formatDateInput(addDays(new Date(), 1));
    return { date, label: '明天' };
  }
  if (normalized.includes('後天')) {
    const date = formatDateInput(addDays(new Date(), 2));
    return { date, label: '後天' };
  }

  const explicit = message.match(/(?<!\d)(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (explicit) {
    const [, year, month, day] = explicit;
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { date, label: formatDateLabel(date) };
  }

  return { date: null, label: null };
}

function parseTimePreferenceFromText(message) {
  const normalized = normalizeQueryText(message);

  if (normalized.includes('最晚') || normalized.includes('越晚')) {
    return { label: '晚一點', start: null, end: null, sort: 'latest' };
  }
  if (normalized.includes('最早') || normalized.includes('越早')) {
    return { label: '最早', start: null, end: null, sort: 'earliest' };
  }

  const ranges = [
    { keywords: ['早上', '上午'], start: 10 * 60, end: 12 * 60, label: '早上' },
    { keywords: ['中午'], start: 12 * 60, end: 14 * 60, label: '中午' },
    { keywords: ['下午'], start: 13 * 60, end: 17 * 60, label: '下午' },
    { keywords: ['傍晚'], start: 17 * 60, end: 18 * 60 + 30, label: '傍晚' },
    { keywords: ['晚上'], start: 18 * 60, end: 19 * 60, label: '晚上' },
  ];

  for (const range of ranges) {
    if (range.keywords.some((keyword) => normalized.includes(keyword))) {
      return { ...range, sort: 'earliest' };
    }
  }

  const explicit = message.match(/(?<![\d-])(?:(上午|早上|中午|下午|傍晚|晚上))?\s*(\d{1,2})(?::(\d{2}))?\s*點?/);
  if (explicit) {
    const period = explicit[1];
    let hour = Number(explicit[2]);
    const minute = Number(explicit[3] || 0);

    if (period === '下午' || period === '傍晚' || period === '晚上') {
      if (hour < 12) hour += 12;
    } else if ((period === '上午' || period === '早上') && hour === 12) {
      hour = 0;
    } else if (!period && hour >= 1 && hour <= 7) {
      hour += 12;
    }

    const target = hour * 60 + minute;
    return {
      label: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      start: Math.max(10 * 60, target - 60),
      end: Math.min(19 * 60, target + 60),
      target,
      sort: 'closest',
    };
  }

  return { label: null, start: null, end: null, target: null, sort: 'earliest' };
}

function buildLocalAssistantReply(message, state) {
  const services = state?.services?.filter((service) => service.isActive) ?? [];
  const barbers = state?.users?.filter((user) => user.role === 'barber' && user.isActive) ?? [];
  const barberProfiles = state?.barberProfiles ?? [];
  const availabilitySlots = state?.availabilitySlots ?? [];
  const appointments = state?.appointments ?? [];

  const service = findServiceFromText(message, services);
  const parsedDate = parseDateFromText(message);
  const timePreference = parseTimePreferenceFromText(message);
  const barber = findBarberFromText(message, barbers, barberProfiles);

  const today = formatDateInput(new Date());
  const candidateDates = parsedDate.date
    ? [parsedDate.date, ...Array.from({ length: 6 }, (_, index) => formatDateInput(addDays(new Date(parsedDate.date), index + 1)))]
    : Array.from({ length: 7 }, (_, index) => formatDateInput(addDays(new Date(), index)));

  const suggestions = [];

  if (service) {
    for (const date of candidateDates) {
      if (suggestions.length >= 3) break;
      if (date < today) continue;
      if (new Date(`${date}T00:00:00`).getDay() === 0) continue;

      let timeOptions = buildTimeOptions(date, service.durationMinutes);
      if (timePreference.start != null || timePreference.end != null) {
        timeOptions = timeOptions.filter((time) => {
          const minutes = toMinutes(time);
          if (timePreference.start != null && minutes < timePreference.start) return false;
          if (timePreference.end != null && minutes > timePreference.end) return false;
          return true;
        });
      }

      if (timePreference.sort === 'latest') {
        timeOptions = [...timeOptions].reverse();
      }

      for (const time of timeOptions) {
        const availableBarbers = getAvailableBarbers({
          barbers,
          barberProfiles,
          availabilitySlots,
          appointments,
          date,
          startTime: time,
          durationMinutes: service.durationMinutes,
        });

        const chosenBarber = barber
          ? availableBarbers.find((item) => item.id === barber.id)
          : availableBarbers[0];

        if (!chosenBarber) continue;

        suggestions.push({
          date,
          startTime: time,
          endTime: calculateAppointmentEnd(time, service.durationMinutes),
          serviceId: service.id,
          serviceName: service.name,
          barberId: chosenBarber.id,
          barberName: chosenBarber.name,
          availableBarbers: availableBarbers.map((item) => item.name),
        });

        break;
      }
    }
  }

  const missing = [];
  if (!service) missing.push('service');

  let reply = '我先幫你看一下。';
  if (missing.length) {
    reply = '我可以幫你查空檔，不過先告訴我想做哪一種服務，像是剪髮、染髮或護髮。';
  } else if (suggestions.length) {
    reply = `我幫你找到 ${suggestions.length} 個可約時段，先看這幾個最接近你需求的選項。`;
  } else if (parsedDate.date) {
    reply = `${parsedDate.label || '這個日期'} 目前沒有合適空檔，我幫你再往後找幾天。`;
  } else {
    reply = '目前還沒找到合適空檔，我可以繼續幫你往後找。';
  }

  return {
    message: reply,
    parsed: {
      intent: 'book',
      serviceId: service?.id ?? null,
      serviceName: service?.name ?? null,
      dateValue: parsedDate.date ?? null,
      dateLabel: parsedDate.label ?? null,
      timeLabel: timePreference.label ?? null,
      barberId: barber?.id ?? null,
      barberName: barber ? barber.name : null,
      missing,
      needsClarification: missing.length > 0,
    },
    suggestions,
    canBook: Boolean(service && suggestions.length),
  };
}

function MessageBubble({ message, onSelectSuggestion, compact = false }) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <article
      className={
        isUser
          ? 'assistant-chat__bubble assistant-chat__bubble--user'
          : 'assistant-chat__bubble assistant-chat__bubble--assistant'
      }
    >
      {compact && isAssistant ? (
        <div className="assistant-chat__avatar" aria-hidden="true">
          <img src="/icon.png" alt="" />
        </div>
      ) : null}
      <div className="assistant-chat__bubble-body">
        {!compact ? (
          <div className="assistant-chat__bubble-meta">
            <strong>{isUser ? '你' : '預約小幫手'}</strong>
          </div>
        ) : null}
        <p>{message.content}</p>
      </div>
      {message.suggestions?.length ? (
        <div className="assistant-chat__suggestions">
          {message.suggestions.map((suggestion) => (
            <button
              key={`${suggestion.date}-${suggestion.startTime}-${suggestion.serviceId}-${suggestion.barberId ?? 'auto'}`}
              type="button"
              className="assistant-suggestion-card"
              onClick={() => onSelectSuggestion?.(suggestion)}
            >
              <div className="assistant-suggestion-card__head">
                <strong>{formatDateLabel(suggestion.date)}</strong>
                <span>
                  {suggestion.startTime} - {suggestion.endTime}
                </span>
              </div>
              <div className="assistant-suggestion-card__body">
                <p>{suggestion.serviceName}</p>
                <small>
                  {suggestion.barberName
                    ? `指定設計師：${suggestion.barberName}`
                    : suggestion.availableBarbers?.length
                      ? `可安排：${suggestion.availableBarbers.join('、')}`
                      : '店家可安排'}
                </small>
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function AssistantChatPanel({ mode = 'page', onClose }) {
  const { state, currentUser, createAppointment, busy } = useApp();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: '告訴我你想做的服務、時間偏好或想指定的設計師，我幫你找最近可約的時段。',
    },
  ]);
  const [querying, setQuerying] = useState(false);
  const [queryError, setQueryError] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [latestParsed, setLatestParsed] = useState(null);
  const [booking, setBooking] = useState(false);

  const services = state?.services?.filter((service) => service.isActive) ?? [];
  const serviceById = useMemo(() => new Map(services.map((service) => [service.id, service])), [services]);

  const handleQuery = async (messageText) => {
    const text = messageText.trim();
    if (!text || querying) return;

    setInput('');
    setQueryError('');
    setBookingError('');
    setBookingSuccess(null);
    setSelectedSuggestion(null);
    setLatestParsed(null);
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: 'user', content: text }]);

    setQuerying(true);
    try {
      const response = await api.queryAssistant(text);
      setLatestParsed(response.parsed ?? null);
      setQueryError('');
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.message || '我幫你查到以下可約時段。',
          suggestions: response.suggestions ?? [],
          canBook: response.canBook,
        },
      ]);
    } catch (error) {
      const fallback = buildLocalAssistantReply(text, state ?? {});
      if (fallback) {
        setLatestParsed(fallback.parsed ?? null);
        setQueryError('');
        setMessages((current) => [
          ...current,
          { id: `assistant-${Date.now()}`, role: 'assistant', content: fallback.message, suggestions: fallback.suggestions ?? [] },
        ]);
        return;
      }

      const message = error.message || '查詢失敗，請稍後再試。';
      setQueryError(message);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content: message,
        },
      ]);
    } finally {
      setQuerying(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    setInput(prompt);
    void handleQuery(prompt);
  };

  const appendAssistantReply = (content) => {
    setMessages((current) => [
      ...current,
      {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content,
      },
    ]);
  };

  const handleBookSuggestion = async (suggestion) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setBookingError('');
    setBookingSuccess(null);
    setSelectedSuggestion(suggestion);
    setBooking(true);

    try {
      const appointment = await createAppointment({
        serviceId: suggestion.serviceId,
        barberId: suggestion.barberId ?? '',
        date: suggestion.date,
        startTime: suggestion.startTime,
        contactName: currentUser.name,
        contactPhone: currentUser.phone,
      });

      setBookingSuccess(appointment);
      setSelectedSuggestion(null);
      appendAssistantReply(
        `已幫你預約完成：${formatDateLabel(appointment.appointmentDate)} ${appointment.startTime} - ${appointment.endTime}，服務是 ${appointment.serviceNameSnapshot}。`,
      );
    } catch (error) {
      setBookingError(error.message || '預約建立失敗。');
    } finally {
      setBooking(false);
    }
  };

  const selectedService = latestParsed?.serviceId ? serviceById.get(latestParsed.serviceId) : null;
  const lastSuggestions = messages.at(-1)?.suggestions ?? [];
  const hasInput = input.trim().length > 0;

  if (mode === 'dock') {
    return (
      <section className="assistant-dock-shell">
        <button
          type="button"
          className="assistant-dock-shell__close"
          onClick={onClose}
          aria-label="關閉聊天窗"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <section className="assistant-chat assistant-chat--dock">
          <div className="assistant-chat__stream assistant-chat__stream--dock">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} onSelectSuggestion={handleBookSuggestion} compact />
            ))}
          </div>

          <div className="assistant-chat__composer assistant-chat__composer--dock">
            <div className="assistant-chat__composer-row">
              <label className="assistant-chat__input assistant-chat__input--single">
                <input
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void handleQuery(input);
                    }
                  }}
                  placeholder="例如：今天晚上想剪髮，有空檔嗎？"
                  aria-label="輸入你的需求"
                />
                {hasInput ? (
                  <button
                    type="button"
                    className="assistant-chat__clear"
                    onClick={() => setInput('')}
                    aria-label="清除輸入"
                  >
                    ×
                  </button>
                ) : null}
              </label>

              <button
                type="button"
                className="assistant-chat__send"
                onClick={() => void handleQuery(input)}
                disabled={querying || booking || busy || !hasInput}
                aria-label={querying ? '查詢中' : '送出'}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h10.2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M11.6 5.8 18 12l-6.4 6.2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {queryError || bookingError ? <div className="form-alert">{queryError || bookingError}</div> : null}
          </div>
        </section>
      </section>
    );
  }

  return (
    <section className={mode === 'dialog' ? 'assistant-page assistant-page--dialog' : 'assistant-page'}>
      {mode === 'dialog' ? (
        <div className="assistant-page__dialog-head">
          <div>
            <p className="section-eyebrow">AI 預約助理</p>
            <h2>聊天對話框</h2>
          </div>
          {onClose ? (
            <button type="button" className="button button--ghost" onClick={onClose}>
              關閉
            </button>
          ) : null}
        </div>
      ) : (
        <div className="assistant-page__hero">
          <div className="assistant-page__hero-copy">
            <SectionHeader
              eyebrow="AI 預約助理"
              title="用一句話找出今天或最近的可約空檔"
              description="你可以直接說『今天晚上想剪髮』、『明天最早什麼時候可以約』，我會幫你抓出最接近的時段。"
            />
            <div className="assistant-page__chips">
              <FeaturePill>查空檔</FeaturePill>
              <FeaturePill>指定設計師</FeaturePill>
              <FeaturePill>直接預約</FeaturePill>
            </div>
          </div>
          <ArtworkPanel
            label="24 小時預約小幫手"
            title="把找時間這件事交給我"
            description="先查、再選、最後一鍵完成預約。"
            tone="gold"
            className="assistant-page__artwork"
          />
        </div>
      )}

      <div className={mode === 'dialog' ? 'assistant-page__layout assistant-page__layout--dialog' : 'assistant-page__layout'}>
        <section className="assistant-chat">
          <div className="assistant-chat__stream">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} onSelectSuggestion={setSelectedSuggestion} />
            ))}
          </div>

          <div className="assistant-chat__composer">
            <div className="assistant-chat__quick-prompts" aria-label="快速提問">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="assistant-chat__prompt"
                  onClick={() => handleQuickPrompt(prompt)}
                  disabled={querying || booking || busy}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <label className="assistant-chat__input">
              <span>輸入你的需求</span>
              <textarea
                rows="3"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="例如：今天晚上想剪髮，有空檔嗎？"
              />
            </label>

            {queryError || bookingError ? <div className="form-alert">{queryError || bookingError}</div> : null}

            <div className="assistant-chat__actions">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => {
                  setInput('');
                  setSelectedSuggestion(null);
                }}
                disabled={querying || booking || busy}
              >
                清除
              </button>
              <button
                type="button"
                className="button button--gold"
                onClick={() => void handleQuery(input)}
                disabled={querying || booking || busy || !input.trim()}
              >
                {querying ? '查詢中…' : '幫我查空檔'}
              </button>
            </div>
          </div>
        </section>

        <aside className="assistant-sidebar">
          <article className="assistant-panel">
            <div className="assistant-panel__head">
              <h3>目前解析結果</h3>
              {latestParsed?.needsClarification ? <span className="assistant-panel__flag">需要補充</span> : null}
            </div>

            {latestParsed ? (
              <ul className="assistant-panel__list">
                <li>
                  服務<span>{latestParsed.serviceName ?? '尚未辨識'}</span>
                </li>
                <li>
                  日期<span>{latestParsed.dateValue ? formatDateLabel(latestParsed.dateValue) : '最近可約'}</span>
                </li>
                <li>
                  時間<span>{latestParsed.timeLabel ?? '不限定'}</span>
                </li>
                <li>
                  設計師<span>{latestParsed.barberName ?? '店家安排'}</span>
                </li>
              </ul>
            ) : (
              <p className="assistant-panel__empty">還沒有開始查詢，先輸入一句需求試試看。</p>
            )}

            {selectedService ? (
              <div className="assistant-panel__service">
                <strong>{selectedService.name}</strong>
                <span>
                  {formatCurrency(selectedService.basePrice)} 起，約 {selectedService.durationMinutes} 分鐘
                </span>
              </div>
            ) : null}
          </article>

          <article className="assistant-panel assistant-panel--soft">
            <div className="assistant-panel__head">
              <h3>可約時段</h3>
              <span>{lastSuggestions.length} 筆</span>
            </div>

            {lastSuggestions.length ? (
              <div className="assistant-slot-list">
                {lastSuggestions.map((suggestion) => {
                  const isSelected =
                    selectedSuggestion &&
                    selectedSuggestion.date === suggestion.date &&
                    selectedSuggestion.startTime === suggestion.startTime &&
                    selectedSuggestion.serviceId === suggestion.serviceId;

                  return (
                    <button
                      key={`${suggestion.date}-${suggestion.startTime}-${suggestion.serviceId}-${suggestion.barberId ?? 'auto'}`}
                      type="button"
                      className={isSelected ? 'assistant-slot-card is-selected' : 'assistant-slot-card'}
                      onClick={() => setSelectedSuggestion(suggestion)}
                    >
                      <strong>{formatDateLabel(suggestion.date)}</strong>
                      <span>
                        {suggestion.startTime} - {suggestion.endTime}
                      </span>
                      <small>
                        {suggestion.barberName
                          ? `指定 ${suggestion.barberName}`
                          : suggestion.availableBarbers?.length
                            ? suggestion.availableBarbers.join('、')
                            : '店家安排'}
                      </small>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="assistant-panel__empty">查到空檔後，這裡會列出最適合的建議時間。</p>
            )}
          </article>

          <article className="assistant-panel assistant-panel--confirm">
            <div className="assistant-panel__head">
              <h3>確認預約</h3>
              <span>{selectedSuggestion ? '已選取' : '尚未選取'}</span>
            </div>

            {selectedSuggestion ? (
              <>
                <p className="assistant-panel__confirm-line">
                  {formatDateLabel(selectedSuggestion.date)} {selectedSuggestion.startTime} - {selectedSuggestion.endTime}
                </p>
                <p className="assistant-panel__confirm-line">{selectedSuggestion.serviceName}</p>
                <p className="assistant-panel__confirm-line">
                  {selectedSuggestion.barberName ? `設計師：${selectedSuggestion.barberName}` : '設計師：店家安排'}
                </p>
                <button
                  type="button"
                  className="button button--gold button--full"
                  onClick={() => void handleBookSuggestion(selectedSuggestion)}
                  disabled={booking || busy}
                >
                  {booking ? '送出中…' : '確認預約'}
                </button>
              </>
            ) : (
              <p className="assistant-panel__empty">先從右側挑一個時段，再直接送出預約。</p>
            )}
          </article>

          {bookingSuccess ? (
            <article className="assistant-panel assistant-panel--success">
              <div className="assistant-panel__head">
                <h3>預約完成</h3>
                <span>已送出</span>
              </div>
              <p className="assistant-panel__confirm-line">{bookingSuccess.serviceNameSnapshot}</p>
              <p className="assistant-panel__confirm-line">
                {formatDateLabel(bookingSuccess.appointmentDate)} {bookingSuccess.startTime} - {bookingSuccess.endTime}
              </p>
              <Link className="button button--ghost button--full" to="/appointments">
                前往我的預約
              </Link>
            </article>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
