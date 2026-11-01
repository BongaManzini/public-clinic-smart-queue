const express = require('express');
const router = express.Router();
const store = require('../db/store');
const { authenticateToken } = require('../middleware/auth');

// GET /api/patients (search by name, SA ID, file number)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;
    const patients = await store.searchPatients(search);
    res.json({ patients });
  } catch (err) {
    console.error('Error fetching patients:', err);
    res.status(500).json({ error: 'Failed to search patients' });
  }
});

// GET /api/patients/:id (full details including visit history)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const patient = await store.getPatientById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json({ patient });
  } catch (err) {
    console.error('Error getting patient:', err);
    res.status(500).json({ error: 'Failed to retrieve patient' });
  }
});

// POST /api/patients (create new patient file)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      firstName, lastName, nationalId, dateOfBirth, gender,
      phoneNumber, residentialAddress, emergencyContactName,
      emergencyContactPhone, knownAllergies, chronicConditions, fileNumber
    } = req.body;

    if (!firstName || !lastName || !dateOfBirth || !gender) {
      return res.status(400).json({ error: 'First name, last name, date of birth, and gender are required' });
    }

    const created = await store.createPatient({
      file_number: fileNumber,
      national_id: nationalId,
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth,
      gender,
      phone_number: phoneNumber,
      residential_address: residentialAddress,
      emergency_contact_name: emergencyContactName,
      emergency_contact_phone: emergencyContactPhone,
      known_allergies: knownAllergies,
      chronic_conditions: chronicConditions
    });

    res.status(201).json({ patient: created });
  } catch (err) {
    console.error('Error creating patient:', err);
    res.status(500).json({ error: 'Failed to create patient record' });
  }
});

// PUT /api/patients/:id (update patient info)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const {
      firstName, lastName, nationalId, dateOfBirth, gender,
      phoneNumber, residentialAddress, emergencyContactName,
      emergencyContactPhone, knownAllergies, chronicConditions
    } = req.body;

    const updated = await store.updatePatient(req.params.id, {
      national_id: nationalId,
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth,
      gender,
      phone_number: phoneNumber,
      residential_address: residentialAddress,
      emergency_contact_name: emergencyContactName,
      emergency_contact_phone: emergencyContactPhone,
      known_allergies: knownAllergies,
      chronic_conditions: chronicConditions
    });

    if (!updated) return res.status(404).json({ error: 'Patient not found' });
    res.json({ patient: updated });
  } catch (err) {
    console.error('Error updating patient:', err);
    res.status(500).json({ error: 'Failed to update patient record' });
  }
});

module.exports = router;
