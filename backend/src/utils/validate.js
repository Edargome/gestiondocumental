const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const isEmail = (value) =>
  isNonEmptyString(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const minLength = (value, length) => isNonEmptyString(value) && value.trim().length >= length;

const isInt = (value) =>
  Number.isInteger(value) || (typeof value === 'string' && /^-?\d+$/.test(value));

module.exports = { isNonEmptyString, isEmail, minLength, isInt };
