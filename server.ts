import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Ensure local data directory exists on the machine
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'tasks-db.json');
const LOGS_FILE = path.join(DATA_DIR, 'system.log');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// Initial default tasks if local file does not exist yet
const INITIAL_TASKS = [
  {
    id: 'task-101',
    title: 'Implement OAuth2 PKCE Authentication Flow',
    description: 'Build user login and token refresh logic with secure cookies and offline token caching.',
    priority: 'urgent',
    status: 'in_progress',
    progress: 66,
    autoProgress: true,
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    category: 'Backend',
    tags: ['#auth', '#security', '#api'],
    githubUrl: 'https://github.com/myorg/backend-service/pull/142',
    subtasks: [
      { id: 'sub-1', title: 'Configure client credentials & PKCE verifier', completed: true, createdAt: new Date().toISOString() },
      { id: 'sub-2', title: 'Implement refresh token rotation endpoint', completed: true, createdAt: new Date().toISOString() },
      { id: 'sub-3', title: 'Add unit tests for expired token edge cases', completed: false, createdAt: new Date().toISOString() },
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-102',
    title: 'Design Minimalist Task Analytics Dashboard',
    description: 'Create responsive metrics widgets for completed vs pending items, upcoming deadlines, and category filters.',
    priority: 'high',
    status: 'completed',
    progress: 100,
    autoProgress: true,
    dueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    category: 'Design',
    tags: ['#ui', '#dashboard', '#tailwind'],
    githubUrl: 'https://github.com/myorg/web-app/commit/7a82b9c',
    subtasks: [
      { id: 'sub-4', title: 'Define color tokens and typography scale', completed: true, createdAt: new Date().toISOString() },
      { id: 'sub-5', title: 'Wireframe metric summary cards', completed: true, createdAt: new Date().toISOString() },
      { id: 'sub-6', title: 'Review accessibility contrast ratio (WCAG AA)', completed: true, createdAt: new Date().toISOString() },
    ],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    completedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'task-103',
    title: 'Add Offline IndexedDB & Local JSON Sync',
    description: 'Ensure all mutations write immediately to local storage and support reliable JSON/CSV export.',
    priority: 'high',
    status: 'in_progress',
    progress: 50,
    autoProgress: true,
    dueDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    category: 'Frontend',
    tags: ['#pwa', '#offline', '#storage'],
    githubUrl: 'https://github.com/myorg/web-app/pull/89',
    subtasks: [
      { id: 'sub-7', title: 'Add online/offline network listeners', completed: true, createdAt: new Date().toISOString() },
      { id: 'sub-8', title: 'Write JSON and CSV serialization utilities', completed: false, createdAt: new Date().toISOString() },
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-104',
    title: 'Setup Automated Release GitHub Actions Workflow',
    description: 'Deploy staging previews automatically on pull request merge.',
    priority: 'medium',
    status: 'todo',
    progress: 0,
    autoProgress: false,
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    category: 'DevOps',
    tags: ['#ci-cd', '#actions', '#docker'],
    githubUrl: 'https://github.com/myorg/web-app/issues/31',
    subtasks: [
      { id: 'sub-9', title: 'Draft action yaml config', completed: false, createdAt: new Date().toISOString() },
      { id: 'sub-10', title: 'Configure runner secrets', completed: false, createdAt: new Date().toISOString() },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-105',
    title: 'Fix Memory Leak in WebSocket Event Listener',
    description: 'Ensure sockets are cleanly disconnected on unmount to avoid ghost listener retain cycles.',
    priority: 'urgent',
    status: 'review',
    progress: 100,
    autoProgress: true,
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    category: 'Bugfix',
    tags: ['#bug', '#performance', '#sockets'],
    githubUrl: 'https://github.com/myorg/backend-service/pull/154',
    subtasks: [
      { id: 'sub-11', title: 'Reproduce leak in staging environment', completed: true, createdAt: new Date().toISOString() },
      { id: 'sub-12', title: 'Add AbortController cleanup in useEffect', completed: true, createdAt: new Date().toISOString() },
    ],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ version: '1.0.0', lastModified: new Date().toISOString(), tasks: INITIAL_TASKS }, null, 2), 'utf-8');
}

function appendToLocalLog(level: string, action: string, message: string, details?: any) {
  const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] [${action}] ${message} ${details ? JSON.stringify(details) : ''}\n`;
  try {
    fs.appendFileSync(LOGS_FILE, line, 'utf-8');
  } catch (err) {
    console.error('Failed to append to local log file', err);
  }
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Health check & database status
app.get('/api/database/status', (req, res) => {
  try {
    const stats = fs.statSync(DB_FILE);
    const content = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    const logStats = fs.existsSync(LOGS_FILE) ? fs.statSync(LOGS_FILE) : null;

    res.json({
      status: 'ok',
      mode: 'local_file_system',
      filePath: DB_FILE,
      fileName: 'tasks-db.json',
      dataDirectory: DATA_DIR,
      fileSizeBytes: stats.size,
      fileSizeKb: Math.round((stats.size / 1024) * 10) / 10,
      lastModified: stats.mtime.toISOString(),
      taskCount: Array.isArray(content.tasks) ? content.tasks.length : 0,
      logsFilePath: LOGS_FILE,
      logsSizeBytes: logStats ? logStats.size : 0,
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: String(err) });
  }
});

// 2. Get tasks from local file
app.get('/api/tasks', (req, res) => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return res.json({ tasks: [] });
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : (Array.isArray(parsed) ? parsed : []);
    res.json({ tasks, lastModified: parsed.lastModified || new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read local database file', details: String(err) });
  }
});

// 3. Save tasks to local file (atomic write)
app.post('/api/tasks', (req, res) => {
  try {
    const { tasks } = req.body;
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Payload must contain a "tasks" array' });
    }

    const payload = {
      version: '1.0.0',
      lastModified: new Date().toISOString(),
      taskCount: tasks.length,
      tasks,
    };

    // Atomic write to avoid corruption
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);

    appendToLocalLog('info', 'DATABASE_FILE_SAVED', `Saved ${tasks.length} tasks directly to local disk: ${DB_FILE}`);

    res.json({
      success: true,
      savedAt: payload.lastModified,
      filePath: DB_FILE,
      count: tasks.length,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to write to local database file', details: String(err) });
  }
});

// 4. Logs endpoint
app.get('/api/logs', (req, res) => {
  try {
    if (!fs.existsSync(LOGS_FILE)) {
      return res.json({ logs: [] });
    }
    const raw = fs.readFileSync(LOGS_FILE, 'utf-8');
    const lines = raw.trim().split('\n').filter(Boolean).slice(-200).reverse();
    res.json({ logs: lines, logsPath: LOGS_FILE });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read logs file', details: String(err) });
  }
});

app.post('/api/logs', (req, res) => {
  try {
    const { level, action, details, metadata } = req.body;
    appendToLocalLog(level || 'info', action || 'CLIENT_EVENT', details || '', metadata);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to append log', details: String(err) });
  }
});

// 5. Download raw database file
app.get('/api/database/download', (req, res) => {
  try {
    if (fs.existsSync(DB_FILE)) {
      res.download(DB_FILE, 'tasks-db.json');
    } else {
      res.status(404).send('Database file not found');
    }
  } catch (err) {
    res.status(500).send(String(err));
  }
});

// ----------------------------------------------------
// VITE OR STATIC SERVING
// ----------------------------------------------------
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Local Task Manager running at http://localhost:${PORT}`);
    console.log(`Local Database file stored on machine at: ${DB_FILE}`);
  });
}

start();
