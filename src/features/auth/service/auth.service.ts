import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repository/user.repository';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { User } from '../entity/user.entity';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access_secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_secret';
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '1d';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '30d';

export class AuthService {
  private userRepository = new UserRepository();

  async register(dto: RegisterDto): Promise<{ user: Partial<User>; accessToken: string; refreshToken: string; message: string }> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) throw new Error('Email already in use');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.userRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: (dto.role as any) || 'user'
    });

    const accessToken = this.generateAccessToken(user.id, user.role);
    const refreshToken = this.generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        studentId: user.studentId,
        batch: user.batch,
        collegeId: user.collegeId,
        profilePicture: user.profilePicture
      },
      accessToken,
      refreshToken,
      message: 'User registered successfully'
    };
  }

  async login(dto: LoginDto): Promise<{ user: Partial<User>; accessToken: string; refreshToken: string }> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) throw new Error('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new Error('Invalid credentials');

    const accessToken = this.generateAccessToken(user.id, user.role);
    const refreshToken = this.generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        studentId: user.studentId,
        batch: user.batch,
        collegeId: user.collegeId,
        profilePicture: user.profilePicture
      },
      accessToken,
      refreshToken
    };
  }

  private generateAccessToken(userId: string, role?: string): string {
    return jwt.sign({ id: userId, role }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY as any });
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign({ id: userId }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY as any });
  }

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as { id: string };
      const newAccessToken = this.generateAccessToken(payload.id);
      const newRefreshToken = this.generateRefreshToken(payload.id);
      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async getAllUsers(): Promise<Partial<User>[]> {
    const users = await this.userRepository.findAll();
    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
      studentId: user.studentId,
      batch: user.batch,
      collegeId: user.collegeId,
      profilePicture: user.profilePicture,
      createdAt: (user as any).createdAt
    }));
  }
}
