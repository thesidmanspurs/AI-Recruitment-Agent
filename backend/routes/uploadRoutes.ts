import { Router } from 'express';
import multer from 'multer';
import { uploadController } from '../controllers/uploadController.js';

/**
 * Authenticated file-extraction routes. Stateless — files are kept in memory
 * just long enough to extract text and are then garbage collected with the
 * request. Never written to disk.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5 MB single file
});

const router = Router();

router.post('/extract-text', upload.single('file'), uploadController.extractText);

export default router;
