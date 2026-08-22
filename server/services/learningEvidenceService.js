import mongoose from 'mongoose';
import LearningEvidence from '../models/LearningEvidence.js';
import { STAGES, WEB_COURSES } from '../../src/components/member/hugoCoder/lessons/index.js';

export class EvidenceDeletedError extends Error {
  constructor() {
    super('EVIDENCE_DELETED');
    this.name = 'EvidenceDeletedError';
    this.statusCode = 410;
  }
}

const normalizeTag = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9+#.-]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 60);

function lessonSkillTags(course, lessonIndex) {
  const stage = STAGES.find((item) => lessonIndex >= item.from && lessonIndex < item.to);
  return [...new Set([
    normalizeTag(course.lang),
    normalizeTag(course.practiceType),
    normalizeTag(stage?.id),
  ].filter(Boolean))];
}

export function privateEvidenceDto(evidence) {
  const value = evidence?.toObject ? evidence.toObject() : evidence;
  return {
    id: String(value._id),
    kind: value.kind,
    title: value.title,
    skillTags: Array.isArray(value.skillTags) ? value.skillTags : [],
    occurredAt: value.occurredAt,
    sourceApp: value.sourceApp,
    source: { type: value.source.type, id: value.source.id },
    status: value.status,
  };
}

export async function createLessonEvidence({ bio, lessonId, occurredAt = new Date() }) {
  const lessonIndex = WEB_COURSES.findIndex((course) => course.id === lessonId);
  if (lessonIndex === -1) throw new Error('LESSON_NOT_FOUND');
  const course = WEB_COURSES[lessonIndex];
  const identity = {
    ownerMemberId: bio._id,
    sourceApp: 'study',
    'source.type': 'lesson',
    'source.id': lessonId,
    kind: 'lesson_completion',
  };

  const existing = await LearningEvidence.findOne(identity);
  if (existing?.status === 'deleted') throw new EvidenceDeletedError();
  if (existing) return { evidence: existing, created: false };

  try {
    const evidence = await LearningEvidence.create({
      ownerMemberId: bio._id,
      sourceApp: 'study',
      source: { type: 'lesson', id: lessonId },
      kind: 'lesson_completion',
      title: course.title,
      skillTags: lessonSkillTags(course, lessonIndex),
      occurredAt,
      proof: {
        method: 'server_verified_completion',
        ref: `${bio._id}:${lessonId}`,
      },
      status: 'active',
    });
    return { evidence, created: true };
  } catch (error) {
    if (error?.code !== 11000) throw error;
    const raced = await LearningEvidence.findOne(identity);
    if (raced?.status === 'deleted') throw new EvidenceDeletedError();
    if (!raced) throw error;
    return { evidence: raced, created: false };
  }
}

const encodeCursor = (evidence) => Buffer.from(JSON.stringify({
  at: new Date(evidence.occurredAt).toISOString(),
  id: String(evidence._id),
})).toString('base64url');

function decodeCursor(cursor) {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(String(cursor), 'base64url').toString('utf8'));
    const at = new Date(parsed.at);
    if (Number.isNaN(at.getTime()) || !mongoose.isValidObjectId(parsed.id)) throw new Error('invalid');
    return { at, id: new mongoose.Types.ObjectId(parsed.id) };
  } catch {
    const error = new Error('INVALID_CURSOR');
    error.statusCode = 400;
    throw error;
  }
}

export async function listPrivateEvidence({ ownerMemberId, cursor, limit = 20 }) {
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 20));
  const decoded = decodeCursor(cursor);
  const query = { ownerMemberId, status: 'active' };
  if (decoded) {
    query.$or = [
      { occurredAt: { $lt: decoded.at } },
      { occurredAt: decoded.at, _id: { $lt: decoded.id } },
    ];
  }

  const rows = await LearningEvidence.find(query)
    .sort({ occurredAt: -1, _id: -1 })
    .limit(pageSize + 1)
    .lean();
  const hasNextPage = rows.length > pageSize;
  const visible = hasNextPage ? rows.slice(0, pageSize) : rows;
  return {
    items: visible.map(privateEvidenceDto),
    nextCursor: hasNextPage ? encodeCursor(visible[visible.length - 1]) : null,
  };
}

export async function deletePrivateEvidence({ ownerMemberId, evidenceId }) {
  if (!mongoose.isValidObjectId(evidenceId)) return false;
  const evidence = await LearningEvidence.findOne({ _id: evidenceId, ownerMemberId });
  if (!evidence) return false;
  if (evidence.status === 'deleted') return true;

  evidence.status = 'deleted';
  evidence.title = '';
  evidence.skillTags = [];
  evidence.proof = null;
  await evidence.save();
  return true;
}
