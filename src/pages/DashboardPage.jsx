import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { SectionHeader, StatCard, StatusBadge, formatCurrency } from '../components/Ui';
import { buildTimeOptions, getAvailableBarbers } from '../utils/booking';
import { formatDateLabel, formatDateInput } from '../utils/date';

function canRescheduleAppointment(status) {
  return ['待確認', '已確認'].includes(status);
}

function AppointmentRow({ appointment, onConfirm, onComplete, onCancel, onEdit }) {
  const canConfirm = appointment.status === '待確認';
  const canComplete = appointment.status === '已確認';
  const canCancel = ['待確認', '已確認'].includes(appointment.status);
  const canReschedule = canRescheduleAppointment(appointment.status);

  return (
    <tr>
      <td>
        <strong>{appointment.serviceNameSnapshot}</strong>
        <small>{appointment.id}</small>
      </td>
      <td>{appointment.customerNameSnapshot}</td>
      <td>{appointment.barberNameSnapshot}</td>
      <td>
        {formatDateLabel(appointment.appointmentDate)}
        <small>
          {appointment.startTime} - {appointment.endTime}
        </small>
      </td>
      <td>
        <StatusBadge status={appointment.status} />
      </td>
      <td>{formatCurrency(appointment.totalPriceSnapshot)}</td>
      <td className="table-actions">
        {canConfirm ? (
          <button type="button" className="table-action table-action--gold table-action--primary" onClick={() => onConfirm(appointment.id)}>
            確認
          </button>
        ) : null}
        {canComplete ? (
          <button type="button" className="table-action table-action--success table-action--primary" onClick={() => onComplete(appointment.id)}>
            完成
          </button>
        ) : null}
        {canCancel ? (
          <button type="button" className="table-action table-action--ghost table-action--danger" onClick={() => onCancel(appointment.id)}>
            取消
          </button>
        ) : null}
        {canReschedule ? (
          <button type="button" className="table-action table-action--edit" onClick={() => onEdit(appointment)}>
            改期
          </button>
        ) : null}
      </td>
    </tr>
  );
}

function EditPanel({ appointment, state, onSave, onClose }) {
  const canReschedule = canRescheduleAppointment(appointment.status);
  const service = state.services.find((item) => item.id === appointment.serviceId);
  const duration = service?.durationMinutes ?? appointment.serviceDurationSnapshot;
  const [date, setDate] = useState(appointment.appointmentDate);
  const [time, setTime] = useState(appointment.startTime);
  const [barberId, setBarberId] = useState(appointment.barberId);
  const [error, setError] = useState('');

  const timeOptions = useMemo(() => buildTimeOptions(date, duration), [date, duration]);
  const availableBarbers = useMemo(
    () =>
      getAvailableBarbers({
        barbers: state.users.filter((user) => user.role === 'barber'),
        barberProfiles: state.barberProfiles,
        availabilitySlots: state.availabilitySlots,
        appointments: state.appointments,
        date,
        startTime: time,
        durationMinutes: duration,
        excludeAppointmentId: appointment.id,
      }),
    [appointment.id, date, duration, state, time],
  );

  useEffect(() => {
    if (availableBarbers.length && !availableBarbers.some((item) => item.id === barberId)) {
      setBarberId(availableBarbers[0].id);
    }
  }, [availableBarbers, barberId]);

  return (
    <section className="edit-panel">
      <div className="edit-panel__head">
        <div>
          <p>改期預約</p>
          <h3>{appointment.serviceNameSnapshot}</h3>
        </div>
        <button type="button" className="button button--ghost" onClick={onClose}>
          關閉
        </button>
      </div>

      {error ? <div className="form-alert">{error}</div> : null}
      {!canReschedule ? <div className="form-alert form-alert--neutral">這筆預約目前不能改期。</div> : null}

      <div className="form-grid">
        <label>
          日期
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} disabled={!canReschedule} />
        </label>
        <label>
          時間
          <select value={time} onChange={(event) => setTime(event.target.value)} disabled={!canReschedule}>
            {timeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="form-grid__full">
          理髮師
          <select value={barberId} onChange={(event) => setBarberId(event.target.value)} disabled={!canReschedule}>
            {availableBarbers.map((barber) => (
              <option key={barber.id} value={barber.id}>
                {barber.profile?.displayName ?? barber.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!availableBarbers.length ? (
        <div className="form-alert form-alert--neutral">這個改期後的時段目前沒有可用理髮師。</div>
      ) : null}

        <div className="edit-panel__actions">
        <button type="button" className="button button--ghost button--soft" onClick={onClose}>
          取消
        </button>
        <button
          type="button"
          className="button button--gold button--prominent"
          disabled={!canReschedule}
          onClick={() => {
            if (!canReschedule) {
              setError('這筆預約目前不能改期。');
              return;
            }
            if (!availableBarbers.some((barber) => barber.id === barberId)) {
              setError('指定的理髮師不可用。');
              return;
            }
            onSave({ date, startTime: time, barberId });
          }}
        >
          儲存改期
        </button>
      </div>
    </section>
  );
}

export function DashboardPage() {
  const { state, currentUser, setAppointmentStatus, rescheduleAppointment } = useApp();
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [editingAppointment, setEditingAppointment] = useState(null);

  if (!currentUser || !['barber', 'admin'].includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  const filteredAppointments = useMemo(() => {
    let items = state.appointments.slice();

    if (currentUser.role === 'barber') {
      items = items.filter((item) => item.barberId === currentUser.id);
    }

    if (statusFilter !== 'all') {
      items = items.filter((item) => item.status === statusFilter);
    }

    if (dateFilter) {
      items = items.filter((item) => item.appointmentDate === dateFilter);
    }

    return items.sort((a, b) => `${a.appointmentDate} ${a.startTime}`.localeCompare(`${b.appointmentDate} ${b.startTime}`));
  }, [currentUser.id, currentUser.role, dateFilter, statusFilter, state.appointments]);

  const stats = useMemo(() => {
    const today = formatDateInput(new Date());
    const visibleAppointments =
      currentUser.role === 'barber'
        ? state.appointments.filter((item) => item.barberId === currentUser.id)
        : state.appointments;

    return {
      todayCount: visibleAppointments.filter((item) => item.appointmentDate === today).length,
      pendingCount: visibleAppointments.filter((item) => item.status === '待確認').length,
      completedCount: visibleAppointments.filter((item) => item.status === '已完成').length,
      revenue: visibleAppointments
        .filter((item) => ['已確認', '已完成'].includes(item.status))
        .reduce((sum, item) => sum + (item.totalPriceSnapshot ?? 0), 0),
    };
  }, [currentUser.id, currentUser.role, state.appointments]);

  const reportItems = [
    { label: '今日預約', value: stats.todayCount, hint: '當日排程總數' },
    { label: '待處理', value: stats.pendingCount, hint: '尚未確認的預約' },
    { label: '已完成', value: stats.completedCount, hint: '已完成服務數' },
    { label: '預估營收', value: formatCurrency(stats.revenue), hint: '以已確認與已完成統計' },
  ];

  const handleConfirm = async (appointmentId) => {
    await setAppointmentStatus(appointmentId, '已確認');
  };

  const handleComplete = async (appointmentId) => {
    await setAppointmentStatus(appointmentId, '已完成');
  };

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('確定要取消這筆預約嗎？')) return;
    await setAppointmentStatus(appointmentId, '已取消');
  };

  const handleSaveEdit = async (payload) => {
    if (!editingAppointment) return;
    if (!canRescheduleAppointment(editingAppointment.status)) {
      setEditingAppointment(null);
      return;
    }
    await rescheduleAppointment(editingAppointment.id, payload);
    setEditingAppointment(null);
  };

  return (
    <section className="content-section dashboard-page">
      <div className="content-section__header">
        <SectionHeader
          eyebrow="員工後台"
          title={currentUser.role === 'admin' ? '管理員後台' : '理髮師後台'}
        />
        <div className="header-actions">
          <Link className="button button--ghost button--soft" to="/booking">
            新增現場預約
          </Link>
          {currentUser.role === 'admin' ? (
            <button
              type="button"
              className="button button--gold button--prominent"
              onClick={() => {
                document.getElementById('settings')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              店內資料設定
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid--stats">
        {reportItems.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} hint={item.hint} />
        ))}
      </div>

      {currentUser.role === 'admin' ? (
        <section className="content-section__block" id="settings">
          <SectionHeader
            eyebrow="管理員專屬"
            title="店內資料設定與報表"
          />
          <div className="grid grid--services">
            <article className="info-card">
              <h3>營收統計</h3>
              <p>目前預估營收：{formatCurrency(stats.revenue)}</p>
              <small>後續可接入週報與月報資料。</small>
            </article>
            <article className="info-card">
              <h3>可用時段</h3>
              <p>目前採固定時段制，之後可再擴充排班設定。</p>
              <small>可將員工排班、休假與可預約區間接入這裡。</small>
            </article>
            <article className="info-card">
              <h3>資料來源</h3>
              <p>目前先用本機資料做展示，之後可切到正式資料來源。</p>
              <small>先確保前台流程順暢，再逐步接正式後端。</small>
            </article>
          </div>
        </section>
      ) : null}

      {editingAppointment ? (
        <EditPanel
          appointment={editingAppointment}
          state={state}
          onSave={handleSaveEdit}
          onClose={() => setEditingAppointment(null)}
        />
      ) : null}

      <section className="content-section__block">
        <div className="table-toolbar">
          <div className="table-toolbar__filters">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">全部狀態</option>
              <option value="待確認">待確認</option>
              <option value="已確認">已確認</option>
              <option value="已完成">已完成</option>
              <option value="已取消">已取消</option>
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            />
          </div>
          <button type="button" className="button button--ghost" onClick={() => { setStatusFilter('all'); setDateFilter(''); }}>
            清除篩選
          </button>
        </div>

        <div className="table-wrap">
          <table className="app-table">
            <thead>
              <tr>
                <th>服務</th>
                <th>顧客</th>
                <th>理髮師</th>
                <th>時間</th>
                <th>狀態</th>
                <th>金額</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length ? (
                filteredAppointments.map((appointment) => (
                  <AppointmentRow
                    key={appointment.id}
                    appointment={appointment}
                    onConfirm={handleConfirm}
                    onComplete={handleComplete}
                    onCancel={handleCancel}
                    onEdit={setEditingAppointment}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="table-empty">
                    目前沒有符合條件的預約。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
