import axios from 'axios'

const API = axios.create({ baseURL: '/api' })

// Papers
export const uploadPaper = (file) => {
  const form = new FormData()
  form.append('file', file)
  return API.post('/papers/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
export const listPapers = () => API.get('/papers')
export const getPaper = (id) => API.get(`/papers/${id}`)
export const deletePaper = (id) => API.delete(`/papers/${id}`)

// Scoring
export const triggerScoring = (id) => API.post(`/papers/${id}/score`)
export const getScore = (id) => API.get(`/papers/${id}/score`)

// Decisions
export const makeDecision = (id, action) => API.post(`/papers/${id}/decision`, { action })

// Proposals
export const generateProposal = (id) => API.post(`/papers/${id}/proposal/generate`)
export const getProposal = (id) => API.get(`/papers/${id}/proposal`)
export const editProposal = (id, data) => API.put(`/papers/${id}/proposal`, data)
export const approveProposal = (id) => API.post(`/papers/${id}/proposal/approve`)

// Final Approval
export const finalApproval = (id, action) => API.post(`/papers/${id}/final-approval`, { action })
