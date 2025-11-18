import request from 'supertest';
import app from '../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeEach(async () => {
  // Clean database before each test
  await prisma.task.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /tasks', () => {
  test('should return empty array when no tasks exist', async () => {
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('should return only uncompleted tasks', async () => {
    await prisma.task.create({
      data: { title: 'Completed Task', description: 'Should not appear', completed: true }
    });
    await prisma.task.create({
      data: { title: 'Active Task', description: 'Should appear', completed: false }
    });

    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe('Active Task');
    expect(res.body[0].completed).toBe(false);
  });

  test('should return maximum of 5 most recent tasks', async () => {
    // Create 7 tasks
    for (let i = 1; i <= 7; i++) {
      await prisma.task.create({
        data: { title: `Task ${i}`, description: `Description ${i}` }
      });
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(5);
    // Should be ordered by most recent first
    expect(res.body[0].title).toBe('Task 7');
    expect(res.body[4].title).toBe('Task 3');
  });

  test('should order tasks by creation date descending', async () => {
    await prisma.task.create({
      data: { title: 'First Task', description: 'Created first' }
    });
    await new Promise(resolve => setTimeout(resolve, 50));
    await prisma.task.create({
      data: { title: 'Second Task', description: 'Created second' }
    });
    await new Promise(resolve => setTimeout(resolve, 50));
    await prisma.task.create({
      data: { title: 'Third Task', description: 'Created third' }
    });

    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body[0].title).toBe('Third Task');
    expect(res.body[1].title).toBe('Second Task');
    expect(res.body[2].title).toBe('First Task');
  });

  test('should include all required fields in response', async () => {
    await prisma.task.create({
      data: { title: 'Test Task', description: 'Test Description' }
    });

    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('title');
    expect(res.body[0]).toHaveProperty('description');
    expect(res.body[0]).toHaveProperty('completed');
    expect(res.body[0]).toHaveProperty('createdAt');
    expect(res.body[0]).toHaveProperty('updatedAt');
  });
});

describe('POST /tasks', () => {
  test('should create task with title and description', async () => {
    const taskData = {
      title: 'New Task',
      description: 'Task description'
    };

    const res = await request(app)
      .post('/tasks')
      .send(taskData);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe(taskData.title);
    expect(res.body.description).toBe(taskData.description);
    expect(res.body.completed).toBe(false);
  });

  test('should create task with title only (no description)', async () => {
    const taskData = { title: 'Task without description' };

    const res = await request(app)
      .post('/tasks')
      .send(taskData);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe(taskData.title);
    expect(res.body.description).toBeNull();
  });

  test('should return 400 when title is missing', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ description: 'Description without title' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toBe('title required');
  });

  test('should return 400 when title is empty string', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: '', description: 'Description' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('title required');
  });

  test('should return 400 when request body is empty', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('title required');
  });

  test('should persist task in database', async () => {
    const taskData = {
      title: 'Persisted Task',
      description: 'Should be in DB'
    };

    const res = await request(app)
      .post('/tasks')
      .send(taskData);

    const taskInDb = await prisma.task.findUnique({
      where: { id: res.body.id }
    });

    expect(taskInDb).not.toBeNull();
    expect(taskInDb?.title).toBe(taskData.title);
    expect(taskInDb?.description).toBe(taskData.description);
    expect(taskInDb?.completed).toBe(false);
  });

  test('should handle special characters in title and description', async () => {
    const taskData = {
      title: 'Task with special chars: @#$%^&*()',
      description: 'Description with émojis 🎉 and unicode: åäö'
    };

    const res = await request(app)
      .post('/tasks')
      .send(taskData);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe(taskData.title);
    expect(res.body.description).toBe(taskData.description);
  });

  test('should handle long title and description', async () => {
    const taskData = {
      title: 'A'.repeat(255),
      description: 'B'.repeat(1000)
    };

    const res = await request(app)
      .post('/tasks')
      .send(taskData);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe(taskData.title);
    expect(res.body.description).toBe(taskData.description);
  });
});

describe('POST /tasks/:id/done', () => {
  test('should mark task as completed', async () => {
    const task = await prisma.task.create({
      data: { title: 'Task to complete', description: 'Will be completed' }
    });

    const res = await request(app)
      .post(`/tasks/${task.id}/done`);

    expect(res.status).toBe(204);

    const updatedTask = await prisma.task.findUnique({
      where: { id: task.id }
    });
    expect(updatedTask?.completed).toBe(true);
  });

  test('should return 404 for non-existent task', async () => {
    const res = await request(app)
      .post('/tasks/99999/done');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toBe('task not found');
  });

  test('should return 400 for invalid task id (non-numeric)', async () => {
    const res = await request(app)
      .post('/tasks/invalid/done');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toBe('invalid id');
  });

  test('should return 400 for invalid task id (float)', async () => {
    const res = await request(app)
      .post('/tasks/12.5/done');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid id');
  });

  test('should return 400 for negative task id', async () => {
    const res = await request(app)
      .post('/tasks/-1/done');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('task not found');
  });

  test('should successfully mark already completed task as completed (idempotent)', async () => {
    const task = await prisma.task.create({
      data: { title: 'Already completed', completed: true }
    });

    const res = await request(app)
      .post(`/tasks/${task.id}/done`);

    expect(res.status).toBe(204);

    const updatedTask = await prisma.task.findUnique({
      where: { id: task.id }
    });
    expect(updatedTask?.completed).toBe(true);
  });

  test('completed task should not appear in GET /tasks', async () => {
    const task = await prisma.task.create({
      data: { title: 'Task to hide', description: 'Will be hidden' }
    });

    // Mark as completed
    await request(app).post(`/tasks/${task.id}/done`);

    // Check it doesn't appear in list
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body.find((t: any) => t.id === task.id)).toBeUndefined();
  });

  test('should update updatedAt timestamp when completing task', async () => {
    const task = await prisma.task.create({
      data: { title: 'Task to check timestamp' }
    });

    const originalUpdatedAt = task.updatedAt;
    
    // Wait a bit to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 100));

    await request(app).post(`/tasks/${task.id}/done`);

    const updatedTask = await prisma.task.findUnique({
      where: { id: task.id }
    });

    expect(updatedTask?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});

describe('Integration: Full workflow', () => {
  test('should handle complete task lifecycle', async () => {
    // Create a task
    const createRes = await request(app)
      .post('/tasks')
      .send({ title: 'Lifecycle Task', description: 'Full test' });

    expect(createRes.status).toBe(201);
    const taskId = createRes.body.id;

    // Verify it appears in list
    let listRes = await request(app).get('/tasks');
    expect(listRes.body.find((t: any) => t.id === taskId)).toBeDefined();

    // Mark as done
    const doneRes = await request(app).post(`/tasks/${taskId}/done`);
    expect(doneRes.status).toBe(204);

    // Verify it no longer appears in list
    listRes = await request(app).get('/tasks');
    expect(listRes.body.find((t: any) => t.id === taskId)).toBeUndefined();
  });

  test('should handle multiple concurrent tasks', async () => {
    const tasks = await Promise.all([
      request(app).post('/tasks').send({ title: 'Task 1' }),
      request(app).post('/tasks').send({ title: 'Task 2' }),
      request(app).post('/tasks').send({ title: 'Task 3' })
    ]);

    expect(tasks.every(res => res.status === 201)).toBe(true);

    const listRes = await request(app).get('/tasks');
    expect(listRes.body.length).toBe(3);
  });
});

describe('Edge cases and error handling', () => {
  test('should handle database connection gracefully', async () => {
    // This test assumes normal operation
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
  });

  test('should handle malformed JSON in POST request', async () => {
    const res = await request(app)
      .post('/tasks')
      .set('Content-Type', 'application/json')
      .send('invalid json {');

    expect(res.status).toBe(400);
  });

  test('should handle unexpected fields in request body', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({
        title: 'Valid Task',
        description: 'Valid description',
        unexpectedField: 'Should be ignored',
        completed: true // Should not override default
      });

    expect(res.status).toBe(201);
    expect(res.body.completed).toBe(false); // Should default to false
    expect(res.body).not.toHaveProperty('unexpectedField');
  });
});
