import { fetchApi } from './apiClient';
import { Camera } from '../types';

export const cameraService = {
  getAll: () => fetchApi<Camera[]>('/cameras'),
  getById: (id: string) => fetchApi<Camera>(`/cameras/${id}`),
  create: (data: Partial<Camera>) =>
    fetchApi<Camera>('/cameras', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Camera>) =>
    fetchApi<Camera>(`/cameras/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchApi<string>(`/cameras/${id}`, {
      method: 'DELETE',
    }),
};
