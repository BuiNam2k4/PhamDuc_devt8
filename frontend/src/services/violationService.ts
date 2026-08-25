import { fetchApi } from './apiClient';
import { RecognitionResult } from '../types';

export const violationService = {
  getAll: () => fetchApi<RecognitionResult[]>('/violations'),
  getBySessionId: (examSessionId: string) => 
    fetchApi<RecognitionResult[]>(`/violations/session/${examSessionId}`),
  delete: (id: string) =>
    fetchApi<string>(`/violations/${id}`, {
      method: 'DELETE',
    }),
};
