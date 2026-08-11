import { fetchApi } from './apiClient';
import { Room, RoomCreationRequest, RoomUpdateRequest } from '../types';

export const roomService = {
  getAll: () => fetchApi<Room[]>('/rooms'),
  getById: (id: string) => fetchApi<Room>(`/rooms/${id}`),
  getByCode: (code: string) => fetchApi<Room>(`/rooms/code/${code}`),
  create: (data: RoomCreationRequest) =>
    fetchApi<Room>('/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: RoomUpdateRequest) =>
    fetchApi<Room>(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchApi<string>(`/rooms/${id}`, {
      method: 'DELETE',
    }),
};
