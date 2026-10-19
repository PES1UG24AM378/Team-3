const { AppError } = require('./error');

/**
 * Validates request body, query, or params against schema rules
 * @param {Object} schema - e.g. { body: { field: { required: true, type: 'string' } } }
 */
function validate(schema) {
  return (req, res, next) => {
    const errors = [];

    for (const [location, fields] of Object.entries(schema)) {
      const source = req[location] || {};

      for (const [field, rules] of Object.entries(fields)) {
        const val = source[field];

        if (rules.required && (val === undefined || val === null || val === '')) {
          errors.push({ field: `${location}.${field}`, message: `${field} is required` });
          continue;
        }

        if (val !== undefined && val !== null) {
          if (rules.type === 'number' && isNaN(Number(val))) {
            errors.push({ field: `${location}.${field}`, message: `${field} must be a number` });
          } else if (rules.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val))) {
            errors.push({ field: `${location}.${field}`, message: `${field} must be a valid email` });
          } else if (rules.type === 'isoDate') {
            const date = new Date(val);
            if (isNaN(date.getTime())) {
              errors.push({ field: `${location}.${field}`, message: `${field} must be a valid ISO 8601 UTC timestamp` });
            }
          } else if (rules.min !== undefined && Number(val) < rules.min) {
            errors.push({ field: `${location}.${field}`, message: `${field} must be at least ${rules.min}` });
          } else if (rules.max !== undefined && Number(val) > rules.max) {
            errors.push({ field: `${location}.${field}`, message: `${field} must be at most ${rules.max}` });
          }
        }
      }
    }

    if (errors.length > 0) {
      return next(new AppError('Validation failed', 422, 'VALIDATION_ERROR', errors));
    }

    next();
  };
}

module.exports = {
  validate
};
