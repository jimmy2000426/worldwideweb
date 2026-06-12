import { createSeedState } from '../data/seedData';
import { addDays, formatDateInput } from '../utils/date';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
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

function sanitizeUser(user) {
  if (!user) return null;
  const normalized = {
    id: user.id,
    email: user.email,
    phone: user.phone,
    name: user.name,
    role: user.role,
    isActive: user.is_active ?? user.isActive ?? true,
    createdAt: user.created_at ?? user.createdAt ?? new Date().toISOString(),
    updatedAt: user.updated_at ?? user.updatedAt ?? new Date().toISOString(),
  };
  if (user.profile) {
    normalized.profile = mapBarberProfile(user.profile);
  }
  return normalized;
}

function mapBarberProfile(profile) {
  if (!profile) return null;
  return {
    id: profile.id,
    userId: profile.user_id ?? profile.userId,
    displayName: profile.display_name ?? profile.displayName,
    bio: profile.bio ?? '',
    specialty: profile.specialty ?? '',
    isAvailable: profile.is_available ?? profile.isAvailable ?? true,
  };
}

function mapService(service) {
  const seed = createSeedState().services.find((item) => item.id === service.id) ?? {};
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    teaser: seed.teaser ?? service.description,
    priceRange: seed.priceRange ?? `NT$${service.base_price} 起`,
    basePrice: service.base_price,
    durationMinutes: service.duration_minutes,
    isActive: service.is_active,
  };
}

function mapAddon(addon) {
  return {
    id: addon.id,
    name: addon.name,
    description: addon.description,
    price: addon.price,
    isActive: addon.is_active,
  };
}

function mapAppointmentAddon(item) {
  return {
    addonId: item.addonId ?? item.addon_id,
    addonNameSnapshot: item.addonNameSnapshot ?? item.addon_name_snapshot,
    addonPriceSnapshot: item.addonPriceSnapshot ?? item.addon_price_snapshot,
  };
}

function mapAppointment(item) {
  return {
    id: item.id,
    customerId: item.customerId ?? item.customer_id,
    customerNameSnapshot: item.customerNameSnapshot ?? item.customer_name_snapshot,
    customerPhoneSnapshot: item.customerPhoneSnapshot ?? item.customer_phone_snapshot,
    barberId: item.barberId ?? item.barber_id,
    barberNameSnapshot: item.barberNameSnapshot ?? item.barber_name_snapshot,
    serviceId: item.serviceId ?? item.service_id,
    serviceNameSnapshot: item.serviceNameSnapshot ?? item.service_name_snapshot,
    serviceDurationSnapshot: item.serviceDurationSnapshot ?? item.service_duration_snapshot,
    appointmentDate: item.appointmentDate ?? item.appointment_date,
    startTime: item.startTime ?? item.start_time,
    endTime: item.endTime ?? item.end_time,
    status: item.status,
    basePriceSnapshot: item.basePriceSnapshot ?? item.base_price_snapshot,
    addonPriceSnapshot: item.addonPriceSnapshot ?? item.addon_price_snapshot,
    totalPriceSnapshot: item.totalPriceSnapshot ?? item.total_price_snapshot,
    addonsSnapshot: (item.addonsSnapshot ?? item.addons_snapshot ?? []).map(mapAppointmentAddon),
    notes: item.notes ?? '',
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt ?? item.updated_at,
  };
}

function createWorkingSlots(barberIds, days = 60) {
  const slots = [];
  const start = new Date();

  for (let offset = 0; offset < days; offset += 1) {
    const date = addDays(start, offset);
    const dateInput = formatDateInput(date);
    if (date.getDay() === 0) continue;

    barberIds.forEach((barberId) => {
      slots.push({
        id: `slot-${barberId}-${dateInput}`,
        barberId,
        date: dateInput,
        startTime: '10:00',
        endTime: '19:00',
        isAvailable: true,
        source: 'generated',
      });
    });
  }

  return slots;
}

function buildHeaders(token) {
  const headers = {
    Accept: 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function fetchJson(path, { method = 'GET', body, token } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...buildHeaders(token),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok || (data && data.success === false)) {
    const error = data?.error ?? {};
    throw new ApiError(error.code ?? 'UNKNOWN_ERROR', error.message ?? '請求失敗。', response.status);
  }

  return data?.data ?? data ?? {};
}

function createSession(user, tokens, rememberMe = true) {
  return {
    userId: user.id,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    rememberMe,
  };
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

function loadSession() {
  if (!storageAvailable()) return null;
  const local = readJSON(localStorage, SESSION_KEY);
  const session = local ?? readJSON(sessionStorage, SESSION_KEY);
  if (!session?.userId || !session?.refreshToken) return null;
  return session;
}

function mergeUsers({ barbers, currentUser }) {
  const users = [...barbers];
  if (currentUser && !users.some((user) => user.id === currentUser.id)) {
    users.unshift(currentUser);
  }
  return users;
}

function buildState({ services, addons, barbers, appointments, currentUser }) {
  const seed = createSeedState();
  const mappedBarbers = barbers.map((item) => ({
    ...sanitizeUser(item),
    profile: mapBarberProfile(item.profile),
  }));
  const users = mergeUsers({ barbers: mappedBarbers, currentUser });
  const barberProfiles = mappedBarbers
    .map((item) => item.profile)
    .filter(Boolean);

  return {
    version: seed.version,
    users,
    services,
    addons,
    barberProfiles,
    availabilitySlots: createWorkingSlots(barberProfiles.map((profile) => profile.userId)),
    appointments,
  };
}

async function getAuthenticatedUser(session) {
  if (!session?.accessToken || !session?.refreshToken) return { user: null, session: null };

  try {
    const result = await fetchJson('/auth/me', { token: session.accessToken });
    return {
      user: sanitizeUser(result.user),
      session,
    };
  } catch (error) {
    try {
      const refreshed = await fetchJson('/auth/refresh', {
        method: 'POST',
        body: { refreshToken: session.refreshToken },
      });
      const currentUser = sanitizeUser(refreshed.user);
      const nextSession = createSession(currentUser, refreshed, session.rememberMe);
      saveSession(nextSession);
      return {
        user: currentUser,
        session: nextSession,
      };
    } catch {
      clearSession();
      return { user: null, session: null };
    }
  }
}

async function loadPublicData() {
  const [servicesData, addonsData, barbersData] = await Promise.all([
    fetchJson('/services'),
    fetchJson('/addons'),
    fetchJson('/barbers'),
  ]);

  return {
    services: (servicesData.items ?? []).map(mapService),
    addons: (addonsData.items ?? []).map(mapAddon),
    barbers: (barbersData.items ?? []).map((item) => ({
      ...sanitizeUser(item),
      profile: mapBarberProfile(item.profile),
    })),
  };
}

async function loadAppointmentsForUser(currentUser, token) {
  if (!currentUser) return [];
  const endpoint = currentUser.role === 'customer' ? '/me/appointments' : '/admin/appointments';
  const response = await fetchJson(endpoint, { token });
  return (response.items ?? []).map(mapAppointment);
}

async function buildAppState(session = loadSession()) {
  const publicData = await loadPublicData();
  const auth = await getAuthenticatedUser(session);
  const appointments = auth.user ? await loadAppointmentsForUser(auth.user, auth.session.accessToken) : [];

  return {
    state: buildState({
      ...publicData,
      appointments,
      currentUser: auth.user,
    }),
    session: auth.session,
    user: auth.user,
  };
}

async function mutateAndReload(action) {
  const session = loadSession();
  if (!session?.accessToken) {
    throw new ApiError('AUTH_UNAUTHORIZED', '尚未登入。', 401);
  }

  await action(session);
  return buildAppState(session);
}

export async function bootstrap() {
  return buildAppState();
}

export async function login({ account, password, rememberMe = true }) {
  const data = await fetchJson('/auth/login', {
    method: 'POST',
    body: { account, password, rememberMe },
  });

  const user = sanitizeUser(data.user);
  const session = createSession(user, data, rememberMe);
  saveSession(session);
  const next = await buildAppState(session);
  return {
    state: next.state,
    session,
    user,
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
  const data = await fetchJson('/auth/register', {
    method: 'POST',
    body: { name, phone, email, password, confirmPassword, acceptTerms, rememberMe },
  });

  const user = sanitizeUser(data.user);
  const session = createSession(user, data, rememberMe);
  saveSession(session);
  const next = await buildAppState(session);
  return {
    state: next.state,
    session,
    user,
  };
}

export async function logout() {
  const session = loadSession();
  if (session?.refreshToken) {
    try {
      await fetchJson('/auth/logout', {
        method: 'POST',
        body: { refreshToken: session.refreshToken },
      });
    } catch {
      // Ignore logout cleanup failures and still clear local session state.
    }
  }
  clearSession();
  const next = await buildAppState(null);
  return { state: next.state };
}

export async function refreshSession() {
  const session = loadSession();
  if (!session?.refreshToken) {
    throw new ApiError('AUTH_UNAUTHORIZED', '尚未登入。', 401);
  }

  const data = await fetchJson('/auth/refresh', {
    method: 'POST',
    body: { refreshToken: session.refreshToken },
  });

  const user = sanitizeUser(data.user);
  const nextSession = createSession(user, data, session.rememberMe);
  saveSession(nextSession);
  const next = await buildAppState(nextSession);
  return {
    state: next.state,
    session: nextSession,
    user,
  };
}

export async function updateProfile(_userId, patch) {
  const session = loadSession();
  if (!session?.accessToken) {
    throw new ApiError('AUTH_UNAUTHORIZED', '尚未登入。', 401);
  }

  const data = await fetchJson('/me/profile', {
    method: 'PATCH',
    token: session.accessToken,
    body: patch,
  });

  const next = await buildAppState(session);
  return {
    state: next.state,
    profile: sanitizeUser(data.profile),
  };
}

export async function createAppointment(user, payload) {
  const session = loadSession();
  if (!session?.accessToken) {
    throw new ApiError('AUTH_UNAUTHORIZED', '尚未登入。', 401);
  }

  const data = await fetchJson('/appointments', {
    method: 'POST',
    token: session.accessToken,
    body: {
      serviceId: payload.serviceId,
      barberId: payload.barberId || null,
      appointmentDate: payload.date,
      startTime: payload.startTime,
      addonIds: payload.addonIds ?? [],
      notes: payload.notes ?? '',
      contactName: payload.contactName ?? user.name,
      contactPhone: payload.contactPhone ?? user.phone,
    },
  });

  const next = await buildAppState(session);
  return {
    state: next.state,
    appointment: mapAppointment(data.appointment),
  };
}

export async function rescheduleAppointment(_user, appointmentId, payload) {
  const session = loadSession();
  if (!session?.accessToken) {
    throw new ApiError('AUTH_UNAUTHORIZED', '尚未登入。', 401);
  }

  const data = await fetchJson(`/appointments/${appointmentId}/reschedule`, {
    method: 'PATCH',
    token: session.accessToken,
    body: {
      appointmentDate: payload.date,
      startTime: payload.startTime,
      barberId: payload.barberId,
    },
  });

  const next = await buildAppState(session);
  return {
    state: next.state,
    appointment: mapAppointment(data.appointment),
  };
}

export async function updateAppointmentStatus(user, appointmentId, nextStatus) {
  const session = loadSession();
  if (!session?.accessToken) {
    throw new ApiError('AUTH_UNAUTHORIZED', '尚未登入。', 401);
  }

  const endpoint =
    nextStatus === '已確認'
      ? `/admin/appointments/${appointmentId}/confirm`
      : nextStatus === '已完成'
        ? `/admin/appointments/${appointmentId}/complete`
        : `/appointments/${appointmentId}/cancel`;

  const data = await fetchJson(endpoint, {
    method: 'PATCH',
    token: session.accessToken,
  });

  const next = await buildAppState(session);
  return {
    state: next.state,
    appointment: mapAppointment(data.appointment),
  };
}

export async function getHomeData() {
  const next = await buildAppState();
  return {
    state: next.state,
    services: next.state.services,
    barbers: next.state.users.filter((user) => user.role === 'barber'),
    highlights: {
      activeBarbers: next.state.users.filter((user) => user.role === 'barber').length,
      activeServices: next.state.services.filter((service) => service.isActive).length,
      upcomingAppointments: next.state.appointments.length,
    },
  };
}

export async function getDashboardData(user, filters = {}) {
  if (!user) {
    throw new ApiError('AUTH_UNAUTHORIZED', '尚未登入。', 401);
  }
  const session = loadSession();
  const query = new URLSearchParams();
  if (filters.status && filters.status !== 'all') {
    query.set('status_filter', filters.status);
  }
  if (filters.date) {
    query.set('date', filters.date);
  }

  const data = await fetchJson(`/admin/appointments${query.toString() ? `?${query.toString()}` : ''}`, {
    token: session?.accessToken,
  });
  const appointments = (data.items ?? []).map(mapAppointment);
  const today = formatDateInput(new Date());
  const visibleAppointments =
    user.role === 'barber'
      ? appointments.filter((appointment) => appointment.barberId === user.id)
      : appointments;

  return {
    state: (await buildAppState(session)).state,
    appointments,
    stats: {
      totalToday: visibleAppointments.filter((appointment) => appointment.appointmentDate === today).length,
      pendingCount: visibleAppointments.filter((appointment) => appointment.status === '待確認').length,
      completedCount: visibleAppointments.filter((appointment) => appointment.status === '已完成').length,
      revenue: visibleAppointments
        .filter((appointment) => ['已確認', '已完成'].includes(appointment.status))
        .reduce((sum, appointment) => sum + (appointment.totalPriceSnapshot ?? 0), 0),
    },
  };
}

export async function getAvailability({ date, time, serviceId }) {
  const data = await fetchJson(`/barbers/availability?${new URLSearchParams({ date, time, serviceId }).toString()}`);
  return {
    barbers: (data.items ?? []).map((item) => ({
      ...sanitizeUser(item),
      profile: mapBarberProfile(item.profile),
    })),
  };
}

export async function listServices() {
  const data = await fetchJson('/services');
  return { services: (data.items ?? []).map(mapService) };
}

export async function listAddons() {
  const data = await fetchJson('/addons');
  return { addons: (data.items ?? []).map(mapAddon) };
}

export async function listBarbers() {
  const data = await fetchJson('/barbers');
  return {
    barbers: (data.items ?? []).map((item) => ({
      ...sanitizeUser(item),
      profile: mapBarberProfile(item.profile),
    })),
  };
}

export async function listAppointmentsForUser(user) {
  const session = loadSession();
  if (!session?.accessToken) {
    throw new ApiError('AUTH_UNAUTHORIZED', '尚未登入。', 401);
  }
  const endpoint = user.role === 'customer' ? '/me/appointments' : '/admin/appointments';
  const data = await fetchJson(endpoint, { token: session.accessToken });
  return { appointments: (data.items ?? []).map(mapAppointment) };
}

export async function listAllAppointments(user, filters = {}) {
  return getDashboardData(user, filters);
}

export async function getAppointmentAvailabilityPreview({ date, serviceId }) {
  if (!date || !serviceId) {
    return { timeOptions: [], availableBarbers: [] };
  }
  const serviceData = await fetchJson('/services');
  const service = (serviceData.items ?? []).find((item) => item.id === serviceId);
  if (!service || !service.is_active) {
    return { timeOptions: [], availableBarbers: [] };
  }

  const timeOptions = [];
  const duration = service.duration_minutes;
  const start = new Date(`${date}T00:00:00`);
  if (Number.isNaN(start.getTime()) || start.getDay() === 0) {
    return { timeOptions: [], availableBarbers: [] };
  }

  const current = new Date();
  const currentMinutes = current.getHours() * 60 + current.getMinutes();
  const startBoundary =
    formatDateInput(current) === date
      ? Math.max(600, Math.ceil((currentMinutes + 1) / 30) * 30)
      : 600;

  for (let minutes = startBoundary; minutes + duration <= 19 * 60; minutes += 30) {
    const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mins = String(minutes % 60).padStart(2, '0');
    timeOptions.push(`${hours}:${mins}`);
  }

  if (!timeOptions.length) {
    return { timeOptions: [], availableBarbers: [] };
  }

  const availability = await getAvailability({ date, time: timeOptions[0], serviceId });
  return { timeOptions, availableBarbers: availability.barbers };
}

export async function getBookingQuote(state, serviceId, addonIds = []) {
  const service = state.services.find((item) => item.id === serviceId);
  const addons = state.addons.filter((item) => addonIds.includes(item.id));
  return {
    basePrice: service?.basePrice ?? 0,
    addonPrice: addons.reduce((sum, addon) => sum + addon.price, 0),
    totalPrice: (service?.basePrice ?? 0) + addons.reduce((sum, addon) => sum + addon.price, 0),
  };
}
