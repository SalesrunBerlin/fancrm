
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
export function evaluateFormula(expression: string | null | undefined, context: FormulaContext = {}): string {
  if (!expression) return '';
  
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
        return lookupValue !== undefined && lookupValue !== null 
          ? String(lookupValue) 
          : match;
      }

      // Otherwise try to find the lookup record ID first
      const lookupId = fieldValues[lookupField];
      if (!lookupId || lookupId === 'undefined' || lookupId === 'null') {
        return '';
      }

      console.log(`Found lookup ID: ${lookupId} for field ${lookupField}, but no resolved values available`);
      return match;
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
      
      // Handle undefined, null, or invalid UUID values
      if (value === undefined || value === null || value === 'undefined' || value === 'null') {
        return '';
      }
      
      return String(value);
    }
  );
  
  return result;
}

/**
 * Validates if a string is a valid UUID
 * Used to prevent storing invalid UUIDs in lookup fields
 */
export function isValidUuid(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
