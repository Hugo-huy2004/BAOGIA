import express from 'express';
import crypto from 'crypto';
import IoTDevice from '../models/IoTDevice.js';

const router = express.Router();

// Helper: generate a secure random API token
function generateApiToken() {
  return crypto.randomBytes(32).toString('hex');
}

// POST /api/iot/devices — register a new IoT device (auth: member email in body)
router.post('/devices', async (req, res) => {
  try {
    const { email, deviceName, deviceType } = req.body;
    if (!email || !deviceName || !deviceType) {
      return res.status(400).json({ error: 'email, deviceName, and deviceType are required' });
    }

    const allowedTypes = ['wearable', 'health_monitor', 'smart_scale', 'blood_pressure'];
    if (!allowedTypes.includes(deviceType)) {
      return res.status(400).json({ error: `deviceType must be one of: ${allowedTypes.join(', ')}` });
    }

    const deviceId = crypto.randomBytes(12).toString('hex');
    const apiToken = generateApiToken();

    const device = await IoTDevice.create({
      email,
      deviceId,
      deviceName,
      deviceType,
      isActive: true,
      lastSeen: null,
      apiToken,
      vitals: []
    });

    res.status(201).json({
      success: true,
      device: {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        isActive: device.isActive,
        apiToken: device.apiToken,
        createdAt: device.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/iot/devices — list all devices for a user (auth: email query param)
router.get('/devices', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'email query parameter is required' });
    }

    const devices = await IoTDevice.find(
      { email },
      { apiToken: 0, vitals: 0 } // exclude sensitive fields from list
    ).lean();

    res.json({ success: true, devices });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/iot/vitals — receive vitals from a device (auth: X-Device-Token header)
router.post('/vitals', async (req, res) => {
  try {
    const apiToken = req.headers['x-device-token'];
    if (!apiToken) {
      return res.status(401).json({ error: 'X-Device-Token header is required' });
    }

    const device = await IoTDevice.findOne({ apiToken, isActive: true });
    if (!device) {
      return res.status(403).json({ error: 'Invalid or inactive device token' });
    }

    const {
      heartRate,
      steps,
      sleepMinutes,
      bloodPressureSys,
      bloodPressureDia,
      weight,
      temperature,
      oxygenSat,
      notes,
      timestamp
    } = req.body;

    const vitalEntry = {
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      heartRate,
      steps,
      sleepMinutes,
      bloodPressureSys,
      bloodPressureDia,
      weight,
      temperature,
      oxygenSat,
      notes: notes || ''
    };

    // Keep max 1000 vitals entries using $push + $slice
    await IoTDevice.findByIdAndUpdate(device._id, {
      $set: { lastSeen: new Date() },
      $push: {
        vitals: {
          $each: [vitalEntry],
          $slice: -1000 // keep the latest 1000 entries
        }
      }
    });

    // Broadcast to WebSocket clients with same email if WS server is available
    if (global.wsClients && global.wsClients[device.email]) {
      const payload = JSON.stringify({
        type: 'vitals',
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        data: vitalEntry
      });
      for (const ws of global.wsClients[device.email]) {
        if (ws.readyState === 1 /* OPEN */) {
          ws.send(payload);
        }
      }
    }

    res.json({ success: true, message: 'Vitals recorded' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/iot/vitals — get recent vitals for the dashboard (auth: email + deviceId query params)
router.get('/vitals', async (req, res) => {
  try {
    const { email, deviceId, limit = 100 } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'email query parameter is required' });
    }

    const query = { email };
    if (deviceId) query.deviceId = deviceId;

    const devices = await IoTDevice.find(query, {
      deviceId: 1,
      deviceName: 1,
      deviceType: 1,
      lastSeen: 1,
      vitals: { $slice: -Math.min(Number(limit), 1000) }
    }).lean();

    res.json({ success: true, devices });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/iot/devices/:deviceId — deregister a device
router.delete('/devices/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'email is required in request body' });
    }

    const result = await IoTDevice.findOneAndDelete({ deviceId, email });
    if (!result) {
      return res.status(404).json({ error: 'Device not found or does not belong to this account' });
    }

    res.json({ success: true, message: 'Device deregistered' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
