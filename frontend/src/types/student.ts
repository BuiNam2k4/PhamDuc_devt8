export interface Student {
  id: string;
  studentCode: string;
  fullName: string;
  email?: string;
  className?: string;
  avatarUrl?: string;
  faceEmbedding?: string;
}

export interface StudentResponse extends Student {}

export interface StudentCreationRequest {
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
