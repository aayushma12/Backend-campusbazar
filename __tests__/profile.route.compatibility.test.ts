import request from 'supertest';
import express from 'express';
import profileRoutes from '../src/features/profile/routes/profile.routes';

const app = express();
app.use('/api/profile', profileRoutes);
app.use('/api/v1/profile', profileRoutes);

describe('Profile route backward compatibility', () => {
  it('serves legacy GET /api/profile (route exists, protected by auth)', async () => {
    const response = await request(app).get('/api/profile');

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        message: 'No token provided',
      })
    );
  });

  it('serves v1 GET /api/v1/profile (route exists, protected by auth)', async () => {
    const response = await request(app).get('/api/v1/profile');

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        message: 'No token provided',
      })
    );
  });

  it('serves legacy PUT /api/profile (update alias exists, protected by auth)', async () => {
    const response = await request(app).put('/api/profile').send({ name: 'Test' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        message: 'No token provided',
      })
    );
  });

  it('serves v1 PATCH /api/v1/profile/update (update path alias exists, protected by auth)', async () => {
    const response = await request(app).patch('/api/v1/profile/update').send({ name: 'Test' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        message: 'No token provided',
      })
    );
  });
});
