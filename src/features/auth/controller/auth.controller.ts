import { Request, Response } from 'express';

// Mock DB
const users: any[] = [];

export default {
  register: (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    if (users.find(u => u.email === email)) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = { id: users.length + 1, name, email, password };
    users.push(newUser);

    return res.status(201).json({ user: newUser, accessToken: 'mock-token' });
  },

  login: (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    return res.status(200).json({ user, accessToken: 'mock-token' });
  },
};
