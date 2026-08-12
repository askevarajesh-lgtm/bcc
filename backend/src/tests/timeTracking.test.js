const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const proxyquire = require('proxyquire');

const expect = chai.expect;

// Create mocks for the models
const mockTimeEntry = {
  aggregate: sinon.stub(),
  find: sinon.stub(),
  exists: sinon.stub(),
  prototype: {
    save: sinon.stub()
  }
};
// Make TimeEntry constructable
function TimeEntryMock(data) {
  Object.assign(this, data);
}
TimeEntryMock.prototype.save = mockTimeEntry.prototype.save;
Object.assign(TimeEntryMock, mockTimeEntry);

const mockTask = {
  aggregate: sinon.stub(),
  find: sinon.stub(),
  findByIdAndUpdate: sinon.stub(),
  exists: sinon.stub()
};

const mockUser = {
  find: sinon.stub().returns({ select: sinon.stub().resolves([]) }),
  exists: sinon.stub()
};

const timeTrackingController = proxyquire('../modules/timeTracking/timeTracking.controller', {
  './timeTracking.model': TimeEntryMock,
  '../auth/user.model': mockUser,
  '../tasks/task.model': mockTask,
  'mongoose': mongoose
});

describe('Time Tracking Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      companyId: '60d0fe4f5311236168a10000',
      user: {
        _id: '60d0fe4f5311236168a20000',
        role: 'user'
      },
      body: {}
    };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };

    mockTimeEntry.aggregate.resetHistory();
    mockTimeEntry.find.resetHistory();
    mockTimeEntry.exists.resetHistory();
    mockTimeEntry.prototype.save.resetHistory();
    mockTask.aggregate.resetHistory();
    mockTask.find.resetHistory();
    mockTask.findByIdAndUpdate.resetHistory();
    mockTask.exists.resetHistory();
    mockUser.find.resetHistory();
    mockUser.exists.resetHistory();
  });

  describe('logTime', () => {
    it('should reject when companyId is missing', async () => {
      req.companyId = null;
      await timeTrackingController.logTime(req, res);
      expect(res.status.calledWith(401)).to.be.true;
    });

    it('should reject when hours is 0 or negative', async () => {
      req.body.hours = 0;
      await timeTrackingController.logTime(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      
      req.body.hours = -2;
      await timeTrackingController.logTime(req, res);
      expect(res.status.calledWith(400)).to.be.true;
    });

    it('should reject when employee belongs to another tenant', async () => {
      req.body = { hours: 5, employee: 'emp1' };
      mockUser.exists.resolves(false);
      await timeTrackingController.logTime(req, res);
      expect(res.status.calledWith(403)).to.be.true;
    });
  });

  describe('getDashboardData', () => {
    it('should NOT double count task hours in KPIs and calculate correct billable', async () => {
      // Mock TimeEntry.aggregate for KPIs
      mockTimeEntry.aggregate.onFirstCall().resolves([{
        _id: null,
        totalHours: 5,
        billableHours: 3,
        nonBillableHours: 2
      }]);
      // Mock Task.find for active timers
      mockTask.find.resolves([]);
      // Mock User.find and TimeEntry.find for missing timesheets
      mockUser.find.returns({ select: sinon.stub().resolves([]) });
      mockTimeEntry.find.returns({ distinct: sinon.stub().resolves([]) });
      
      // Mock aggregations for timesheets and clients
      mockTimeEntry.aggregate.onSecondCall().resolves([]); // timesheetAgg
      mockTimeEntry.aggregate.onThirdCall().resolves([]); // clientAgg

      await timeTrackingController.getDashboardData(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      const kpis = res.json.firstCall.args[0].kpis;
      
      // Verification
      expect(kpis.totalHours).to.equal(5);
      expect(kpis.billableHours).to.equal(3);
      expect(kpis.nonBillableHours).to.equal(2);
      // No capacity
      expect(kpis.capacity).to.be.null;
      expect(kpis.capacityRemaining).to.be.null;
    });
  });
});
