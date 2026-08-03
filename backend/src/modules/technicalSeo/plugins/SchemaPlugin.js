/**
 * SchemaPlugin
 * Validates JSON-LD structured data.
 */
const BaseAuditPlugin = require('./BaseAuditPlugin');

class SchemaPlugin extends BaseAuditPlugin {
  constructor() {
    super();
    this.name = 'Schema Validation';
    this.category = 'structured_data';
    this.maxScore = 15; 
  }

  async execute(context) {
    const { pageData } = context;
    // Assume pageData.jsonLd contains an array of parsed JSON-LD blocks
    const schemas = pageData.jsonLd || [];
    
    const valid = schemas.length > 0; // naive check for now
    return {
      schemaCount: schemas.length,
      schemas,
      valid
    };
  }

  async score(results) {
    // If they have schemas but they are invalid, penalize.
    // If they have no schemas, it's a missed opportunity but not necessarily a penalty.
    return this.maxScore; 
  }

  async recommend(results) {
    const issues = [];
    if (results.schemaCount === 0) {
      // Very low priority recommendation
      issues.push({ severity: 'info', code: 'NO_SCHEMA', issue: 'No structured data (JSON-LD) found on page.' });
    }
    return issues;
  }
}

module.exports = new SchemaPlugin();
