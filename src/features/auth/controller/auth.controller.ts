import { Request, Response } from 'express';
import { AuthService } from '../service/auth.service';

const authService = new AuthService();

export default {
  register: async (req: Request, res: Response) => {
    try {
      const result = await authService.register(req.body);
      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const result = await authService.login(req.body);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
  },

  refresh: async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }
      const result = await authService.refreshTokens(refreshToken);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
  },

  getAllUsers: async (req: Request, res: Response) => {
    try {
      const users = await authService.getAllUsers();
      return res.status(200).json({
        success: true,
        data: users
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};
