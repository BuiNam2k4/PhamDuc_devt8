import { User } from './user';

export interface Student extends User {
  studentCode: string;
  fullName: string; // Required for student profile
  className?: string;
  avatarUrl?: string;
  faceEmbedding?: string;
}

export interface StudentResponse extends Student {}

export interface StudentCreationRequest {
  username: string;
  password?: string;
  studentCode: string;
  fullName: string;
  email?: string;
  className?: string;
  avatarUrl?: string;
  faceEmbedding?: string;
}

export interface StudentUpdateRequest {
  fullName?: string;
  email?: string;
  className?: string;
  avatarUrl?: string;
  faceEmbedding?: string;
}
