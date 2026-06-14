import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import apiRouter from './routes/api.js';

// Resolve directory names in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// 1. Security Middlewares
// Enable Helmet to set security headers (CSP, HSTS, XSS protection, Frameguard, etc.)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline allows our local, fast inline JS routines if needed
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"]
      }
    }
  })
);

// Enable rate limiter (150 requests per 15 minutes per IP to mitigate Denial-of-Service)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
});

// Apply rate limiter to API endpoints only
app.use('/api', limiter);

// 2. Parsers & Static Files
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static assets from public folder
app.use(express.static(path.join(__dirname, 'public')));

// 3. API Routes
app.use('/api', apiRouter);

// 4. SPA Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 5. Global Error Handling
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]:', err.stack);
  res.status(500).json({
    success: false,
    message: 'An internal server error occurred.'
  });
});

// Start listening
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server]: Carbon Footprint Tracker is running on port ${PORT}`);
});

export default server;
