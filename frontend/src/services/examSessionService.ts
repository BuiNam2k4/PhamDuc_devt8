import { fetchApi } from './apiClient';
import { ExamSession, ExamSessionCreationRequest, ExamSessionUpdateRequest } from '../types';

export const examSessionService = {
  getAll: () => fetchApi<ExamSession[]>('/exam-sessions'),
  getById: (id: string) => fetchApi<ExamSession>(`/exam-sessions/${id}`),
  create: (data: ExamSessionCreationRequest) =>
    fetchApi<ExamSession>('/exam-sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: ExamSessionUpdateRequest) =>
    fetchApi<ExamSession>(`/exam-sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchApi<string>(`/exam-sessions/${id}`, {
      method: 'DELETE',
    }),
  addStudents: (id: string, studentIds: string[]) =>
    fetchApi<ExamSession>(`/exam-sessions/${id}/students`, {
      method: 'POST',
      body: JSON.stringify(studentIds),
    }),
};
