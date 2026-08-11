import { fetchApi } from './apiClient';
import { Student, StudentCreationRequest, StudentUpdateRequest } from '../types';

export const studentService = {
  getAll: () => fetchApi<Student[]>('/students'),
  getById: (id: string) => fetchApi<Student>(`/students/${id}`),
  getByCode: (code: string) => fetchApi<Student>(`/students/code/${code}`),
  create: (data: StudentCreationRequest) =>
    fetchApi<Student>('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: StudentUpdateRequest) =>
    fetchApi<Student>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchApi<string>(`/students/${id}`, {
      method: 'DELETE',
    }),
};
