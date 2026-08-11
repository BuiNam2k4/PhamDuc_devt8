export interface Subject {
  id: string;
  subjectCode: string;
  name: string;
  credits: number;
  department?: string;
}

export interface SubjectResponse extends Subject {}

export interface SubjectCreationRequest {
  subjectCode: string;
  name: string;
  credits: number;
  department?: string;
}

export interface SubjectUpdateRequest {
  name?: string;
  credits?: number;
  department?: string;
}
