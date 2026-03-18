import { Router } from 'express';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

/**
 * POST /api/transcribe
 * Body: { audio_base64: string }  (m4a audio encoded as base64)
 * Returns: { text: string }
 *
 * Requires OPENAI_API_KEY in .env for Whisper transcription.
 */
router.post('/', async (req, res, next) => {
  try {
    const { audio_base64 } = req.body as { audio_base64?: string };

    if (!audio_base64) {
      return res.status(400).json({ error: 'audio_base64 is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: 'Transcription not configured. Add OPENAI_API_KEY to .env' });
    }

    const buffer = Buffer.from(audio_base64, 'base64');
    const blob = new Blob([buffer], { type: 'audio/m4a' });

    const form = new FormData();
    form.append('file', blob, 'recording.m4a');
    form.append('model', 'whisper-1');
    form.append('language', 'en');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Transcribe] Whisper error:', errText);
      return res.status(502).json({ error: 'Transcription failed' });
    }

    const data = (await response.json()) as { text: string };
    return res.json({ text: data.text });
  } catch (err) {
    next(err);
  }
});

export default router;
