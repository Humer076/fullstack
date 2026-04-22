import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ==================== MIDDLEWARE ====================

// ✅ DYNAMIC CORS (supports localhost and Vercel deployments)
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    // Allow any localhost port
    // Allow any vercel.app domain
    if (!origin || origin.startsWith('http://localhost') || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-clerk-user', 'x-role'],
};

app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ==================== ROUTES ====================
app.use('/api', routes);

// ✅ Health check
app.get('/health', (req, res) => {
  return res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// ✅ Root route (so you don't get a 404 when visiting the base URL)
app.get('/', (req, res) => {
  return res.json({
    message: 'SkillBridge Backend is Live! 🚀',
    docs: 'Append /api to this URL for API routes',
    timestamp: new Date().toISOString(),
  });
});

// ==================== ERROR HANDLING ====================
app.use(notFoundHandler);
app.use(errorHandler);

// ==================== SERVER START ====================
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  SkillBridge Backend Server             ║
║  Running on port ${PORT}                    ║
║  Environment: ${process.env.NODE_ENV || 'development'}        ║
╚════════════════════════════════════════╝
  `);
});

export default app;