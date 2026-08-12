import express from 'express';
import multer from 'multer';
import * as path from 'path';
import { VIDEO_DIR } from './supabase';

/**
 * Admin video upload handler. Stores uploads under VIDEO_DIR (self-hosted, no
 * external dependency). The returned filename is saved to the row's video_url
 * so the player + playout can resolve it locally.
 */
export function startUploadServer() {
  const app = express();
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, VIDEO_DIR),
    filename: (_req, file, cb) => cb(null, `${Date.now()}_${file.originalname.replace(/[^\w.-]/g, '_')}`),
  });
  const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 * 1024 } }); // 2GB

  app.post('/upload', upload.single('video'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'no file' });
    res.json({ video_url: path.basename(req.file.path) });
  });

  app.get('/healthz', (_req, res) => res.json({ ok: true }));

  const port = Number(process.env.UPLOAD_PORT) || 4000;
  app.listen(port, () => console.log(`[upload] listening on :${port}`));
}
