import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

router.get('/', async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: { completed: false },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  res.json(tasks);
});

router.post('/', async (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const task = await prisma.task.create({ data: { title, description } });
  res.status(201).json(task);
});

router.post('/:id/done', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });
  try {
    await prisma.task.update({ where: { id }, data: { completed: true } });
    res.status(204).send();
  } catch (err) {
    res.status(404).json({ error: 'task not found' });
  }
});

export default router;
