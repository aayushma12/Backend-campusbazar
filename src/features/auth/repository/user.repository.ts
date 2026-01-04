
import { UserModel, IUser } from '../entity/user.model';
import { IUserRepository } from './user.repository.interface';


export class UserRepository implements IUserRepository {
  private model = UserModel;

  async findByEmail(email: string): Promise<IUser | null> {
    return this.model.findOne({ email });
  }

  async create(user: { name: string; email: string; password: string; fcmToken?: string; collegeId?: string }): Promise<IUser> {
    return this.model.create(user);
  }

  async findById(id: string): Promise<IUser | null> {
    return this.model.findById(id);
  }

  async update(id: string, update: Partial<IUser>): Promise<IUser | null> {
    return this.model.findByIdAndUpdate(id, update, { new: true });
  }
}
