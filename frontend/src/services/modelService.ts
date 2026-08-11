import { fetchApi } from './apiClient';
import { ModelStatistic, ModelCreationRequest, ModelUpdateRequest } from '../types';

export const modelService = {
  getAll: () => fetchApi<ModelStatistic[]>('/models'),
  getById: (id: string) => fetchApi<ModelStatistic>(`/models/${id}`),
  getActive: () => fetchApi<ModelStatistic>('/models/active'),
  create: (data: ModelCreationRequest) =>
    fetchApi<ModelStatistic>('/models', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: ModelUpdateRequest) =>
    fetchApi<ModelStatistic>(`/models/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  activate: (id: string) =>
    fetchApi<ModelStatistic>(`/models/${id}/activate`, {
      method: 'POST',
    }),
  delete: (id: string) =>
    fetchApi<string>(`/models/${id}`, {
      method: 'DELETE',
    }),
};
