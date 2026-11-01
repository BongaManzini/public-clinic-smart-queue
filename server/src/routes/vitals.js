const express = require('express');
const router = express.Router();
const store = require('../db/store');
const { authenticateToken } = require('../middleware/auth');

module.exports = function (io) {
  // POST /api/vitals (nurse recording vitals & triage)
  router.post('/', authenticateToken, async (req, res) => {
    try {
      const {
        visitId, bloodPressureSys, bloodPressureDia, heartRate,
        respiratoryRate, temperature, bloodGlucose, weightKg,
        heightCm, satsTriageColor, triageNotes
      } = req.body;

      if (!visitId) {
        return res.status(400).json({ error: 'visitId is required' });
      }

      const vitals = await store.recordVitals({
        visit_id: visitId,
        recorded_by: req.user.id,
        blood_pressure_sys: bloodPressureSys ? parseInt(bloodPressureSys) : null,
        blood_pressure_dia: bloodPressureDia ? parseInt(bloodPressureDia) : null,
        heart_rate: heartRate ? parseInt(heartRate) : null,
        respiratory_rate: respiratoryRate ? parseInt(respiratoryRate) : null,
        temperature: temperature ? parseFloat(temperature) : null,
        blood_glucose: bloodGlucose ? parseFloat(bloodGlucose) : null,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        height_cm: heightCm ? parseFloat(heightCm) : null,
        sats_triage_color: satsTriageColor || 'GREEN',
        triage_notes: triageNotes
      });

      const updatedQueue = await store.getLiveQueue();
      io.emit('queue:updated', updatedQueue);
      io.emit('triage:vitals_updated', { visitId, vitals });

      res.status(201).json({ message: 'Vitals recorded successfully', vitals });
    } catch (err) {
      console.error('Error recording vitals:', err);
      res.status(500).json({ error: 'Failed to record vitals' });
    }
  });

  return router;
};
