import { IUser } from '../entity/user.model';

export interface IUserRepository {
  findByEmail(email: string): Promise<IUser | null>;
  create(user: Omit<IUser, keyof import('mongoose').Document>): Promise<IUser>;
  findById(id: string): Promise<IUser | null>;
  update(id: string, update: Partial<IUser>): Promise<IUser | null>;
  findAll(): Promise<IUser[]>;
}
