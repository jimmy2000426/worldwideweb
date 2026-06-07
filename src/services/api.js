// This file is the swap point between the React UI and the real FastAPI backend.
// For now it re-exports the local mock implementation so the app works end-to-end.
// When the backend is ready, replace these exports with fetch-based implementations.
export * from './mockApi';
