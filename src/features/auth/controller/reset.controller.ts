import { Request, Response } from 'express';
import { AuthService } from '../service/auth.service';

const authService = new AuthService();

export default {
  forgotPassword: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
        });
      }

      await authService.forgotPassword(email);

      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to process forgot password request',
      });
    }
  },

  resetPassword: async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const { password } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Reset token is required',
        });
      }

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'New password is required',
        });
      }

      await authService.resetPassword(token, password);

      return res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to reset password',
      });
    }
  },
};
