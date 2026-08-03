module.exports = {
  id: 'action_json_parser',
  
  metadata: () => ({
    id: 'action_json_parser',
    name: 'JSON Parser & Mapper',
    description: 'Parses JSON strings, navigates nested paths, filters arrays, or serializes objects',
    category: 'logic',
    icon: 'code',
    inputs: ['mode', 'data', 'jsonPath'],
    outputs: ['parsed', 'extractedValue', 'serialized']
  }),

  validate: () => true,

  execute: async (config) => {
    const { mode = 'parse', data, jsonPath } = config;
    let parsed = null;
    let serialized = null;
    let extractedValue = null;

    if (mode === 'parse') {
      try {
        parsed = typeof data === 'string' ? JSON.parse(data) : data;
      } catch (e) {
        throw new Error(`Invalid JSON string: ${e.message}`);
      }
    } else if (mode === 'stringify') {
      serialized = JSON.stringify(data, null, 2);
      parsed = data;
    }

    if (jsonPath && parsed) {
      // Navigate dot path like "a.b.c[0]"
      const keys = jsonPath.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '').split('.');
      let current = parsed;
      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          current = undefined;
          break;
        }
      }
      extractedValue = current;
    } else {
      extractedValue = parsed;
    }

    return {
      success: true,
      parsed,
      serialized,
      extractedValue
    };
  }
};
