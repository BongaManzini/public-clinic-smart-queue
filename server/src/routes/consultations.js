const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const store = require('../db/store');
const { authenticateToken } = require('../middleware/auth');

// Configure upload storage
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `scan-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

module.exports = function (io) {
  // GET /api/consultations/visit/:visitId
  router.get('/visit/:visitId', authenticateToken, async (req, res) => {
    try {
      const visit = await store.getVisitDetails(req.params.visitId);
      if (!visit) return res.status(404).json({ error: 'Visit not found' });
      res.json({ visit });
    } catch (err) {
      console.error('Error getting visit details:', err);
      res.status(500).json({ error: 'Failed to retrieve visit details' });
    }
  });

  // POST /api/consultations (save doctor consultation notes, canvas drawing, prescriptions)
  router.post('/', authenticateToken, async (req, res) => {
    try {
      const {
        visitId, subjectiveNotes, objectiveNotes, assessmentNotes,
        planNotes, icd10Code, diagnosisText, formTemplate,
        customTemplateData, canvasDrawingData, prescriptions
      } = req.body;

      if (!visitId) return res.status(400).json({ error: 'visitId is required' });

      const consultation = await store.saveConsultation({
        visit_id: visitId,
        doctor_id: req.user.id,
        subjective_notes: subjectiveNotes,
        objective_notes: objectiveNotes,
        assessment_notes: assessmentNotes,
        plan_notes: planNotes,
        icd10_code: icd10Code,
        diagnosis_text: diagnosisText,
        form_template: formTemplate || 'STANDARD_SOAP',
        custom_template_data: customTemplateData,
        canvas_drawing_data: canvasDrawingData,
        prescriptions
      });

      const updatedQueue = await store.getLiveQueue();
      io.emit('queue:updated', updatedQueue);
      io.emit('consultation:completed', { visitId, consultation });

      res.status(201).json({ message: 'Consultation record saved successfully', consultation });
    } catch (err) {
      console.error('Error saving consultation:', err);
      res.status(500).json({ error: 'Failed to save consultation record' });
    }
  });

  // POST /api/consultations/upload (upload physical paper file / scan)
  router.post('/upload', authenticateToken, upload.single('document'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { visitId, consultationId, ocrText } = req.body;
      const fileUrl = `/uploads/${req.file.filename}`;

      const attachment = await store.saveAttachment({
        visit_id: visitId || null,
        consultation_id: consultationId || null,
        file_name: req.file.originalname,
        file_type: req.file.mimetype,
        file_url: fileUrl,
        ocr_extracted_text: ocrText || ''
      });

      res.status(201).json({
        message: 'Physical document uploaded successfully',
        attachment,
        fileUrl
      });
    } catch (err) {
      console.error('Error uploading document:', err);
      res.status(500).json({ error: 'Failed to process document upload' });
    }
  });

  return router;
};
