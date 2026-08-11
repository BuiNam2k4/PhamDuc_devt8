import { Model } from './model';
import { ExamSessionCamera } from './exam';

export enum ViolationType {
  PHONE_DETECTED = 'PHONE_DETECTED',
  LOOK_AWAY = 'LOOK_AWAY',
  MULTIPLE_FACES = 'MULTIPLE_FACES',
  FACE_NOT_DETECTED = 'FACE_NOT_DETECTED',
  USING_DOCUMENT = 'USING_DOCUMENT',
  HEAD_POSE_ABNORMAL = 'HEAD_POSE_ABNORMAL',
  OTHER = 'OTHER',
}

export interface RecognitionResult {
  id: string;
  violationType?: ViolationType | string;
  confidence?: number;
  detectionTime: string;
  detail?: string;
  imageUrl?: string;
  model?: Model;
  examSessionCamera?: ExamSessionCamera;
}
