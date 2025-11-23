import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /tasks
 * Returns tasks with optional filtering
 * Query params: priority, category, search, showCompleted, limit
 */
router.get('/', async (req, res) => {
  try {
    const { 
      priority, 
      category, 
      search, 
      showCompleted = 'false',
      limit = '5'
    } = req.query;

    const where: any = {};
    
    // Filter by completion status
    if (showCompleted === 'true') {
      where.completed = true;
    } else {
      where.completed = false;
    }
    
    // Filter by priority
    if (priority && typeof priority === 'string') {
      where.priority = priority;
    }
    
    // Filter by category
    if (category && typeof category === 'string') {
      where.category = category;
    }
    
    // Search in title and description
    if (search && typeof search === 'string') {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { completed: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: parseInt(limit as string),
    });
    
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * GET /tasks/stats
 * Returns statistics about tasks
 */
router.get('/stats', async (req, res) => {
  try {
    const [total, completed, pending, overdue, byPriority, byCategory] = await Promise.all([
      prisma.task.count(),
      prisma.task.count({ where: { completed: true } }),
      prisma.task.count({ where: { completed: false } }),
      prisma.task.count({ 
        where: { 
          completed: false,
          dueDate: { lt: new Date() }
        } 
      }),
      prisma.task.groupBy({
        by: ['priority'],
        _count: true,
        where: { completed: false }
      }),
      prisma.task.groupBy({
        by: ['category'],
        _count: true,
        where: { 
          completed: false,
          category: { not: null }
        }
      })
    ]);

    res.json({
      total,
      completed,
      pending,
      overdue,
      byPriority: byPriority.reduce((acc: Record<string, number>, item: any) => {
        acc[item.priority] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byCategory: byCategory.reduce((acc: Record<string, number>, item: any) => {
        if (item.category) acc[item.category] = item._count;
        return acc;
      }, {} as Record<string, number>)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * POST /tasks
 * Creates a new task with optional priority, dueDate, category, and tags
 */
router.post('/', async (req, res) => {
  const { title, description, priority, dueDate, category, tags } = req.body;
  
  // Validation: title is required
  if (!title) {
    return res.status(400).json({ error: 'title required' });
  }
  
  // Validate priority
  if (priority && !['HIGH', 'MEDIUM', 'LOW'].includes(priority)) {
    return res.status(400).json({ error: 'invalid priority. Must be HIGH, MEDIUM, or LOW' });
  }
  
  try {
    const taskData: any = { 
      title, 
      description,
      priority: priority || 'MEDIUM'
    };
    
    if (dueDate) {
      taskData.dueDate = new Date(dueDate);
    }
    
    if (category) {
      taskData.category = category;
    }
    
    if (tags && Array.isArray(tags)) {
      taskData.tags = JSON.stringify(tags);
    }
    
    const task = await prisma.task.create({ data: taskData });
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

/**
 * PUT /tasks/:id
 * Updates an existing task
 */
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { title, description, priority, dueDate, category, tags } = req.body;
  
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }
  
  // Validate priority if provided
  if (priority && !['HIGH', 'MEDIUM', 'LOW'].includes(priority)) {
    return res.status(400).json({ error: 'invalid priority. Must be HIGH, MEDIUM, or LOW' });
  }
  
  try {
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (category !== undefined) updateData.category = category;
    
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }
    
    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags) ? JSON.stringify(tags) : null;
    }
    
    const task = await prisma.task.update({ 
      where: { id }, 
      data: updateData 
    });
    
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(404).json({ error: 'task not found' });
  }
});

/**
 * DELETE /tasks/:id
 * Deletes a task
 */
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }
  
  try {
    await prisma.task.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(404).json({ error: 'task not found' });
  }
});

/**
 * POST /tasks/:id/done
 * Marks a task as completed
 */
router.post('/:id/done', async (req, res) => {
  const idParam = req.params.id;
  
  // Check if the ID contains a decimal point (float)
  if (idParam.includes('.') || idParam.includes(',')) {
    return res.status(400).json({ error: 'invalid id' });
  }
  
  const id = Number(idParam);
  
  // Validation: id must be a valid number
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }
  
  try {
    await prisma.task.update({ 
      where: { id }, 
      data: { 
        completed: true,
        completedAt: new Date()
      } 
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(404).json({ error: 'task not found' });
  }
});

/**
 * POST /tasks/:id/uncomplete
 * Marks a task as not completed
 */
router.post('/:id/uncomplete', async (req, res) => {
  const id = Number(req.params.id);
  
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }
  
  try {
    await prisma.task.update({ 
      where: { id }, 
      data: { 
        completed: false,
        completedAt: null
      } 
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error uncompleting task:', error);
    res.status(404).json({ error: 'task not found' });
  }
});

export default router;
