import { createSeedState } from '../data/seedData';
import {
  calculateAppointmentEnd,
  getAvailableBarbers,
  getQuote,
  isAppointmentActive,
  buildTimeOptions,
} from '../utils/booking';
import { formatDateInput, getWeekdayIndex, isPastDate } from '../utils/date';

const STATE_KEY = 'styletrim-state-v2';
const SESSION_KEY = 'styletrim-session-v2';
const LEGACY_ROLE_KEY = 'userRole';
const LEGACY_NAME_KEY = 'userName';

export class ApiError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

const delay = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));

function storageAvailable() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readJSON(storage, key) {
  if (!storageAvailable()) return null;
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJSON(storage, key, value) {
  if (!storageAvailable()) return;
  storage.setItem(key, JSON.stringify(value));
}

function removeKey(storage, key) {
  if (!storageAvailable()) return;
  storage.removeItem(key);
}

function randomToken(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createSession(user, rememberMe = true) {
  const now = Date.now();
  return {
    userId: user.id,
    accessToken: randomToken('atk'),
    refreshToken: randomToken('rtk'),
    accessTokenExpiresAt: now + 1000 * 60 * 30,
    refreshTokenExpiresAt: now + 1000 * 60 * 60 * 24 * (rememberMe ? 30 : 7),
    rememberMe,
  };
}

function loadState() {
  const stored = readJSON(localStorage, STATE_KEY);
  if (!stored) {
    const seed = createSeedState();
    writeJSON(localStorage, STATE_KEY, seed);
    return clone(seed);
  }

  const seed = createSeedState();
  return {
    ...seed,
    ...stored,
    users: stored.users ?? seed.users,
    services: stored.services ?? seed.services,
    addons: stored.addons ?? seed.addons,
    barberProfiles: stored.barberProfiles ?? seed.barberProfiles,
    availabilitySlots: stored.availabilitySlots ?? seed.availabilitySlots,
    appointments: stored.appointments ?? seed.appointments,
  };
}

function saveState(state) {
  writeJSON(localStorage, STATE_KEY, state);
}

function findUserByAccount(state, account) {
  const normalized = account.trim().toLowerCase();
  return state.users.find(
    (user) =>
      user.isActive &&
      (user.email.toLowerCase() === normalized || user.phone === normalized),
  );
}

function findUserById(state, userId) {
  return state.users.find((user) => user.id === userId) ?? null;
}

function loadSession(state) {
  const local = readJSON(localStorage, SESSION_KEY);
  const session = local ?? readJSON(sessionStorage, SESSION_KEY);
  if (session?.userId && findUserById(state, session.userId)) {
    return session;
  }

  const legacyRole = storageAvailable() ? localStorage.getItem(LEGACY_ROLE_KEY) : null;
  if (!legacyRole || legacyRole === 'guest') return null;

  const legacyUser =
    state.users.find((user) => user.role === legacyRole) ??
    state.users.find((user) => user.role === 'customer');
  if (!legacyUser) return null;

  const migrated = createSession(legacyUser, true);
  if (storageAvailable()) {
    writeJSON(localStorage, SESSION_KEY, migrated);
    writeJSON(sessionStorage, SESSION_KEY, migrated);
    localStorage.removeItem(LEGACY_ROLE_KEY);
    localStorage.removeItem(LEGACY_NAME_KEY);
  }
  return migrated;
}

function saveSession(session) {
  if (!storageAvailable()) return;
  const targetStorage = session.rememberMe ? localStorage : sessionStorage;
  const otherStorage = session.rememberMe ? sessionStorage : localStorage;

  writeJSON(targetStorage, SESSION_KEY, session);
  removeKey(otherStorage, SESSION_KEY);
}

function clearSession() {
  removeKey(localStorage, SESSION_KEY);
  removeKey(sessionStorage, SESSION_KEY);
  removeKey(localStorage, LEGACY_ROLE_KEY);
  removeKey(localStorage, LEGACY_NAME_KEY);
}

function ensureStateShape(state) {
  return {
    ...state,
    users: state.users ?? [],
    services: state.services ?? [],
    addons: state.addons ?? [],
    barberProfiles: state.barberProfiles ?? [],
    availabilitySlots: state.availabilitySlots ?? [],
    appointments: state.appointments ?? [],
  };
}

function validateName(name) {
  return typeof name === 'string' && name.trim().length >= 2;
}

function validatePhone(phone) {
  return /^09\d{8}$/.test(phone);
}

function validateEmail(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
}

function activeAppointments(appointments) {
  return appointments.filter((appointment) => isAppointmentActive(appointment.status));
}

function getService(state, serviceId) {
  return state.services.find((service) => service.id === serviceId) ?? null;
}

function getAddonList(state, addonIds = []) {
  return addonIds
    .map((addonId) => state.addons.find((addon) => addon.id === addonId))
    .filter(Boolean);
}

function getBarberOptions(state, date, startTime, durationMinutes, excludeAppointmentId) {
  return getAvailableBarbers({
    barbers: state.users,
    barberProfiles: state.barberProfiles,
    availabilitySlots: state.availabilitySlots,
    appointments: state.appointments,
    date,
    startTime,
    durationMinutes,
    excludeAppointmentId,
  });
}

function assertDateAndTime(date, time) {
  if (!date || !time) {
    throw new ApiError('INVALID_DATE_RANGE', '請選擇正確的日期與時間。');
  }

  if (isPastDate(date)) {
    throw new ApiError('INVALID_DATE_RANGE', '預約日期不可早於今天。');
  }

  if (getWeekdayIndex(date) === 0) {
    throw new ApiError('INVALID_DATE_RANGE', '週日目前未開放預約。');
  }

  if (!/^\d{2}:\d{2}$/.test(time)) {
    throw new ApiError('INVALID_DATE_RANGE', '時間格式不正確。');
  }
}

function buildAppointmentSnapshot({
  state,
  currentUser,
  barber,
  service,
  addons,
  date,
  startTime,
  notes,
  contactName,
  contactPhone,
}) {
  const endTime = calculateAppointmentEnd(startTime, service.durationMinutes);
  const quote = getQuote(service, addons);

  return {
    id: `apt-${Math.random().toString(36).slice(2, 10)}`,
    customerId: currentUser.id,
    customerNameSnapshot: contactName || currentUser.name,
    customerPhoneSnapshot: contactPhone || currentUser.phone,
    barberId: barber.id,
    barberNameSnapshot:
      state.barberProfiles.find((item) => item.userId === barber.id)?.displayName ??
      barber.name,
    serviceId: service.id,
    serviceNameSnapshot: service.name,
    serviceDurationSnapshot: service.durationMinutes,
    appointmentDate: date,
    startTime,
    endTime,
    status: '待確認',
    basePriceSnapshot: quote.basePrice,
    addonPriceSnapshot: quote.addonPrice,
    totalPriceSnapshot: quote.totalPrice,
    addonsSnapshot: addons.map((addon) => ({
      addonId: addon.id,
      addonNameSnapshot: addon.name,
      addonPriceSnapshot: addon.price,
    })),
    notes: notes?.trim() ?? '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function assertAppointmentOwnership(appointment, user) {
  if (!appointment) {
    throw new ApiError('APPOINTMENT_NOT_FOUND', '找不到該筆預約。', 404);
  }

  if (user.role === 'admin' || user.role === 'barber') return;
  if (appointment.customerId !== user.id) {
    throw new ApiError('FORBIDDEN_ROLE', '你只能操作自己的預約。', 403);
  }
}

function assertActionAllowed(appointment, nextStatus, user) {
  const staff = user.role === 'admin' || user.role === 'barber';

  if (nextStatus === '已確認') {
    if (!staff || appointment.status !== '待確認') {
      throw new ApiError('APPOINTMENT_INVALID_STATUS', '目前狀態無法確認。');
    }
    return;
  }

  if (nextStatus === '已完成') {
    if (!staff || appointment.status !== '已確認') {
      throw new ApiError('APPOINTMENT_INVALID_STATUS', '目前狀態無法完成。');
    }
    return;
  }

  if (nextStatus === '已取消') {
    if (user.role === 'customer' && appointment.customerId !== user.id) {
      throw new ApiError('FORBIDDEN_ROLE', '你只能取消自己的預約。', 403);
    }
    if (!['待確認', '已確認'].includes(appointment.status)) {
      throw new ApiError('APPOINTMENT_INVALID_STATUS', '目前狀態無法取消。');
    }
  }
}

export async function bootstrap() {
  await delay(120);
  const state = ensureStateShape(loadState());
  const session = loadSession(state);
  return { state, session };
}

export async function login({ account, password, rememberMe = true }) {
  await delay();
  const state = ensureStateShape(loadState());
  const user = findUserByAccount(state, account ?? '');

  if (!user || user.password !== password) {
    throw new ApiError('AUTH_INVALID_CREDENTIALS', '帳號或密碼錯誤。', 401);
  }

  if (!user.isActive) {
    throw new ApiError('AUTH_ACCOUNT_INACTIVE', '帳號已停用。', 403);
  }

  const session = createSession(user, rememberMe);
  saveSession(session);

  return {
    state,
    session,
    user: sanitizeUser(user),
  };
}

export async function register({
  name,
  phone,
  email,
  password,
  confirmPassword,
  acceptTerms,
  rememberMe = true,
}) {
  await delay();
  const state = ensureStateShape(loadState());
  const trimmedName = name?.trim() ?? '';
  const trimmedPhone = phone?.trim() ?? '';
  const trimmedEmail = email?.trim() ?? '';

  if (!validateName(trimmedName)) {
    throw new ApiError('VALIDATION_ERROR', '請輸入至少 2 個字元的姓名。');
  }
  if (!validatePhone(trimmedPhone)) {
    throw new ApiError('VALIDATION_ERROR', '手機號碼格式需為 09 開頭的 10 碼。');
  }
  if (trimmedEmail && !validateEmail(trimmedEmail)) {
    throw new ApiError('VALIDATION_ERROR', '電子郵件格式不正確。');
  }
  if (!validatePassword(password ?? '')) {
    throw new ApiError('VALIDATION_ERROR', '密碼需至少 8 碼並包含英數字。');
  }
  if (password !== confirmPassword) {
    throw new ApiError('VALIDATION_ERROR', '兩次輸入的密碼不一致。');
  }
  if (!acceptTerms) {
    throw new ApiError('VALIDATION_ERROR', '請先同意服務條款。');
  }

  if (state.users.some((user) => user.phone === trimmedPhone)) {
    throw new ApiError('DUPLICATE_PHONE', '這支手機已經註冊過。');
  }
  if (trimmedEmail && state.users.some((user) => user.email.toLowerCase() === trimmedEmail.toLowerCase())) {
    throw new ApiError('DUPLICATE_EMAIL', '這個電子郵件已經註冊過。');
  }

  const user = {
    id: `user-${Math.random().toString(36).slice(2, 10)}`,
    name: trimmedName,
    email: trimmedEmail || `${trimmedPhone}@styletrim.local`,
    phone: trimmedPhone,
    password,
    role: 'customer',
    isActive: true,
  };

  state.users.push(user);
  saveState(state);

  const session = createSession(user, rememberMe);
  saveSession(session);

  return {
    state,
    session,
    user: sanitizeUser(user),
  };
}

export async function logout() {
  await delay(80);
  clearSession();
  const state = ensureStateShape(loadState());
  return { state };
}

export async function refreshSession() {
  await delay(100);
  const state = ensureStateShape(loadState());
  const session = loadSession(state);

  if (!session) {
    throw new ApiError('AUTH_UNAUTHORIZED', '尚未登入。', 401);
  }

  if (Date.now() > session.refreshTokenExpiresAt) {
    clearSession();
    throw new ApiError('AUTH_REFRESH_EXPIRED', '登入已過期，請重新登入。', 401);
  }

  const nextSession = {
    ...session,
    accessToken: randomToken('atk'),
    accessTokenExpiresAt: Date.now() + 1000 * 60 * 30,
  };

  saveSession(nextSession);

  return {
    state,
    session: nextSession,
    user: sanitizeUser(findUserById(state, nextSession.userId)),
  };
}

export async function getProfile(userId) {
  await delay(60);
  const state = ensureStateShape(loadState());
  const user = findUserById(state, userId);
  if (!user) {
    throw new ApiError('AUTH_UNAUTHORIZED', '找不到登入者資訊。', 401);
  }

  return { state, profile: sanitizeUser(user) };
}

export async function updateProfile(userId, patch) {
  await delay(120);
  const state = ensureStateShape(loadState());
  const user = findUserById(state, userId);
  if (!user) {
    throw new ApiError('AUTH_UNAUTHORIZED', '找不到登入者資訊。', 401);
  }

  const nextName = patch.name?.trim();
  const nextPhone = patch.phone?.trim();
  const nextEmail = patch.email?.trim();

  if (nextName && !validateName(nextName)) {
    throw new ApiError('VALIDATION_ERROR', '姓名格式不正確。');
  }
  if (nextPhone && !validatePhone(nextPhone)) {
    throw new ApiError('VALIDATION_ERROR', '手機格式不正確。');
  }
  if (nextEmail && !validateEmail(nextEmail)) {
    throw new ApiError('VALIDATION_ERROR', '電子郵件格式不正確。');
  }

  if (nextPhone && state.users.some((item) => item.phone === nextPhone && item.id !== userId)) {
    throw new ApiError('DUPLICATE_PHONE', '手機號碼已存在。');
  }
  if (
    nextEmail &&
    state.users.some(
      (item) => item.email.toLowerCase() === nextEmail.toLowerCase() && item.id !== userId,
    )
  ) {
    throw new ApiError('DUPLICATE_EMAIL', '電子郵件已存在。');
  }

  if (nextName) user.name = nextName;
  if (nextPhone) user.phone = nextPhone;
  if (nextEmail) user.email = nextEmail;
  user.updatedAt = new Date().toISOString();
  saveState(state);

  return { state, profile: sanitizeUser(user) };
}

export async function listServices() {
  await delay(40);
  const state = ensureStateShape(loadState());
  return { state, services: state.services.filter((service) => service.isActive) };
}

export async function listAddons() {
  await delay(40);
  const state = ensureStateShape(loadState());
  return { state, addons: state.addons.filter((addon) => addon.isActive) };
}

export async function listBarbers() {
  await delay(50);
  const state = ensureStateShape(loadState());
  const barbers = state.users
    .filter((user) => user.role === 'barber' && user.isActive)
    .map((user) => ({
      ...sanitizeUser(user),
      profile:
        state.barberProfiles.find((profile) => profile.userId === user.id) ?? null,
    }));
  return { state, barbers };
}

export async function getAvailability({ date, time, serviceId }) {
  await delay(80);
  const state = ensureStateShape(loadState());
  const service = getService(state, serviceId);
  if (!service || !service.isActive) {
    throw new ApiError('APPOINTMENT_SERVICE_INACTIVE', '服務不可用。');
  }

  const durationMinutes = service.durationMinutes;
  const candidates = getBarberOptions(state, date, time, durationMinutes);
  return { state, barbers: candidates };
}

export async function listAppointmentsForUser(user) {
  await delay(60);
  const state = ensureStateShape(loadState());
  let appointments = state.appointments;

  if (user.role === 'customer') {
    appointments = appointments.filter((appointment) => appointment.customerId === user.id);
  } else if (user.role === 'barber') {
    appointments = appointments.filter((appointment) => appointment.barberId === user.id);
  }

  return { state, appointments };
}

export async function listAllAppointments(user, filters = {}) {
  await delay(80);
  const state = ensureStateShape(loadState());
  if (!['admin', 'barber'].includes(user.role)) {
    throw new ApiError('FORBIDDEN_ROLE', '只有員工可查看後台預約。', 403);
  }

  let appointments = [...state.appointments];

  if (filters.status && filters.status !== 'all') {
    appointments = appointments.filter((appointment) => appointment.status === filters.status);
  }

  if (filters.date) {
    appointments = appointments.filter(
      (appointment) => appointment.appointmentDate === filters.date,
    );
  }

  return { state, appointments };
}

export async function createAppointment(user, payload) {
  await delay(150);
  const state = ensureStateShape(loadState());
  const service = getService(state, payload.serviceId);

  if (!service || !service.isActive) {
    throw new ApiError('APPOINTMENT_SERVICE_INACTIVE', '所選服務目前不可用。');
  }

  const addons = getAddonList(state, payload.addonIds ?? []);
  if (addons.some((addon) => !addon.isActive)) {
    throw new ApiError('APPOINTMENT_ADDON_INACTIVE', '所選加購目前不可用。');
  }

  const date = payload.date;
  const startTime = payload.startTime;
  assertDateAndTime(date, startTime);

  const durationMinutes = service.durationMinutes;
  const endTime = calculateAppointmentEnd(startTime, durationMinutes);

  let barber = null;
  if (payload.barberId) {
    barber = findUserById(state, payload.barberId);
    if (!barber || barber.role !== 'barber' || !barber.isActive) {
      throw new ApiError('FORBIDDEN_ROLE', '指定的理髮師不可用。', 403);
    }
  }

  const availableBarbers = getBarberOptions(
    state,
    date,
    startTime,
    durationMinutes,
    payload.excludeAppointmentId,
  );

  if (!barber) {
    barber = availableBarbers[0] ? findUserById(state, availableBarbers[0].id) : null;
  }

  if (!barber) {
    throw new ApiError('APPOINTMENT_NO_BARBER_AVAILABLE', '目前沒有可用理髮師。');
  }

  const barberAvailable = availableBarbers.some((item) => item.id === barber.id);
  if (!barberAvailable) {
    throw new ApiError('APPOINTMENT_CONFLICT', '該理髮師在此時段已被預約。');
  }

  const conflict = state.appointments.some((appointment) => {
    if (!isAppointmentActive(appointment.status)) return false;
    if (payload.excludeAppointmentId && appointment.id === payload.excludeAppointmentId) return false;
    if (appointment.appointmentDate !== date) return false;

    const appointmentEnd =
      appointment.endTime ??
      calculateAppointmentEnd(appointment.startTime, appointment.serviceDurationSnapshot ?? 0);

    const sameCustomer = appointment.customerId === user.id;
    const sameBarber = appointment.barberId === barber.id;
    const overlap = startTime < appointmentEnd && endTime > appointment.startTime;

    return overlap && (sameCustomer || sameBarber);
  });

  if (conflict) {
    throw new ApiError('APPOINTMENT_CONFLICT', '顧客或理髮師在此時段已有預約。');
  }

  const appointment = buildAppointmentSnapshot({
    state,
    currentUser: user,
    barber,
    service,
    addons,
    date,
    startTime,
    notes: payload.notes,
    contactName: payload.contactName,
    contactPhone: payload.contactPhone,
  });

  state.appointments.unshift(appointment);
  saveState(state);

  return {
    state,
    appointment,
  };
}

export async function rescheduleAppointment(user, appointmentId, payload) {
  await delay(140);
  const state = ensureStateShape(loadState());
  const appointment = state.appointments.find((item) => item.id === appointmentId);
  if (!appointment) {
    throw new ApiError('APPOINTMENT_NOT_FOUND', '找不到預約。', 404);
  }

  assertAppointmentOwnership(appointment, user);
  if (!['待確認', '已確認'].includes(appointment.status)) {
    throw new ApiError('APPOINTMENT_INVALID_STATUS', '目前狀態無法改期。');
  }

  const service = getService(state, appointment.serviceId);
  const date = payload.date ?? appointment.appointmentDate;
  const startTime = payload.startTime ?? appointment.startTime;
  const durationMinutes = service?.durationMinutes ?? appointment.serviceDurationSnapshot ?? 0;

  assertDateAndTime(date, startTime);

  const availableBarbers = getBarberOptions(
    state,
    date,
    startTime,
    durationMinutes,
    appointment.id,
  );

  let barber = findUserById(state, payload.barberId ?? appointment.barberId);
  if (!barber || barber.role !== 'barber' || !barber.isActive) {
    barber = null;
  }

  if (!barber) {
    barber = availableBarbers[0] ? findUserById(state, availableBarbers[0].id) : null;
  }

  if (!barber || !availableBarbers.some((item) => item.id === barber.id)) {
    throw new ApiError('APPOINTMENT_NO_BARBER_AVAILABLE', '改期後沒有可用理髮師。');
  }

  const endTime = calculateAppointmentEnd(startTime, durationMinutes);
  const conflict = state.appointments.some((item) => {
    if (!isAppointmentActive(item.status)) return false;
    if (item.id === appointment.id) return false;
    if (item.appointmentDate !== date) return false;

    const itemEnd = item.endTime ?? calculateAppointmentEnd(item.startTime, item.serviceDurationSnapshot ?? 0);
    const overlap = startTime < itemEnd && endTime > item.startTime;

    return overlap && (item.customerId === user.id || item.barberId === barber.id);
  });

  if (conflict) {
    throw new ApiError('APPOINTMENT_CONFLICT', '改期後與現有預約衝突。');
  }

  appointment.barberId = barber.id;
  appointment.barberNameSnapshot =
    state.barberProfiles.find((profile) => profile.userId === barber.id)?.displayName ?? barber.name;
  appointment.appointmentDate = date;
  appointment.startTime = startTime;
  appointment.endTime = endTime;
  appointment.updatedAt = new Date().toISOString();
  saveState(state);

  return { state, appointment };
}

export async function updateAppointmentStatus(user, appointmentId, nextStatus) {
  await delay(100);
  const state = ensureStateShape(loadState());
  const appointment = state.appointments.find((item) => item.id === appointmentId);

  if (!appointment) {
    throw new ApiError('APPOINTMENT_NOT_FOUND', '找不到預約。', 404);
  }

  assertActionAllowed(appointment, nextStatus, user);
  if (nextStatus === '已確認' && appointment.status !== '待確認') {
    throw new ApiError('APPOINTMENT_INVALID_STATUS', '目前狀態無法確認。');
  }
  if (nextStatus === '已完成' && appointment.status !== '已確認') {
    throw new ApiError('APPOINTMENT_INVALID_STATUS', '目前狀態無法完成。');
  }
  if (nextStatus === '已取消' && !['待確認', '已確認'].includes(appointment.status)) {
    throw new ApiError('APPOINTMENT_INVALID_STATUS', '目前狀態無法取消。');
  }

  appointment.status = nextStatus;
  appointment.updatedAt = new Date().toISOString();
  saveState(state);

  return { state, appointment };
}

export async function getDashboardData(user, filters = {}) {
  await delay(60);
  const state = ensureStateShape(loadState());
  if (!['admin', 'barber'].includes(user.role)) {
    throw new ApiError('FORBIDDEN_ROLE', '只有員工可查看後台。', 403);
  }

  const appointments =
    filters.status || filters.date
      ? (
          await listAllAppointments(user, filters)
        ).appointments
      : state.appointments;

  const today = formatDateInput(new Date());
  const todayAppointments = state.appointments.filter((appointment) => appointment.appointmentDate === today);
  const pendingCount = state.appointments.filter((appointment) => appointment.status === '待確認').length;
  const completedCount = state.appointments.filter((appointment) => appointment.status === '已完成').length;
  const revenue = state.appointments
    .filter((appointment) => ['已確認', '已完成'].includes(appointment.status))
    .reduce((sum, appointment) => sum + (appointment.totalPriceSnapshot ?? 0), 0);

  return {
    state,
    appointments,
    stats: {
      totalToday: todayAppointments.length,
      pendingCount,
      completedCount,
      revenue,
    },
  };
}

export async function getHomeData() {
  await delay(30);
  const state = ensureStateShape(loadState());
  const activeBarbers = state.users.filter((user) => user.role === 'barber' && user.isActive).length;
  const activeServices = state.services.filter((service) => service.isActive).length;
  const upcomingAppointments = activeAppointments(state.appointments).length;

  return {
    state,
    services: state.services.filter((service) => service.isActive),
    barbers: state.users
      .filter((user) => user.role === 'barber' && user.isActive)
      .map((user) => ({
        ...sanitizeUser(user),
        profile: state.barberProfiles.find((profile) => profile.userId === user.id) ?? null,
      })),
    highlights: {
      activeBarbers,
      activeServices,
      upcomingAppointments,
    },
  };
}

export async function getAppointmentAvailabilityPreview({ date, serviceId }) {
  await delay(50);
  const state = ensureStateShape(loadState());
  const service = getService(state, serviceId);
  if (!service || !service.isActive) {
    return { state, timeOptions: [], availableBarbers: [] };
  }

  const timeOptions = buildTimeOptions(date, service.durationMinutes);
  if (!timeOptions.length) {
    return { state, timeOptions: [], availableBarbers: [] };
  }

  const availableBarbers = getBarberOptions(state, date, timeOptions[0], service.durationMinutes);
  return { state, timeOptions, availableBarbers };
}

export async function getBookingQuote(state, serviceId, addonIds = []) {
  const service = getService(state, serviceId);
  const addons = getAddonList(state, addonIds);
  if (!service) return getQuote(null, []);
  return getQuote(service, addons);
}
