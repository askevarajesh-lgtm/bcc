const MonitorBase = require('../MonitorBase');
const tls = require('tls');

class SSLMonitor extends MonitorBase {
  async collect(context) {
    const { project } = context;
    let host = project?.domain || 'example.com';
    host = host.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];

    return new Promise(resolve => {
      try {
        const socket = tls.connect(443, host, { servername: host, timeout: 5000 }, () => {
          const cert = socket.getPeerCertificate();
          socket.end();

          if (!cert || !cert.valid_to) {
            resolve({ valid: false, daysRemaining: 0, issuer: 'Unknown', error: 'No certificate' });
            return;
          }

          const validTo = new Date(cert.valid_to);
          const daysRemaining = Math.round((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

          resolve({
            valid: true,
            daysRemaining,
            validTo,
            issuer: cert.issuer?.O || cert.issuer?.CN || 'Unknown CA'
          });
        });

        socket.on('error', err => {
          resolve({ valid: false, daysRemaining: 0, error: err.message, issuer: 'Unknown' });
        });
      } catch (e) {
        resolve({ valid: false, daysRemaining: 0, error: e.message, issuer: 'Unknown' });
      }
    });
  }

  async normalize(rawData) {
    return {
      isValid: rawData.valid,
      daysRemaining: rawData.daysRemaining,
      validTo: rawData.validTo,
      issuer: rawData.issuer,
      status: !rawData.valid ? 'Invalid' : rawData.daysRemaining < 14 ? 'Expiring Soon' : 'Valid'
    };
  }

  async analyze(normalizedData) {
    const isExpiring = normalizedData.isValid && normalizedData.daysRemaining <= 14;
    const isInvalid = !normalizedData.isValid;
    return { isExpiring, isInvalid, daysRemaining: normalizedData.daysRemaining };
  }

  async generateEvents(analysis, context) {
    const events = [];
    if (analysis.isInvalid) {
      events.push({
        source: this.name,
        projectId: context.projectId,
        eventType: 'SSLInvalid',
        payload: { severity: 'Critical', details: 'SSL Certificate is invalid or self-signed!' }
      });
    } else if (analysis.isExpiring) {
      events.push({
        source: this.name,
        projectId: context.projectId,
        eventType: 'SSLExpiryWarning',
        payload: { severity: 'High', daysRemaining: analysis.daysRemaining, details: `SSL Certificate expires in ${analysis.daysRemaining} days.` }
      });
    }
    return events;
  }

  async generateHealthImpact(analysis) {
    if (analysis.isInvalid) return { security: -40 };
    if (analysis.isExpiring) return { security: -15 };
    return { security: 10 };
  }
}

module.exports = SSLMonitor;
