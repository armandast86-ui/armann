import { Router } from 'express';
import multer from 'multer';
import { mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { requireAdmin } from '../auth.js';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads';
mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, UPLOAD_DIR),
    filename: (_req, file, callback) => {
      const extension = extname(file.originalname).toLowerCase();
      callback(null, `${randomUUID()}${ALLOWED.has(extension) ? extension : '.jpg'}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const extension = extname(file.originalname).toLowerCase();
    callback(null, ALLOWED.has(extension));
  },
});

export const uploadRouter = Router();

/** Product image upload — administrators only, images up to 5 MB. */
uploadRouter.post('/uploads', requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'فایلی برای بارگذاری انتخاب نشده یا فرمت آن مجاز نیست.' });
  }
  return res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

export { UPLOAD_DIR };
