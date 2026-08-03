const secretVault = require('../services/secretVault.service');

class SecretVaultController {
  async list(req, res) {
    try {
      const { projectId } = req.params;
      const result = await secretVault.listCredentials(projectId, req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async store(req, res) {
    try {
      const { projectId } = req.params;
      const data = {
        ...req.body,
        userId: req.user?._id,
        reqIp: req.ip
      };
      const saved = await secretVault.storeCredential(projectId, data);
      res.json({ success: true, credential: saved });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const { projectId, credentialId } = req.params;
      const result = await secretVault.deleteCredential(projectId, credentialId, req.user?._id, req.ip);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async verify(req, res) {
    try {
      const { projectId, credentialId } = req.params;
      const result = await secretVault.verifyCredential(projectId, credentialId);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = new SecretVaultController();
