const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

describe('SEO Auditor Agent', () => {
  let runAudit;
  let findByIdStub, findOneStub, createJobStub, createQueueStub;
  let loggerStub;

  beforeEach(() => {
    findByIdStub = sinon.stub();
    findOneStub = sinon.stub();
    createJobStub = sinon.stub();
    createQueueStub = sinon.stub();
    loggerStub = { info: sinon.stub(), error: sinon.stub(), logExecution: sinon.stub() };

    const auditorAgent = proxyquire('../../src/modules/seoWorkspace/services/seoAuditorAgent.service', {
      '../models/workspaceProject.model': { findById: findByIdStub },
      '../models/workspaceAuditJob.model': { findOne: findOneStub, create: createJobStub },
      '../models/workspaceAuditQueue.model': { create: createQueueStub },
      '../../aiCore/logger.service': loggerStub,
      './enterpriseCrawl.worker.js': { isRunning: true, start: sinon.stub() },
      '../../aiCore/sharedMemory.service': {},
      '../../aiCore/agentLoader.service': {},
      '../../aiCore/executionQueue.service': {},
      '../../aiCore/retry.service': {},
      '../../aiCore/aiEngine.service': {}
    });

    runAudit = auditorAgent.run;
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should successfully start an audit and return a jobId', async () => {
    findByIdStub.resolves({ _id: 'proj1', domain: 'example.com', createdBy: 'user1' });
    findOneStub.resolves(null); // No existing job
    createJobStub.resolves({ _id: 'job1' });
    createQueueStub.resolves();

    const result = await runAudit('proj1', 'user1', { profile: 'quick' });

    expect(result).to.deep.equal({ status: 'queued', jobId: 'job1' });
    expect(createJobStub.calledOnce).to.be.true;
    expect(createQueueStub.calledOnce).to.be.true;
    expect(loggerStub.logExecution.calledOnce).to.be.true;
  });

  it('should fail gracefully and log a structured error if project domain is missing', async () => {
    findByIdStub.resolves({ _id: 'proj1', createdBy: 'user1' }); // missing domain

    try {
      await runAudit('proj1', 'user1', { profile: 'quick' });
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.equal('Project domain is not configured');
      expect(loggerStub.error.calledWithMatch(sinon.match.any, sinon.match(/Audit Start Failed/))).to.be.true;
    }
  });

  it('should fail if queue insertion fails', async () => {
    findByIdStub.resolves({ _id: 'proj1', domain: 'example.com', createdBy: 'user1' });
    findOneStub.resolves(null);
    createJobStub.resolves({ _id: 'job1' });
    createQueueStub.rejects(new Error('Queue Error'));

    try {
      await runAudit('proj1', 'user1', { profile: 'quick' });
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.equal('Queue Error');
      expect(loggerStub.error.calledWithMatch(sinon.match.any, sinon.match(/Queue Error/))).to.be.true;
    }
  });
});
