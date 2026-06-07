import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EmptyState, SectionHeader, StatusBadge } from '../components/Ui';
import { formatDateLabel } from '../utils/date';

function AppointmentCard({ appointment, onCancel, canCancel }) {
  return (
    <article className="appointment-card">
      <div className="appointment-card__head">
        <span>{appointment.serviceNameSnapshot}</span>
        <StatusBadge status={appointment.status} />
      </div>
      <h3>{formatDateLabel(appointment.appointmentDate)}</h3>
      <p>
        {appointment.startTime} - {appointment.endTime}
      </p>
      <p>設計師：{appointment.barberNameSnapshot}</p>
      {canCancel ? (
        <button type="button" className="button button--ghost" onClick={() => onCancel(appointment.id)}>
          取消預約
        </button>
      ) : null}
    </article>
  );
}

export function AppointmentsPage() {
  const { state, currentUser, setAppointmentStatus } = useApp();
  const navigate = useNavigate();

  const appointments = useMemo(() => {
    if (!state || !currentUser) return [];

    if (currentUser.role === 'customer') {
      return state.appointments
        .filter((appointment) => appointment.customerId === currentUser.id)
        .sort((a, b) => `${a.appointmentDate} ${a.startTime}`.localeCompare(`${b.appointmentDate} ${b.startTime}`));
    }

    if (currentUser.role === 'barber') {
      return state.appointments
        .filter((appointment) => appointment.barberId === currentUser.id)
        .sort((a, b) => `${a.appointmentDate} ${a.startTime}`.localeCompare(`${b.appointmentDate} ${b.startTime}`));
    }

    return state.appointments
      .slice()
      .sort((a, b) => `${a.appointmentDate} ${a.startTime}`.localeCompare(`${b.appointmentDate} ${b.startTime}`));
  }, [currentUser, state]);

  const stats = useMemo(
    () => ({
      pending: appointments.filter((item) => item.status === '待確認').length,
      confirmed: appointments.filter((item) => item.status === '已確認').length,
      completed: appointments.filter((item) => item.status === '已完成').length,
    }),
    [appointments],
  );

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('確定要取消這筆預約嗎？')) return;
    await setAppointmentStatus(appointmentId, '已取消');
  };

  return (
    <section className="content-section">
      <div className="content-section__header">
        <SectionHeader
          eyebrow="我的預約"
          title="查看你目前的預約安排"
          description="這裡只會列出預約項目、日期時間、設計師與狀態。"
        />
        <div className="header-actions">
          <button type="button" className="button button--ghost" onClick={() => navigate('/booking')}>
            立即預約
          </button>
        </div>
      </div>

      <div className="grid grid--stats">
        <article className="metric-card">
          <span>待確認</span>
          <strong>{stats.pending}</strong>
        </article>
        <article className="metric-card">
          <span>已確認</span>
          <strong>{stats.confirmed}</strong>
        </article>
        <article className="metric-card">
          <span>已完成</span>
          <strong>{stats.completed}</strong>
        </article>
      </div>

      {!appointments.length ? (
        <EmptyState
          title="目前沒有任何預約"
          description="現在就到預約頁挑一個喜歡的服務與時間。"
          action={
            <Link className="button button--gold" to="/booking">
              前往預約
            </Link>
          }
        />
      ) : (
        <div className="appointments-grid">
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onCancel={handleCancel}
              canCancel={['待確認', '已確認'].includes(appointment.status) && currentUser.role === 'customer'}
            />
          ))}
        </div>
      )}
    </section>
  );
}
