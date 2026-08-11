export interface Room {
  id: string;
  roomCode: string;
  name: string;
  capacity?: number;
  building?: string;
  description?: string;
}

export interface RoomResponse extends Room {}

export interface RoomCreationRequest {
  roomCode: string;
  name: string;
  capacity?: number;
  building?: string;
  description?: string;
}

export interface RoomUpdateRequest {
  name?: string;
  capacity?: number;
  building?: string;
  description?: string;
}
