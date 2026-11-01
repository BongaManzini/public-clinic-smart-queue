const express = require('express');
const router = express.Router();
const store = require('../db/store');
const { authenticateToken } = require('../middleware/auth');

module.exports = function (io) {
  // GET /api/queue (live queue)
  router.get('/', async (req, res) => {
    try {
      const queue = await store.getLiveQueue();
      res.json({ queue });
    } catch (err) {
      console.error('Error fetching queue:', err);
      res.status(500).json({ error: 'Failed to retrieve queue' });
    }
  });

  // POST /api/queue/ticket (generate ticket)
  router.post('/ticket', async (req, res) => {
    try {
      const { patientId, visitType, serviceStream, priorityLevel } = req.body;

      if (!patientId || !serviceStream) {
        return res.status(400).json({ error: 'patientId and serviceStream are required' });
      }

      const result = await store.createQueueTicket({
        patientId,
        visitType: visitType || serviceStream,
        serviceStream,
        priorityLevel: priorityLevel || 'NORMAL'
      });

      const updatedQueue = await store.getLiveQueue();
      io.emit('queue:updated', updatedQueue);

      res.status(201).json(result);
    } catch (err) {
      console.error('Error generating ticket:', err);
      res.status(500).json({ error: 'Failed to generate queue ticket' });
    }
  });

  // POST /api/queue/call (staff calling a patient to consultation/triage)
  router.post('/call', authenticateToken, async (req, res) => {
    try {
      const { ticketId, roomNumber } = req.body;
      if (!ticketId) return res.status(400).json({ error: 'ticketId is required' });

      const ticket = await store.callNextTicket({
        ticketId,
        staffUserId: req.user.id,
        roomNumber: roomNumber || 'Consultation Room 1'
      });

      if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

      const updatedQueue = await store.getLiveQueue();
      io.emit('queue:updated', updatedQueue);
      io.emit('queue:ticket_called', {
        ticket,
        calledBy: req.user.fullName,
        roomNumber: roomNumber || 'Consultation Room 1'
      });

      res.json({ message: 'Patient called successfully', ticket });
    } catch (err) {
      console.error('Error calling ticket:', err);
      res.status(500).json({ error: 'Failed to call ticket' });
    }
  });

  // POST /api/queue/complete (completing a ticket/visit)
  router.post('/complete', authenticateToken, async (req, res) => {
    try {
      const { ticketId } = req.body;
      if (!ticketId) return res.status(400).json({ error: 'ticketId is required' });

      const ticket = await store.completeTicket(ticketId);
      if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

      const updatedQueue = await store.getLiveQueue();
      io.emit('queue:updated', updatedQueue);

      res.json({ message: 'Ticket marked as completed', ticket });
    } catch (err) {
      console.error('Error completing ticket:', err);
      res.status(500).json({ error: 'Failed to complete ticket' });
    }
  });

  return router;
};
