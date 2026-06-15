export type UserRole = 'Handler' | 'Supervisor' | 'Manager';

export interface MockUser {
  id: string;
  name: string;
  role: UserRole;
}