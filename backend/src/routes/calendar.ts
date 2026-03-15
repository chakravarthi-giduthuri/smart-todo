import { Router } from 'express';

const router = Router();

// Scaffold for future Google Calendar OAuth integration
router.get('/auth-url', (req, res) => {
  res.json({
    message: 'Google Calendar integration is not yet configured. OAuth setup is required.',
    auth_url: null,
  });
});

router.get('/status', (req, res) => {
  res.json({ connected: false });
});

export default router;
