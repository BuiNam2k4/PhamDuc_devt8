export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export interface User {
  id: string;
  username: string;
  role: Role | string;
}

export interface UserResponse {
  id: string;
  username: string;
  role: string;
}

export interface UserRegisterRequest {
  username: string;
  password: string;
  role?: string;
}
