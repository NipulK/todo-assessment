import request from 'supertest';
import app from '../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.task.deleteMany();
});
afterAll(async () => {
  await prisma.$disconnect();
});

test('create and list tasks', async () => {
  const createRes = await request(app)
    .post('/tasks')
    .send({ title: 'integ test', description: 'desc' });
  expect(createRes.status).toBe(201);

  const getRes = await request(app).get('/tasks');
  expect(getRes.status).toBe(200);
  expect(Array.isArray(getRes.body)).toBe(true);
  expect(getRes.body.some((t: any) => t.title === 'integ test')).toBe(true);
});
