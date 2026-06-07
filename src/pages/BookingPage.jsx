import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { buildTimeOptions, calculateTotalPrice, getAvailableBarbers, getQuote } from '../utils/booking';
import { addDays, formatDateInput, formatDateLabel, getRelativeDaysLabel, getWeekdayIndex } from '../utils/date';
import { ArtworkPanel, SectionHeader, StatusBadge, formatCurrency } from '../components/Ui';

function BookingSummary({ service, addons, barber, date, time, quote, mode }) {
  return (
    <aside className="summary-card">
      <h3>預約摘要</h3>
      {service ? (
        <ul>
          <li>
            服務<span>{service.name}</span>
          </li>
          <li>
            設計師<span>{mode === 'auto' ? '店家安排' : barber?.name ?? '尚未指定'}</span>
          </li>
          <li>
            日期<span>{date ? formatDateLabel(date) : '尚未選擇'}</span>
          </li>
          <li>
            時間<span>{time || '尚未選擇'}</span>
          </li>
          <li>
            加購<span>{addons.length ? addons.map((addon) => addon.name).join('、') : '無'}</span>
          </li>
        </ul>
      ) : (
        <p>先選服務，時間和總價就會一起更新。</p>
      )}
      <div className="summary-card__total">
        <span>總計</span>
        <strong>{formatCurrency(quote.totalPrice)}</strong>
      </div>
    </aside>
  );
}

export function BookingPage() {
  const { state, currentUser, createAppointment, busy } = useApp();
  const navigate = useNavigate();
  const services = state?.services?.filter((service) => service.isActive) ?? [];
  const addons = state?.addons?.filter((addon) => addon.isActive) ?? [];
  const barbers = state?.users?.filter((user) => user.role === 'barber' && user.isActive) ?? [];

  const getInitialDate = () => {
    let next = addDays(new Date(), 1);
    while (getWeekdayIndex(formatDateInput(next)) === 0) {
      next = addDays(next, 1);
    }
    return formatDateInput(next);
  };

  const [serviceId, setServiceId] = useState('');
  const [addonIds, setAddonIds] = useState([]);
  const [assignmentMode, setAssignmentMode] = useState('auto');
  const [barberId, setBarberId] = useState('');
  const [date, setDate] = useState(getInitialDate);
  const [time, setTime] = useState('');
  const [contactName, setContactName] = useState(currentUser?.name ?? '');
  const [contactPhone, setContactPhone] = useState(currentUser?.phone ?? '');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const service = useMemo(
    () => services.find((item) => item.id === serviceId) ?? null,
    [services, serviceId],
  );

  const selectedAddons = useMemo(
    () => addons.filter((addon) => addonIds.includes(addon.id)),
    [addons, addonIds],
  );

  const timeOptions = useMemo(() => {
    if (!service || !date) return [];
    return buildTimeOptions(date, service.durationMinutes);
  }, [service, date]);

  const availableBarbers = useMemo(() => {
    if (!service || !date || !time) return [];
    return getAvailableBarbers({
      barbers,
      barberProfiles: state?.barberProfiles ?? [],
      availabilitySlots: state?.availabilitySlots ?? [],
      appointments: state?.appointments ?? [],
      date,
      startTime: time,
      durationMinutes: service.durationMinutes,
    });
  }, [barbers, date, service, state?.appointments, state?.availabilitySlots, state?.barberProfiles, time]);

  const quote = useMemo(() => getQuote(service, selectedAddons), [service, selectedAddons]);

  const chosenBarber = useMemo(
    () => barbers.find((item) => item.id === barberId) ?? null,
    [barberId, barbers],
  );

  useEffect(() => {
    if (!serviceId && services[0]) {
      setServiceId(services[0].id);
    }
  }, [services, serviceId]);

  useEffect(() => {
    if (!timeOptions.length) return;
    if (!time || !timeOptions.includes(time)) {
      setTime(timeOptions[0]);
    }
  }, [timeOptions, time]);

  useEffect(() => {
    if (assignmentMode === 'auto') {
      setBarberId('');
      return;
    }

    if (!barberId && availableBarbers[0]) {
      setBarberId(availableBarbers[0].id);
    }
  }, [assignmentMode, availableBarbers, barberId]);

  const validationMessage = useMemo(() => {
    if (!service) return '請先選擇服務。';
    if (!date) return '請選擇日期。';
    if (!time) return '請選擇時間。';
    if (!timeOptions.includes(time)) return '目前選擇的日期沒有可用時間。';
    if (!contactName.trim()) return '請輸入聯絡姓名。';
    if (!/^09\d{8}$/.test(contactPhone.trim())) return '聯絡電話必須為 09 開頭的 10 碼。';
    if (assignmentMode === 'manual' && !barberId) return '請先指定一位設計師。';
    return '';
  }, [assignmentMode, barberId, contactName, contactPhone, date, service, time, timeOptions]);

  const handleAddonToggle = (addonId) => {
    setAddonIds((current) =>
      current.includes(addonId) ? current.filter((id) => id !== addonId) : [...current, addonId],
    );
  };

  const submitBooking = async () => {
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    if (assignmentMode === 'manual' && !availableBarbers.some((item) => item.id === barberId)) {
      setError('你指定的設計師在這個時段不可用。');
      return;
    }

    try {
      setError('');
      const appointment = await createAppointment({
        serviceId,
        addonIds,
        barberId: assignmentMode === 'manual' ? barberId : '',
        date,
        startTime: time,
        contactName,
        contactPhone,
      });
      setResult(appointment);
    } catch (err) {
      setError(err.message || '預約失敗');
    }
  };

  if (result) {
    return (
      <section className="content-section">
        <SectionHeader
          eyebrow="預約完成"
          title="你的預約已送出"
          description="我們會先保留這筆預約，接著依照實際時段安排。"
        />
        <div className="success-card">
          <div>
            <StatusBadge status={result.status} />
            <h3>{result.serviceNameSnapshot}</h3>
            <p>
              {result.appointmentDate} {result.startTime} - {result.endTime}
            </p>
            <p>設計師：{result.barberNameSnapshot}</p>
            <p>預約編號：{result.id}</p>
          </div>
          <ArtworkPanel
            label="預約完成"
            title="接下來只要等通知"
            description="如果需要調整時間，店家會再和你聯絡。"
            tone="gold"
            className="artwork-panel--success"
          />
          <div className="success-card__actions">
            <button type="button" className="button button--gold" onClick={() => navigate('/appointments')}>
              查看我的預約
            </button>
            <button type="button" className="button button--ghost" onClick={() => navigate('/')}>
              回首頁
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="content-section booking-page">
      <div className="booking-page__hero">
        <div className="booking-page__hero-copy">
          <SectionHeader
            eyebrow="線上預約"
            title="把服務和時間，一次選好"
            description="只保留客人需要的資訊，讓你快速完成預約。"
          />
        </div>
        <ArtworkPanel
          label="今日靈感"
          title="俐落、乾淨、好整理的造型"
          description="適合想要快速整理，也想保留風格感的客人。"
          tone="rose"
          className="artwork-panel--booking"
        />
      </div>

      <div className="booking-layout">
        <div className="booking-flow">
          {error ? <div className="form-alert">{error}</div> : null}

          <section className="step-panel">
            <SectionHeader
              eyebrow="服務選擇"
              title="選擇你要的服務"
              description="先挑今天最需要的整理或造型。"
            />
            <div className="grid grid--services">
              {services.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={serviceId === item.id ? 'select-card is-selected' : 'select-card'}
                  onClick={() => setServiceId(item.id)}
                >
                  <span className="select-card__badge">服務</span>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <strong>{formatCurrency(item.basePrice)}</strong>
                  <small>{item.durationMinutes} 分鐘</small>
                </button>
              ))}
            </div>
          </section>

          <section className="step-panel">
            <SectionHeader
              eyebrow="加購"
              title="可選加購項目"
              description="想加強舒適感或保養效果，可以一起選。"
            />
            <div className="addons-grid">
              {addons.map((addon) => (
                <button
                  key={addon.id}
                  type="button"
                  className={addonIds.includes(addon.id) ? 'addon-card is-selected' : 'addon-card'}
                  onClick={() => handleAddonToggle(addon.id)}
                >
                  <span>{formatCurrency(addon.price)}</span>
                  <strong>{addon.name}</strong>
                  <p>{addon.description}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="step-panel">
            <SectionHeader
              eyebrow="設計師"
              title="是否指定設計師"
              description="可以交給店裡安排，也能自己挑設計師。"
            />
            <div className="mode-switch">
              <button
                type="button"
                className={assignmentMode === 'auto' ? 'mode-switch__button is-active' : 'mode-switch__button'}
                onClick={() => setAssignmentMode('auto')}
              >
                店家安排
              </button>
              <button
                type="button"
                className={assignmentMode === 'manual' ? 'mode-switch__button is-active' : 'mode-switch__button'}
                onClick={() => setAssignmentMode('manual')}
              >
                指定設計師
              </button>
            </div>

            {assignmentMode === 'manual' ? (
              <>
                <div className="grid grid--barbers">
                  {availableBarbers.map((barber) => (
                    <button
                      key={barber.id}
                      type="button"
                      className={barberId === barber.id ? 'select-card is-selected' : 'select-card'}
                      onClick={() => setBarberId(barber.id)}
                    >
                      <span className="select-card__badge">可用</span>
                      <h3>{barber.profile?.displayName ?? barber.name}</h3>
                      <p>{barber.profile?.specialty ?? '專業造型設計'}</p>
                      <small>{barber.profile?.bio ?? '擅長客製化造型。'}</small>
                    </button>
                  ))}
                </div>

                {!availableBarbers.length ? (
                  <div className="form-alert form-alert--neutral">
                    這個時段沒有可用設計師，請改成店家安排或更換時間。
                  </div>
                ) : null}
              </>
            ) : (
              <div className="auto-box">
                <p>店家會依照你選的服務與時段，安排最合適的設計師。</p>
                <small>
                  目前可用候選：
                  {availableBarbers.length
                    ? availableBarbers.map((barber) => barber.profile?.displayName ?? barber.name).join('、')
                    : '暫時沒有可用人選'}
                </small>
              </div>
            )}
          </section>

          <section className="step-panel">
            <SectionHeader
              eyebrow="時間與聯絡"
              title="選定日期、時間與聯絡資料"
              description="把時間和聯絡方式填好，就能送出。"
            />
            <div className="form-grid">
              <label>
                預約日期
                <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
                <small>{getRelativeDaysLabel(date)}</small>
              </label>
              <label>
                預約時間
                <select value={time} onChange={(event) => setTime(event.target.value)}>
                  <option value="">請選擇時間</option>
                  {timeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                聯絡姓名
                <input
                  type="text"
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                />
              </label>
              <label>
                聯絡電話
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                />
              </label>
            </div>
          </section>

          <div className="step-actions">
            <button type="button" className="button button--ghost" onClick={() => navigate('/')}>
              先逛逛作品
            </button>
            <button type="button" className="button button--gold" onClick={submitBooking} disabled={busy}>
              {busy ? '送出中...' : '確認送出'}
            </button>
          </div>
        </div>

        <BookingSummary
          service={service}
          addons={selectedAddons}
          barber={chosenBarber}
          date={date}
          time={time}
          quote={quote}
          mode={assignmentMode}
        />
      </div>

      <section className="content-section">
        <div className="callout">
          <p>目前預估金額：{formatCurrency(calculateTotalPrice(service, selectedAddons))}</p>
        </div>
      </section>
    </section>
  );
}
