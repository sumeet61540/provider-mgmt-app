import axios from 'axios'

// Always call the backend directly via VITE_API_BASE_URL — in dev this is
// usually http://localhost:8000/api/v1, in prod it's the deployed backend
// URL. The Vite dev-server /api proxy (vite.config.js) is a separate,
// optional convenience and is NOT relied upon here, since there is no dev
// server (and no proxy) once this is built and served as static files.
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const client = axios.create({ baseURL })

export const api = {
  listProviders: () => client.get('/providers').then((r) => r.data),
  searchProviders: (q) => client.get('/providers/search', { params: { q } }).then((r) => r.data),
  getProvider: (providerId) => client.get(`/providers/${providerId}`).then((r) => r.data),
  updateProvider: (providerId, payload) => client.put(`/providers/${providerId}`, payload).then((r) => r.data),

  listParticipations: (providerId) =>
    client.get(`/providers/${providerId}/participations`).then((r) => r.data),
  addParticipation: (providerId, payload) =>
    client.post(`/providers/${providerId}/participations`, payload).then((r) => r.data),
  updateParticipation: (participationId, payload) =>
    client.put(`/participations/${participationId}`, payload).then((r) => r.data),
  terminateParticipation: (participationId, payload) =>
    client.delete(`/participations/${participationId}`, { data: payload }).then((r) => r.data),
  getBatch: (batchId) => client.get(`/participations/batch/${batchId}`).then((r) => r.data),

  listAudit: (params) => client.get('/audit', { params }).then((r) => r.data),

  demoReset: () => client.post('/demo/reset').then((r) => r.data),
  demoResetProvider: (providerId) => client.post(`/demo/reset/${providerId}`).then((r) => r.data),
  demoStatus: () => client.get('/demo/status').then((r) => r.data),
  demoScenarioSetup: (scenario) => client.post(`/demo/scenario/${scenario}/setup`).then((r) => r.data),

  health: () => client.get('/health').then((r) => r.data),
}

export default api
