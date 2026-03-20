import cors from 'cors';

const staticOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
];

function isAllowedOrigin(origin: string): boolean {
  if (staticOrigins.includes(origin)) return true;
  // Allow any Vercel deployment for this project
  if (origin.endsWith('.vercel.app')) return true;
  // Allow custom FRONTEND_URL set in Railway env
  const configured = process.env.FRONTEND_URL;
  if (configured && origin === configured) return true;
  return false;
}

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] blocked: ${origin}`);
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
});
