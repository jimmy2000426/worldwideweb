import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../services/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState(null);
  const [session, setSession] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [assistantOpen, setAssistantOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    api.bootstrap()
      .then(({ state: nextState, session: nextSession }) => {
        if (!mounted) return;
        setState(nextState);
        setSession(nextSession);
        setReady(true);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || '載入失敗');
        setReady(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const currentUser = useMemo(() => {
    if (!state || !session) return null;
    return state.users.find((user) => user.id === session.userId) ?? null;
  }, [state, session]);

  const actions = useMemo(
    () => ({
      clearError() {
        setError('');
      },
      openAssistant() {
        setAssistantOpen(true);
      },
      closeAssistant() {
        setAssistantOpen(false);
      },
      toggleAssistant() {
        setAssistantOpen((value) => !value);
      },
      async login(payload) {
        setBusy(true);
        try {
          const result = await api.login(payload);
          setState(result.state);
          setSession(result.session);
          setError('');
          return result.user;
        } catch (err) {
          setError(err.message || '登入失敗');
          throw err;
        } finally {
          setBusy(false);
        }
      },
      async register(payload) {
        setBusy(true);
        try {
          const result = await api.register(payload);
          setState(result.state);
          setSession(result.session);
          setError('');
          return result.user;
        } catch (err) {
          setError(err.message || '註冊失敗');
          throw err;
        } finally {
          setBusy(false);
        }
      },
      async logout() {
        setBusy(true);
        try {
          setAssistantOpen(false);
          const result = await api.logout();
          setState(result.state);
          setSession(null);
          setError('');
        } catch (err) {
          setError(err.message || '登出失敗');
          throw err;
        } finally {
          setBusy(false);
        }
      },
      async refreshSession() {
        setBusy(true);
        try {
          const result = await api.refreshSession();
          setState(result.state);
          setSession(result.session);
          return result.user;
        } catch (err) {
          setSession(null);
          setError(err.message || '登入已過期');
          throw err;
        } finally {
          setBusy(false);
        }
      },
      async updateProfile(payload) {
        if (!currentUser) throw new Error('未登入');
        const result = await api.updateProfile(currentUser.id, payload);
        setState(result.state);
        return result.profile;
      },
      async createAppointment(payload) {
        if (!currentUser) throw new Error('未登入');
        const result = await api.createAppointment(currentUser, payload);
        setState(result.state);
        return result.appointment;
      },
      async rescheduleAppointment(appointmentId, payload) {
        if (!currentUser) throw new Error('未登入');
        const result = await api.rescheduleAppointment(currentUser, appointmentId, payload);
        setState(result.state);
        return result.appointment;
      },
      async setAppointmentStatus(appointmentId, nextStatus) {
        if (!currentUser) throw new Error('未登入');
        const result = await api.updateAppointmentStatus(currentUser, appointmentId, nextStatus);
        setState(result.state);
        return result.appointment;
      },
      async reloadHome() {
        const result = await api.getHomeData();
        setState(result.state);
        return result;
      },
    }),
    [currentUser],
  );

  const value = useMemo(
    () => ({
      ready,
      busy,
      error,
      assistantOpen,
      clearError: actions.clearError,
      openAssistant: actions.openAssistant,
      closeAssistant: actions.closeAssistant,
      toggleAssistant: actions.toggleAssistant,
      state,
      currentUser,
      isAuthed: Boolean(currentUser),
      role: currentUser?.role ?? 'guest',
      ...actions,
    }),
    [ready, busy, error, state, currentUser, assistantOpen, actions],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
