import express from 'express';
import { createSession, saveSessionData, getSessionData, getSessions } from '../services/openaiService.js';

const router = express.Router();

// Create a new realtime session
router.post('/create', async (req, res) => {
  try {
    const { language } = req.body || {};
    const sessionData = await createSession(language);
    res.json(sessionData);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ 
      error: 'Failed to create session',
      message: error.message 
    });
  }
});

// Save conversation data
router.post('/save', async (req, res) => {
  try {
    const { sessionId, data } = req.body;
    await saveSessionData(sessionId, data);
    res.json({ success: true, message: 'Data saved successfully' });
  } catch (error) {
    console.error('Error saving session data:', error);
    res.status(500).json({ 
      error: 'Failed to save data',
      message: error.message 
    });
  }
});

// Get session data
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const data = await getSessionData(sessionId);
    res.json(data);
  } catch (error) {
    console.error('Error retrieving session data:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve data',
      message: error.message 
    });
  }
});

// Get session list
router.get('/list', async (req, res) => {
  try {
    const sessionList = await getSessions();
    res.json({
      success: true,
      sessionList: sessionList
    });
  } catch (error) {
    console.error('Error retrieving session list:', error);
    res.status(500).json({ error: 'Failed to retrieve session list', message: error.message });
  }
});

export default router;

