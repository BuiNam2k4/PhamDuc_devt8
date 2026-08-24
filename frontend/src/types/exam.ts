import { Room } from './room';
import { Subject } from './subject';
import { Student } from './student';
import { Camera } from './camera';
import { Model } from './model';

export enum ExamStatus {
  SCHEDULED = 'SCHEDULED',
  CHECKED_IN = 'CHECKED_IN',
  EXAMINING = 'EXAMINING',
  COMPLETED = 'COMPLETED',
  ABSENT = 'ABSENT',
  VIOLATED = 'VIOLATED',
}

export enum ExamMode {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}

export interface ExamSession {
  id: string;
  startTime?: string;
  duration?: number;
  mode?: ExamMode;
  room?: Room;
  subject?: Subject;
  model?: Model;
  examSessionDetails?: ExamSessionDetail[];
  examSessionCameraId?: string;
  examSessionCameras?: ExamSessionCamera[];
}

export interface ExamSessionDetail {
  id: string;
  status?: ExamStatus | string;
  seatNumber?: string;
  note?: string;
  student?: Student;
  examSession?: ExamSession;
}

export interface ExamSessionCamera {
  id: string;
  videoPath?: string;
  camera?: Camera;
  examSession?: ExamSession;
}

export interface ExamSessionCreationRequest {
  startTime: string;
  duration: number;
  mode: ExamMode;
  roomId?: string;
  subjectId: string;
  modelId?: string;
  studentIds?: string[];
  cameraIds?: string[];
}

export interface ExamSessionUpdateRequest {
  startTime?: string;
  duration?: number;
  mode?: ExamMode;
  roomId?: string;
  subjectId?: string;
  modelId?: string;
  cameraIds?: string[];
}
