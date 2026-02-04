/**
 * Enhanced Validation Utility Library
 * Comprehensive validation utilities for both frontend and backend
 */

/**
 * Common validation patterns
 */
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/(?:[-\w.])+(?:[:\d]+)?(?:\/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)?$/,
  UUID_V4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  UUID_ANY: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  PHONE: /^\+?[1-9]\d{1,14}$/, // E.164 format
  IP_V4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  IP_V6: /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  ALPHANUMERIC_WITH_SPACES: /^[a-zA-Z0-9\s]+$/,
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  PASSWORD_MEDIUM: /^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/,
  CREDIT_CARD: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$/,
  SSN: /^(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}$/,
  US_ZIP_CODE: /^\d{5}(?:-\d{4})?$/,
  CANADIAN_POSTAL_CODE: /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/,
  UK_POSTCODE: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/,
} as const;

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  value?: any;
}

/**
 * Base validator class
 */
export abstract class BaseValidator<T> {
  protected value: T;
  protected errors: string[] = [];
  protected warnings: string[] = [];

  constructor(value: T) {
    this.value = value;
  }

  /**
   * Run validation and return result
   */
  abstract validate(): ValidationResult;

  /**
   * Add error message
   */
  protected addError(message: string): this {
    this.errors.push(message);
    return this;
  }

  /**
   * Add warning message
   */
  protected addWarning(message: string): this {
    this.warnings.push(message);
    return this;
  }

  /**
   * Check if validation passed
   */
  protected isValid(): boolean {
    return this.errors.length === 0;
  }
}

/**
 * String validator
 */
export class StringValidator extends BaseValidator<string> {
  validate(): ValidationResult {
    return {
      isValid: this.isValid(),
      errors: this.errors,
      warnings: this.warnings,
      value: this.value,
    };
  }

  /**
   * Check if string is not empty
   */
  required(message: string = 'Value is required'): this {
    if (this.value == null || this.value.trim() === '') {
      this.addError(message);
    }
    return this;
  }

  /**
   * Check string length
   */
  length(min: number, max?: number, message?: string): this {
    const length = this.value.length;
    if (length < min) {
      this.addError(message || `String must be at least ${min} characters long`);
    }
    if (max !== undefined && length > max) {
      this.addError(message || `String must be no more than ${max} characters long`);
    }
    return this;
  }

  /**
   * Check string matches pattern
   */
  pattern(pattern: RegExp, message: string = 'Invalid format'): this {
    if (!pattern.test(this.value)) {
      this.addError(message);
    }
    return this;
  }

  /**
   * Check if string is email
   */
  email(message: string = 'Invalid email format'): this {
    return this.pattern(VALIDATION_PATTERNS.EMAIL, message);
  }

  /**
   * Check if string is URL
   */
  url(message: string = 'Invalid URL format'): this {
    return this.pattern(VALIDATION_PATTERNS.URL, message);
  }

  /**
   * Check if string is UUID
   */
  uuid(version: 'v4' | 'any' = 'any', message: string = 'Invalid UUID format'): this {
    const pattern = version === 'v4' ? VALIDATION_PATTERNS.UUID_V4 : VALIDATION_PATTERNS.UUID_ANY;
    return this.pattern(pattern, message);
  }

  /**
   * Check if string is phone number
   */
  phone(message: string = 'Invalid phone number format'): this {
    return this.pattern(VALIDATION_PATTERNS.PHONE, message);
  }

  /**
   * Check if string is hex color
   */
  hexColor(message: string = 'Invalid hex color format'): this {
    return this.pattern(VALIDATION_PATTERNS.HEX_COLOR, message);
  }

  /**
   * Check if string is slug
   */
  slug(message: string = 'Invalid slug format'): this {
    return this.pattern(VALIDATION_PATTERNS.SLUG, message);
  }

  /**
   * Check if string is alphanumeric
   */
  alphanumeric(message: string = 'Only alphanumeric characters allowed'): this {
    return this.pattern(VALIDATION_PATTERNS.ALPHANUMERIC, message);
  }

  /**
   * Check if string matches password strength
   */
  password(strength: 'strong' | 'medium' = 'medium', message?: string): this {
    const pattern = strength === 'strong' 
      ? VALIDATION_PATTERNS.PASSWORD_STRONG 
      : VALIDATION_PATTERNS.PASSWORD_MEDIUM;
    return this.pattern(pattern, message || `Password does not meet ${strength} requirements`);
  }

  /**
   * Check if string contains substring
   */
  contains(substring: string, message: string = `String must contain "${substring}"`): this {
    if (!this.value.includes(substring)) {
      this.addError(message);
    }
    return this;
  }

  /**
   * Check if string starts with prefix
   */
  startsWith(prefix: string, message: string = `String must start with "${prefix}"`): this {
    if (!this.value.startsWith(prefix)) {
      this.addError(message);
    }
    return this;
  }

  /**
   * Check if string ends with suffix
   */
  endsWith(suffix: string, message: string = `String must end with "${suffix}"`): this {
    if (!this.value.endsWith(suffix)) {
      this.addError(message);
    }
    return this;
  }

  /**
   * Check if string is in allowed values
   */
  in(values: string[], message: string = `Value must be one of: ${values.join(', ')}`): this {
    if (!values.includes(this.value)) {
      this.addError(message);
    }
    return this;
  }
}

/**
 * Number validator
 */
export class NumberValidator extends BaseValidator<number> {
  validate(): ValidationResult {
    return {
      isValid: this.isValid(),
      errors: this.errors,
      warnings: this.warnings,
      value: this.value,
    };
  }

  /**
   * Check if number is required (not NaN, null, or undefined)
   */
  required(message: string = 'Number is required'): this {
    if (this.value == null || isNaN(this.value)) {
      this.addError(message);
    }
    return this;
  }

  /**
   * Check number range
   */
  range(min: number, max: number, message?: string): this {
    if (this.value < min || this.value > max) {
      this.addError(message || `Number must be between ${min} and ${max}`);
    }
    return this;
  }

  /**
   * Check minimum value
   */
  min(min: number, message?: string): this {
    if (this.value < min) {
      this.addError(message || `Number must be at least ${min}`);
    }
    return this;
  }

  /**
   * Check maximum value
   */
  max(max: number, message?: string): this {
    if (this.value > max) {
      this.addError(message || `Number must be at most ${max}`);
    }
    return this;
  }

  /**
   * Check if number is positive
   */
  positive(message: string = 'Number must be positive'): this {
    if (this.value <= 0) {
      this.addError(message);
    }
    return this;
  }

  /**
   * Check if number is negative
   */
  negative(message: string = 'Number must be negative'): this {
    if (this.value >= 0) {
      this.addError(message);
    }
    return this;
  }

  /**
   * Check if number is integer
   */
  integer(message: string = 'Number must be an integer'): this {
    if (!Number.isInteger(this.value)) {
      this.addError(message);
    }
    return this;
  }

  /**
   * Check if number is finite
   */
  finite(message: string = 'Number must be finite'): this {
    if (!Number.isFinite(this.value)) {
      this.addError(message);
    }
    return this;
  }

  /**
   * Check if number is safe integer
   */
  safeInteger(message: string = 'Number must be a safe integer'): this {
    if (!Number.isSafeInteger(this.value)) {
      this.addError(message);
    }
    return this;
  }
}

/**
 * Array validator
 */
export class ArrayValidator<T> extends BaseValidator<T[]> {
  validate(): ValidationResult {
    return {
      isValid: this.isValid(),
      errors: this.errors,
      warnings: this.warnings,
      value: this.value,
    };
  }

  /**
   * Check if array is required (not null or undefined)
   */
  required(message: string = 'Array is required'): this {
    if (this.value == null) {
      this.addError(message);
    }
    return this;
  }

  /**
   * Check array length
   */
  length(min: number, max?: number, message?: string): this {
    const length = this.value.length;
    if (length < min) {
      this.addError(message || `Array must have at least ${min} items`);
    }
    if (max !== undefined && length > max) {
      this.addError(message || `Array must have no more than ${max} items`);
    }
    return this;
  }

  /**
   * Check if array has minimum length
   */
  minLength(min: number, message?: string): this {
    if (this.value.length < min) {
      this.addError(message || `Array must have at least ${min} items`);
    }
    return this;
  }

  /**
   * Check if array has maximum length
   */
  maxLength(max: number, message?: string): this {
    if (this.value.length > max) {
      this.addError(message || `Array must have no more than ${max} items`);
    }
    return this;
  }

  /**
   * Check if array is unique
   */
  unique(message: string = 'Array items must be unique'): this {
    const seen = new Set();
    for (const item of this.value) {
      if (seen.has(item)) {
        this.addError(message);
        break;
      }
      seen.add(item);
    }
    return this;
  }

  /**
   * Check if array contains item
   */
  contains(item: T, message: string = `Array must contain ${item}`): this {
    if (!this.value.includes(item)) {
      this.addError(message);
    }
    return this;
  }

  /**
   * Validate each item in array
   */
  each(validatorFn: (item: T, index: number) => ValidationResult, messagePrefix: string = 'Item'): this {
    for (let i = 0; i < this.value.length; i++) {
      const result = validatorFn(this.value[i], i);
      if (!result.isValid) {
        result.errors.forEach(error => {
          this.addError(`${messagePrefix}[${i}]: ${error}`);
        });
      }
    }
    return this;
  }
}

/**
 * Object validator
 */
export class ObjectValidator<T extends Record<string, any>> extends BaseValidator<T> {
  validate(): ValidationResult {
    return {
      isValid: this.isValid(),
      errors: this.errors,
      warnings: this.warnings,
      value: this.value,
    };
  }

  /**
   * Check if object is required (not null or undefined)
   */
  required(message: string = 'Object is required'): this {
    if (this.value == null) {
      this.addError(message);
    }
    return this;
  }

  /**
   * Check if object has property
   */
  has(property: keyof T, message?: string): this {
    if (!(property in this.value)) {
      this.addError(message || `Object must have property "${String(property)}"`);
    }
    return this;
  }

  /**
   * Check if object has required properties
   */
  hasRequired(properties: (keyof T)[], messagePrefix: string = 'Missing required property'): this {
    for (const prop of properties) {
      if (!(prop in this.value) || this.value[prop] == null) {
        this.addError(`${messagePrefix}: ${String(prop)}`);
      }
    }
    return this;
  }

  /**
   * Validate nested property
   */
  property<K extends keyof T>(
    key: K, 
    validator: (value: T[K]) => ValidationResult, 
    messagePrefix: string = `Property "${String(key)}"`
  ): this {
    const result = validator(this.value[key]);
    if (!result.isValid) {
      result.errors.forEach(error => {
        this.addError(`${messagePrefix}: ${error}`);
      });
    }
    return this;
  }

  /**
   * Check object size (number of keys)
   */
  size(min: number, max?: number, message?: string): this {
    const size = Object.keys(this.value).length;
    if (size < min) {
      this.addError(message || `Object must have at least ${min} properties`);
    }
    if (max !== undefined && size > max) {
      this.addError(message || `Object must have no more than ${max} properties`);
    }
    return this;
  }
}

/**
 * Date validator
 */
export class DateValidator extends BaseValidator<Date> {
  validate(): ValidationResult {
    return {
      isValid: this.isValid(),
      errors: this.errors,
      warnings: this.warnings,
      value: this.value,
    };
  }

  /**
   * Check if date is required (not null or invalid)
   */
  required(message: string = 'Date is required'): this {
    if (this.value == null || !(this.value instanceof Date) || isNaN(this.value.getTime())) {
      this.addError(message);
    }
    return this;
  }

  /**
   * Check if date is before another date
   */
  before(date: Date, message?: string): this {
    if (this.value >= date) {
      this.addError(message || `Date must be before ${date.toISOString()}`);
    }
    return this;
  }

  /**
   * Check if date is after another date
   */
  after(date: Date, message?: string): this {
    if (this.value <= date) {
      this.addError(message || `Date must be after ${date.toISOString()}`);
    }
    return this;
  }

  /**
   * Check if date is between two dates
   */
  between(start: Date, end: Date, message?: string): this {
    if (this.value < start || this.value > end) {
      this.addError(message || `Date must be between ${start.toISOString()} and ${end.toISOString()}`);
    }
    return this;
  }

  /**
   * Check if date is in past
   */
  inPast(message: string = 'Date must be in the past'): this {
    if (this.value > new Date()) {
      this.addError(message);
    }
    return this;
  }

  /**
   * Check if date is in future
   */
  inFuture(message: string = 'Date must be in the future'): this {
    if (this.value < new Date()) {
      this.addError(message);
    }
    return this;
  }

  /**
   * Check if date is today
   */
  isToday(message: string = 'Date must be today'): this {
    const today = new Date();
    if (
      this.value.getDate() !== today.getDate() ||
      this.value.getMonth() !== today.getMonth() ||
      this.value.getFullYear() !== today.getFullYear()
    ) {
      this.addError(message);
    }
    return this;
  }
}

/**
 * Main validation functions
 */
export const validateString = (value: string): StringValidator => new StringValidator(value);
export const validateNumber = (value: number): NumberValidator => new NumberValidator(value);
export const validateArray = <T>(value: T[]): ArrayValidator<T> => new ArrayValidator(value);
export const validateObject = <T extends Record<string, any>>(value: T): ObjectValidator<T> => new ObjectValidator(value);
export const validateDate = (value: Date): DateValidator => new DateValidator(value);

/**
 * Schema-based validation
 */
export interface SchemaField<T> {
  validate: (value: T) => ValidationResult;
  optional?: boolean;
}

export interface ObjectSchema<T extends Record<string, any>> {
  [K in keyof T]: SchemaField<T[K]>;
}

export const validateSchema = <T extends Record<string, any>>(
  obj: T,
  schema: ObjectSchema<T>
): ValidationResult => {
  const errors: string[] = [];

  for (const [key, fieldSchema] of Object.entries(schema)) {
    const value = obj[key as keyof T];
    
    if (value == null && fieldSchema.optional) {
      continue;
    }

    const result = fieldSchema.validate(value as any);
    if (!result.isValid) {
      result.errors.forEach(error => {
        errors.push(`${String(key)}: ${error}`);
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: obj,
  };
};

/**
 * Conditional validation
 */
export const validateConditional = <T>(
  condition: boolean,
  validatorFn: (value: T) => ValidationResult,
  value: T
): ValidationResult => {
  if (!condition) {
    return { isValid: true, errors: [], value };
  }
  return validatorFn(value);
};

/**
 * Validation chain
 */
export class ValidationChain<T> {
  private validators: Array<(value: T) => ValidationResult> = [];

  constructor(private value: T) {}

  add(validator: (value: T) => ValidationResult): this {
    this.validators.push(validator);
    return this;
  }

  validate(): ValidationResult {
    let errors: string[] = [];
    let currentValue = this.value;

    for (const validator of this.validators) {
      const result = validator(currentValue);
      if (!result.isValid) {
        errors = [...errors, ...result.errors];
      }
      // Update value if validator returned a transformed value
      if (result.value !== undefined) {
        currentValue = result.value;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      value: currentValue,
    };
  }
}

export const validate = <T>(value: T): ValidationChain<T> => new ValidationChain(value);

/**
 * Sanitization functions
 */
export const sanitize = {
  /**
   * Sanitize string (remove dangerous characters)
   */
  string: (str: string): string => {
    return str
      .trim()
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/&/g, '&amp;') // Escape ampersands
      .replace(/"/g, '&quot;') // Escape quotes
      .replace(/'/g, '&#x27;'); // Escape apostrophes
  },

  /**
   * Sanitize HTML (basic)
   */
  html: (html: string): string => {
    // This is a very basic sanitization - in production, use a proper library like DOMPurify
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/data:/gi, ''); // Remove data: URLs
  },

  /**
   * Sanitize URL
   */
  url: (url: string): string => {
    try {
      const parsed = new URL(url);
      // Only allow http and https
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }
      return parsed.href;
    } catch {
      return '';
    }
  },

  /**
   * Sanitize email
   */
  email: (email: string): string => {
    return email.toLowerCase().trim();
  },
};

/**
 * Validation helpers
 */
export const is = {
  email: (value: string): boolean => VALIDATION_PATTERNS.EMAIL.test(value),
  url: (value: string): boolean => VALIDATION_PATTERNS.URL.test(value),
  uuid: (value: string, version: 'v4' | 'any' = 'any'): boolean => {
    const pattern = version === 'v4' ? VALIDATION_PATTERNS.UUID_V4 : VALIDATION_PATTERNS.UUID_ANY;
    return pattern.test(value);
  },
  phone: (value: string): boolean => VALIDATION_PATTERNS.PHONE.test(value),
  ip: (value: string): boolean => 
    VALIDATION_PATTERNS.IP_V4.test(value) || VALIDATION_PATTERNS.IP_V6.test(value),
  hexColor: (value: string): boolean => VALIDATION_PATTERNS.HEX_COLOR.test(value),
  slug: (value: string): boolean => VALIDATION_PATTERNS.SLUG.test(value),
  alphanumeric: (value: string): boolean => VALIDATION_PATTERNS.ALPHANUMERIC.test(value),
  creditCard: (value: string): boolean => VALIDATION_PATTERNS.CREDIT_CARD.test(value),
  ssn: (value: string): boolean => VALIDATION_PATTERNS.SSN.test(value),
  zipCode: (value: string): boolean => VALIDATION_PATTERNS.US_ZIP_CODE.test(value),
  canadianPostalCode: (value: string): boolean => VALIDATION_PATTERNS.CANADIAN_POSTAL_CODE.test(value),
  ukPostcode: (value: string): boolean => VALIDATION_PATTERNS.UK_POSTCODE.test(value),
};

// Export all validation patterns
export { VALIDATION_PATTERNS };