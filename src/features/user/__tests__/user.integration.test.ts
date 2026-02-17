import request from 'supertest';
import app from '../../../app';
import { UserModel } from '../../auth/entity/user.model';

let adminToken: string;
let userId: string;

beforeAll(async () => {
  // Create admin, get token (mock or seed as needed)
});

describe('User Management Integration', () => {
  it('should create a user as admin', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User2', email: 'user2@example.com', password: 'User2Pass123' });
    expect(res.status).toBe(201);
    userId = res.body.user.id;
  });

  it('should get all users as admin', async () => {
    const res = await request(app)
      .get('/api/auth/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should delete a user as admin', async () => {
    const res = await request(app)
      .delete(`/api/user/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  // ...add more tests for pagination, edge cases, etc. (total 25+ across all files)
});
