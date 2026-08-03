/**
 * BaseTenantRepository
 * Ensures multi-tenant isolation by automatically appending workspaceId, projectId, and organizationId to queries.
 */
class BaseTenantRepository {
  /**
   * @param {Object} model - The Mongoose model
   */
  constructor(model) {
    this.model = model;
  }

  /**
   * Scopes the query to the tenant automatically.
   * @param {Object} tenantContext { workspaceId, projectId, organizationId }
   * @param {Object} query 
   */
  _applyTenantScope(tenantContext, query = {}) {
    const scopedQuery = { ...query };
    if (tenantContext.workspaceId) scopedQuery.workspaceId = tenantContext.workspaceId;
    if (tenantContext.projectId) scopedQuery.projectId = tenantContext.projectId;
    if (tenantContext.organizationId) scopedQuery.organizationId = tenantContext.organizationId;
    return scopedQuery;
  }

  async findOne(tenantContext, query = {}, options = {}) {
    return this.model.findOne(this._applyTenantScope(tenantContext, query), null, options);
  }

  async find(tenantContext, query = {}, options = {}) {
    return this.model.find(this._applyTenantScope(tenantContext, query), null, options);
  }

  async create(tenantContext, data) {
    const payload = {
      ...data,
      workspaceId: tenantContext.workspaceId,
      projectId: tenantContext.projectId,
      organizationId: tenantContext.organizationId
    };
    return this.model.create(payload);
  }

  async updateOne(tenantContext, query, update, options = {}) {
    return this.model.updateOne(this._applyTenantScope(tenantContext, query), update, options);
  }

  async deleteOne(tenantContext, query) {
    return this.model.deleteOne(this._applyTenantScope(tenantContext, query));
  }

  async count(tenantContext, query = {}) {
    return this.model.countDocuments(this._applyTenantScope(tenantContext, query));
  }
}

module.exports = BaseTenantRepository;
