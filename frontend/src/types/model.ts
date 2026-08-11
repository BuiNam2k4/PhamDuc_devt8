export enum ModelStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TRAINING = 'TRAINING',
}

export interface Model {
  id: string;
  name: string;
  precision: string;
  recall: string;
  f1Score: string;
  status: ModelStatus | string;
  modelPath?: string;
}

export interface ModelStatistic extends Model {
  totalSamples?: number;
  cheatingDetections?: number;
}

export interface ModelCreationRequest {
  name: string;
  precision: string;
  recall: string;
  f1Score: string;
  status?: string;
  modelPath?: string;
  totalSamples?: number;
  cheatingDetections?: number;
}

export interface ModelUpdateRequest {
  name?: string;
  precision?: string;
  recall?: string;
  f1Score?: string;
  status?: string;
  modelPath?: string;
  totalSamples?: number;
  cheatingDetections?: number;
}
