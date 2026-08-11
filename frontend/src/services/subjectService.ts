import { fetchApi } from './apiClient';
import { Subject, SubjectCreationRequest, SubjectUpdateRequest } from '../types';

export const subjectService = {
  getAll: () => fetchApi<Subject[]>('/subjects'),
  getById: (id: string) => fetchApi<Subject>(`/subjects/${id}`),
  getByCode: (code: string) => fetchApi<Subject>(`/subjects/code/${code}`),
  create: (data: SubjectCreationRequest) =>
    fetchApi<Subject>('/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: SubjectUpdateRequest) =>
    fetchApi<Subject>(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchApi<string>(`/subjects/${id}`, {
      method: 'DELETE',
    }),
};
