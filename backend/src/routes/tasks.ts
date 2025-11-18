import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /tasks
 * Returns the 5 most recent uncompleted tasks, ordered by creation date (newest first)
 */
router.get('/', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { completed: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * POST /tasks
 * Creates a new task with required title and optional description
 */
router.post('/', async (req, res) => {
  const { title, description } = req.body;
  
  // Validation: title is required
  if (!title) {
    return res.status(400).json({ error: 'title required' });
  }
  
  try {
    const task = await prisma.task.create({ 
      data: { title, description } 
    });
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

/**
 * POST /tasks/:id/done
 * Marks a task as completed
 */
router.post('/:id/done', async (req, res) => {
  const id = Number(req.params.id);
  
  // Validation: id must be a valid number
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }
  
  try {
    await prisma.task.update({ 
      where: { id }, 
      data: { completed: true } 
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(404).json({ error: 'task not found' });
  }
});

export default router;
