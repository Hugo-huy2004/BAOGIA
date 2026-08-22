import express from 'express';
import mongoose from 'mongoose';
import { requireAdmin } from '../middleware/authMiddleware.js';
import AdminAuditLog from '../models/AdminAuditLog.js';
import {
  approveAIWorkforceTask,
  createAndRunAIWorkforceTask,
  getAIWorkforceTask,
  listAIEmployees,
  listAIWorkforceTasks,
  rejectAIWorkforceTask,
} from '../services/aiWorkforceService.js';

const router = express.Router();
router.use(requireAdmin);

function adminIdentity(req) {
  return String(req.admin?.username || req.admin?.id || 'admin');
}

function statusForError(error) {
  if (error?.code === 'NOT_FOUND') return 404;
  if (error?.code === 'INVALID_STATE') return 409;
  if (error?.code === 'INVALID_INPUT' || error?.code === 'UNKNOWN_AGENT') return 400;
  if (error instanceof mongoose.Error.CastError) return 400;
  return 500;
}

async function audit(req, action, details) {
  await AdminAuditLog.create({
    adminId: String(req.admin?.id || 'ADMIN'),
    adminUsername: adminIdentity(req),
    action,
    ipAddress: req.ip || '',
    userAgent: req.headers['user-agent'] || '',
    details,
  });
}

router.get('/agents', (_req, res) => {
  res.json({ success: true, agents: listAIEmployees() });
});

router.get('/tasks', async (req, res) => {
  try {
    const tasks = await listAIWorkforceTasks({
      status: req.query.status,
      agentKey: req.query.agentKey,
      limit: req.query.limit,
    });
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(statusForError(error)).json({ error: error.message });
  }
});

router.get('/tasks/:id', async (req, res) => {
  try {
    const task = await getAIWorkforceTask(req.params.id);
    if (!task) return res.status(404).json({ error: 'Nhiệm vụ không tồn tại' });
    res.json({ success: true, task });
  } catch (error) {
    res.status(statusForError(error)).json({ error: error.message });
  }
});

router.post('/tasks', async (req, res) => {
  try {
    const task = await createAndRunAIWorkforceTask({
      agentKey: req.body.agentKey,
      objective: req.body.objective,
      context: req.body.context,
      requestedBy: adminIdentity(req),
    });
    await audit(req, 'ai_workforce_task_created', {
      taskId: String(task._id),
      agentKey: task.agentKey,
      status: task.status,
    });
    res.status(201).json({ success: true, task });
  } catch (error) {
    console.error('[AI Workforce create task]', error);
    res.status(statusForError(error)).json({ error: error.message });
  }
});

router.post('/tasks/:id/approve', async (req, res) => {
  try {
    const task = await approveAIWorkforceTask(req.params.id, {
      decidedBy: adminIdentity(req),
      note: req.body.note,
    });
    await audit(req, 'ai_workforce_task_approved', {
      taskId: String(task._id),
      agentKey: task.agentKey,
      actionType: task.proposedAction?.type || '',
    });
    res.json({ success: true, task });
  } catch (error) {
    console.error('[AI Workforce approve task]', error);
    res.status(statusForError(error)).json({ error: error.message });
  }
});

router.post('/tasks/:id/reject', async (req, res) => {
  try {
    const task = await rejectAIWorkforceTask(req.params.id, {
      decidedBy: adminIdentity(req),
      note: req.body.note,
    });
    await audit(req, 'ai_workforce_task_rejected', {
      taskId: String(task._id),
      agentKey: task.agentKey,
    });
    res.json({ success: true, task });
  } catch (error) {
    console.error('[AI Workforce reject task]', error);
    res.status(statusForError(error)).json({ error: error.message });
  }
});

export default router;
