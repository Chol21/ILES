// src/services/studentService.js
// All API calls for the Student Dashboard live here.
// Import 'api' (the axios instance) and call these functions from your components.
import api from '../api/axios';
// nn PLACEMENT nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn
// Get the student's active placement (returns first item in the list)
export const getMyPlacement = async () => {
const res = await api.get('/placements/');
return res.data[0] || null; // null if no placement assigned yet
};
// nn WEEKLY LOGS nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn
// Fetch all weekly logs for the logged-in student
export const getMyLogs = async () => {
const res = await api.get('/weekly-logs/');
return res.data;
};
// Fetch a single log by its ID (used for the detail/edit view)
export const getLogById = async (logId) => {
const res = await api.get(`/weekly-logs/${logId}/`);
return res.data;
};
// Create a new log (saved as draft automatically by the backend)
// placementId: the id of the student's placement
// formData: { week_number, week_ending_date, activities, key_learnings, challenges }
export const createLog = async (placementId, formData) => {
const res = await api.post('/weekly-logs/', {
...formData,
placement: placementId,
});
return res.data;
};
// Update a draft or rejected log (partial update — only send changed fields)
export const updateLog = async (logId, formData) => {
const res = await api.patch(`/weekly-logs/${logId}/`, formData);
return res.data;
};
// Submit a draft or rejected log for supervisor review
export const submitLogForReview = async (logId) => {
const res = await api.post(`/weekly-logs/${logId}/submit/`);
return res.data;
};
// Delete a draft log (only allowed before submission)
export const deleteLog = async (logId) => {
await api.delete(`/weekly-logs/${logId}/`);
};
// nn EVALUATIONS nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn
// Get individual criterion scores for a placement
export const getEvaluations = async (placementId) => {
const res = await api.get(`/evaluations/?placement=${placementId}`);
return res.data;
};
// Get the overall grade and total score for all placements (filter client-side)
export const getOverallEvaluation = async (placementId) => {
const res = await api.get('/overall-evaluations/');
return res.data.find(o => o.placement === placementId) || null;
};
// Get the list of all evaluation criteria with their weights
export const getEvaluationCriteria = async () => {
const res = await api.get('/evaluation-criteria/');
return res.data;
};
