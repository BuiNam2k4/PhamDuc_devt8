export enum CameraStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  RECORDING = 'RECORDING',
  ERROR = 'ERROR',
}

export interface Camera {
  id: string;
  cameraCode?: string;
  name?: string;
  ipAddress?: string;
  location?: string;
  status?: CameraStatus | string;
}
