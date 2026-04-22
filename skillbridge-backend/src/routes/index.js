import express from 'express';
import { verifyAuth, authorize, validateBatchAccess } from '../middleware/auth.js';

// Controllers
import * as batchController from '../controllers/batchController.js';
import * as sessionController from '../controllers/sessionController.js';
import * as userController from '../controllers/userController.js';
import * as summaryController from '../controllers/summaryController.js';

import * as devController from '../controllers/devController.js';

const router = express.Router();

// ==================== HEALTH ====================
router.get('/', (req, res) => {
  res.json({ message: 'API is working 🚀' });
});

// ==================== PUBLIC ====================
router.post('/users/sync', userController.syncUser);
router.post('/dev/seed', devController.seedDatabase);

// ==================== AUTH ====================
router.use(verifyAuth);

// ==================== USER ====================
router.get('/users/me', userController.getCurrentUser);

// ==================== BATCH ====================
router.post('/batches',
  authorize(['trainer', 'institution']),
  batchController.createBatch
);

router.get('/batches',
  authorize(['trainer', 'institution']),
  batchController.getBatches
);

router.get('/batches/:batchId',
  validateBatchAccess,
  batchController.getBatchDetails
);

router.post('/batches/:batchId/invite',
  authorize(['trainer']),
  validateBatchAccess,
  batchController.generateInviteLink
);

router.post('/batches/join',
  authorize(['student']),
  batchController.joinBatch
);

router.post('/batches/:batchId/trainers',
  authorize(['institution']),
  validateBatchAccess,
  userController.assignTrainerToBatch
);

// ==================== SESSION ====================
router.post('/sessions',
  authorize(['trainer']),
  sessionController.createSession
);

router.get('/sessions/student',
  authorize(['student']),
  sessionController.getStudentSessions
);

router.get('/sessions/trainer',
  authorize(['trainer']),
  sessionController.getTrainerSessions
);

router.get('/sessions/:sessionId',
  sessionController.getSessionDetails
);

router.post('/attendance/mark',
  authorize(['student', 'trainer']),
  sessionController.markAttendance
);

router.get('/sessions/:sessionId/attendance',
  authorize(['trainer']),
  sessionController.getSessionAttendance
);

// ==================== SUMMARY ====================
router.get('/batches/:batchId/summary',
  authorize(['trainer', 'institution', 'programme_manager', 'monitoring_officer']),
  validateBatchAccess,
  summaryController.getBatchSummary
);

router.get('/institutions/:institutionId/summary',
  authorize(['institution', 'programme_manager', 'monitoring_officer']),
  summaryController.getInstitutionSummary
);

router.get('/programme/summary',
  authorize(['programme_manager', 'monitoring_officer']),
  summaryController.getProgrammeSummary
);

// ==================== INSTITUTION ====================
router.get('/institutions',
  authorize(['programme_manager', 'monitoring_officer']),
  userController.getInstitutions
);

router.get('/institutions/trainers',
  authorize(['institution']),
  userController.getInstitutionTrainers
);

export default router;