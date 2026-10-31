import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { CONFIG } from './server/config/index.js';

// Route imports
import authRoutes from './server/routes/authRoutes.js';
import citizenRoutes from './server/routes/citizenRoutes.js';
import hospitalRoutes from './server/routes/hospitalRoutes.js';
import officerRoutes from './server/routes/officerRoutes.js';
import adminRoutes from './server/routes/adminRoutes.js';
import certificateRoutes from './server/routes/certificateRoutes.js';
import archiveRoutes from './server/routes/archiveRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();

  // Basic Middleware
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Ensure uploads and certificates folders exist
  if (!fs.existsSync(CONFIG.UPLOAD_DIR)) {
    fs.mkdirSync(CONFIG.UPLOAD_DIR, { recursive: true });
  }
  if (!fs.existsSync(CONFIG.CERTIFICATES_DIR)) {
    fs.mkdirSync(CONFIG.CERTIFICATES_DIR, { recursive: true });
  }

  // Static directory for uploaded files and generated certificates
  app.use('/uploads', express.static(CONFIG.UPLOAD_DIR));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'UP',
      service: 'Municipal Vital Statistics & Digital Archive API',
      timestamp: new Date().toISOString(),
      municipality: CONFIG.MUNICIPALITY_NAME,
    });
  });

  // Mount API modules
  app.use('/api/auth', authRoutes);
  app.use('/api/citizen', citizenRoutes);
  app.use('/api/hospital', hospitalRoutes);
  app.use('/api/officer', officerRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/certificates', certificateRoutes);
  app.use('/api/archive', archiveRoutes);

  // Development vs Production
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  const port = CONFIG.PORT || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`[Municipal Portal Engine] Server active on port ${port}`);
    console.log(`[Municipal Portal Engine] Database active on ${CONFIG.DATABASE_URL}`);
  });
}

startServer().catch((err) => {
  console.error('[Municipal Portal Server Error]:', err);
});
