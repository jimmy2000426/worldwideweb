import { combineDateTime, formatDateInput, getWeekdayIndex, isPastDate } from './date';

export const WORKDAY_START = 10 * 60;
export const WORKDAY_END = 19 * 60;
export const SLOT_STEP = 30;
export const ACTIVE_STATUSES = ['待確認', '已確認'];

export function toMinutes(timeInput) {
  const [hours, minutes] = timeInput.split(':').map(Number);
  return hours * 60 + minutes;
}

export function toTimeString(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(
    minutes % 60,
  ).padStart(2, '0')}`;
}

export function calculateAppointmentEnd(startTime, durationMinutes) {
  return toTimeString(toMinutes(startTime) + durationMinutes);
}

export function calculateTotalPrice(service, addons = []) {
  const base = service?.basePrice ?? 0;
  const addonTotal = addons.reduce((sum, addon) => sum + (addon.price ?? 0), 0);
  return base + addonTotal;
}

export function intervalsOverlap(startA, endA, startB, endB) {
  return toMinutes(startA) < toMinutes(endB) && toMinutes(endA) > toMinutes(startB);
}

export function buildTimeOptions(dateInput, durationMinutes) {
  if (!dateInput || isPastDate(dateInput)) return [];

  const weekday = getWeekdayIndex(dateInput);
  if (weekday === 0) return [];

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const startBoundary = weekday === new Date().getDay() ? Math.max(
    WORKDAY_START,
    Math.ceil((currentMinutes + 1) / SLOT_STEP) * SLOT_STEP,
  ) : WORKDAY_START;

  const options = [];
  for (let minutes = startBoundary; minutes + durationMinutes <= WORKDAY_END; minutes += SLOT_STEP) {
    options.push(toTimeString(minutes));
  }

  return options;
}

export function isAppointmentActive(status) {
  return ACTIVE_STATUSES.includes(status);
}

export function hasConflict({
  appointments,
  customerId,
  barberId,
  date,
  startTime,
  durationMinutes,
  excludeAppointmentId,
}) {
  const requestedEnd = calculateAppointmentEnd(startTime, durationMinutes);

  return appointments.some((appointment) => {
    if (!isAppointmentActive(appointment.status)) return false;
    if (excludeAppointmentId && appointment.id === excludeAppointmentId) return false;
    if (appointment.appointmentDate !== date) return false;

    const endTime = appointment.endTime ?? calculateAppointmentEnd(
      appointment.startTime,
      appointment.durationMinutesSnapshot ?? 0,
    );

    const sameCustomer = appointment.customerId === customerId;
    const sameBarber = appointment.barberId === barberId;
    const overlaps = intervalsOverlap(startTime, requestedEnd, appointment.startTime, endTime);

    return overlaps && (sameCustomer || sameBarber);
  });
}

export function getAvailableBarbers({
  barbers,
  barberProfiles,
  availabilitySlots,
  appointments,
  date,
  startTime,
  durationMinutes,
  excludeAppointmentId,
}) {
  if (!date || !startTime) return [];
  const requestedEnd = calculateAppointmentEnd(startTime, durationMinutes);

  return barbers
    .filter((barber) => barber.role === 'barber' && barber.isActive)
    .map((barber) => {
      const profile = barberProfiles.find((item) => item.userId === barber.id);
      const slot = availabilitySlots.find(
        (entry) =>
          entry.barberId === barber.id &&
          entry.date === date &&
          entry.isAvailable &&
          toMinutes(startTime) >= toMinutes(entry.startTime) &&
          toMinutes(requestedEnd) <= toMinutes(entry.endTime),
      );

      const conflict = appointments.some((appointment) => {
        if (!isAppointmentActive(appointment.status)) return false;
        if (excludeAppointmentId && appointment.id === excludeAppointmentId) return false;
        if (appointment.barberId !== barber.id) return false;
        if (appointment.appointmentDate !== date) return false;
        const appointmentEnd =
          appointment.endTime ??
          calculateAppointmentEnd(
            appointment.startTime,
            appointment.durationMinutesSnapshot ?? 0,
          );
        return intervalsOverlap(startTime, requestedEnd, appointment.startTime, appointmentEnd);
      });

      return {
        ...barber,
        profile,
        available: Boolean(slot) && !conflict,
      };
    })
    .filter((item) => item.available)
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
}

export function getServiceDuration(service) {
  return service?.durationMinutes ?? 0;
}

export function buildAppointmentWindow(date, startTime, service) {
  const durationMinutes = getServiceDuration(service);
  const endTime = calculateAppointmentEnd(startTime, durationMinutes);
  return {
    date,
    startTime,
    endTime,
    durationMinutes,
  };
}

export function canBookDate(dateInput) {
  return Boolean(dateInput) && !isPastDate(dateInput) && getWeekdayIndex(dateInput) !== 0;
}

export function getQuote(service, addons) {
  const addonTotal = addons.reduce((sum, addon) => sum + addon.price, 0);
  const total = calculateTotalPrice(service, addons);

  return {
    basePrice: service?.basePrice ?? 0,
    addonPrice: addonTotal,
    totalPrice: total,
  };
}

export function getAppointmentWindowForRow(appointment) {
  return `${appointment.appointmentDate} ${appointment.startTime}-${appointment.endTime}`;
}

export function toDateObject(dateInput, timeInput) {
  return combineDateTime(dateInput, timeInput);
}
