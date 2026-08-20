export interface User {
  user_id: number;
  email: string;
  username: string;
  accessLevel: number;
  isActive: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  accessLevel: number;
}

export interface UpdateUserPayload {
  username: string;
  email: string;
}
