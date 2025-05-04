
import { format } from 'date-fns';

type FormulaContext = {
  fieldValues?: Record<string, any>;
  lookupFieldsValues?: Record<string, Record<string, any>>;
  runningNumberValue?: number;
};

/**
 * Evaluates a formula expression and returns the result
 * @param expression The formula expression to evaluate
 * @param context Optional context data like field values
 * @returns The evaluated result as a string
 */
export function evaluateFormula(expression: string | null | undefined, context: FormulaContext = {}): string | null {
  if (!expression) return null;
  
  console.log("Evaluating formula:", expression, "with context:", context);
  
  let result = expression;
  
  // Handle running number replacements
  result = replaceRunningNumber(result, context.runningNumberValue);
  
  // Handle date functions
  result = replaceDateFunctions(result);
  
  // Handle field references - if fieldValues are provided
  if (context.fieldValues) {
    result = replaceFieldReferences(result, context.fieldValues, context.lookupFieldsValues);
  }
  
  // If the result still contains unresolved formula references, return null instead of the unresolved formula
  if (result.includes('{') && result.includes('}')) {
    console.log("Formula contains unresolved references:", result);
    // If the formula completely matches the original expression (nothing was replaced), return null
    if (result === expression) {
      return null;
    }
  }

  // Special handling for empty string values that might be used as UUIDs
  // If the formula evaluation resulted in an empty string and there are no more
  // unresolved references, return null to prevent database errors
  if (result === '') {
    console.log("Formula evaluated to empty string - returning null instead");
    return null;
  }

  // Prevent returning the string "undefined" which would cause database errors
  if (result === 'undefined') {
    console.log("Formula evaluated to 'undefined' string - returning null instead");
    return null;
  }
  
  // Additional checks for UUID fields
  if (result && (
      result === 'null' || 
      result === 'undefined' || 
      result === '' ||
      !/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})?$/i.test(result)
    )) {
    if (expression.includes('.') && expression.includes('FieldName')) {
      // This is likely a lookup field reference that couldn't be resolved
      console.log("Formula appears to be a lookup field that couldn't be resolved:", result);
      return null;
    }
  }
  
  console.log("Formula evaluation result:", result);
  return result;
}

/**
 * Replaces {RunningNumber} placeholders in the expression
 */
function replaceRunningNumber(expression: string, runningNumber?: number): string {
  // If no running number is provided, leave as is (will be replaced server-side)
  if (runningNumber === undefined) return expression;
  
  // Match patterns like {RunningNumber} or {RunningNumber:000}
  return expression.replace(
    /{RunningNumber(?::([^}]*))?}/g,
    (match, formatPattern) => {
      if (!formatPattern) return String(runningNumber);
      
      // Handle format patterns like 000 for zero-padding
      if (/^0+$/.test(formatPattern)) {
        const padding = formatPattern.length;
        return String(runningNumber).padStart(padding, '0');
      }
      
      return String(runningNumber);
    }
  );
}

/**
 * Replaces date function placeholders in the expression
 */
function replaceDateFunctions(expression: string): string {
  const now = new Date();
  
  // Replace {Now} with current date and time
  let result = expression.replace(
    /{Now(?::([^}]*))?}/g, 
    (match, formatPattern) => {
      console.log(`Replacing {Now} with format: ${formatPattern || 'default'}`);
      if (!formatPattern) return now.toISOString();
      return format(now, formatPattern);
    }
  );
  
  // Replace {Today} with current date
  result = result.replace(
    /{Today(?::([^}]*))?}/g,
    (match, formatPattern) => {
      console.log(`Replacing {Today} with format: ${formatPattern || 'default'}`);
      if (!formatPattern) return format(now, 'yyyy-MM-dd');
      return format(now, formatPattern);
    }
  );
  
  return result;
}

/**
 * Replaces field references in the expression
 */
function replaceFieldReferences(
  expression: string, 
  fieldValues: Record<string, any>,
  lookupFieldsValues?: Record<string, Record<string, any>>
): string {
  // First, handle lookup field references like {LookupField.FieldName}
  let result = expression.replace(
    /{([^{}]+)\.([^{}]+)}/g,
    (match, lookupField, fieldName) => {
      // If we have lookup field values
      if (lookupFieldsValues && lookupFieldsValues[lookupField]) {
        const lookupValue = lookupFieldsValues[lookupField][fieldName];
        
        // Return null for undefined or null values - important for UUID fields
        if (lookupValue === undefined || lookupValue === null) {
          console.log(`Lookup value for ${lookupField}.${fieldName} is undefined or null, returning null`);
          return '';
        }
        
        // Additional validation for UUID values
        if (fieldName.toLowerCase().includes('id') && typeof lookupValue === 'string') {
          // Check if it's a valid UUID format
          if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lookupValue)) {
            console.log(`Invalid UUID format for lookup field ${lookupField}.${fieldName}: ${lookupValue}`);
            return '';
          }
        }
        
        return String(lookupValue);
      }

      // Otherwise try to find the lookup record ID first
      const lookupId = fieldValues[lookupField];
      if (!lookupId) {
        console.log(`Lookup field ${lookupField} has no value, returning empty string`);
        return '';
      }

      console.log(`Found lookup ID: ${lookupId} for field ${lookupField}, but no resolved values available`);
      return ''; // Return empty string instead of keeping the unresolved reference
    }
  );

  // Then, handle simple field references like {FieldName}
  result = result.replace(
    /{([^{}\.]+)}/g,
    (match, fieldName) => {
      // If the match is a known function, don't replace it
      if (fieldName.startsWith('RunningNumber') || 
          fieldName.startsWith('Now') || 
          fieldName.startsWith('Today')) {
        return match;
      }
      
      // Otherwise, try to replace with field value
      const value = fieldValues[fieldName];
      
      // Return empty string for undefined values to prevent "undefined" string in the result
      if (value === undefined || value === null) {
        console.log(`Field ${fieldName} has no value, returning empty string`);
        return '';
      } else {
        // For fields that might be UUIDs, validate the format
        if (fieldName.toLowerCase().includes('id') && typeof value === 'string') {
          if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
            console.log(`Invalid UUID format for field ${fieldName}: ${value}`);
            return '';
          }
        }
        return String(value);
      }
    }
  );
  
  return result;
}
