import { UserRepository } from '../../auth/repository/user.repository';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import bcrypt from 'bcrypt';

export class UserService {
  private userRepository = new UserRepository();

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error('User not found');
    return { id: user.id, name: user.name, email: user.email, collegeId: user.collegeId };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error('User not found');
    const updated = await this.userRepository.update(userId, dto);
    if (!updated) throw new Error('Update failed');
    return { id: updated.id, name: updated.name, email: updated.email, collegeId: updated.collegeId };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error('User not found');
    const valid = await bcrypt.compare(dto.oldPassword, user.password);
    if (!valid) throw new Error('Old password is incorrect');
    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.update(userId, { password: hashed });
    return { message: 'Password updated successfully' };
  }
}
