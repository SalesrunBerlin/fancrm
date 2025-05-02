import { format } from 'date-fns';

type FormulaContext = {
  fieldValues?: Record<string, any>;
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
  
  let result = expression;
  
  // Handle running number replacements
  result = replaceRunningNumber(result, context.runningNumberValue);
  
  // Handle date functions
  result = replaceDateFunctions(result);
  
  // Handle field references - if fieldValues are provided
  if (context.fieldValues) {
    result = replaceFieldReferences(result, context.fieldValues);
  }
  
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
      if (!formatPattern) return now.toLocaleString();
      return format(now, formatPattern);
    }
  );
  
  // Replace {Today} with current date
  result = result.replace(
    /{Today(?::([^}]*))?}/g,
    (match, formatPattern) => {
      if (!formatPattern) return now.toLocaleDateString();
      return format(now, formatPattern);
    }
  );
  
  return result;
}

/**
 * Replaces field references in the expression
 */
function replaceFieldReferences(expression: string, fieldValues: Record<string, any>): string {
  // Match patterns like {FieldName}
  return expression.replace(
    /{([^{}]+)}/g,
    (match, fieldName) => {
      // If the match is a known function, don't replace it
      if (fieldName.startsWith('RunningNumber') || 
          fieldName.startsWith('Now') || 
          fieldName.startsWith('Today')) {
        return match;
      }
      
      // Otherwise, try to replace with field value
      const value = fieldValues[fieldName];
      return value !== undefined ? String(value) : match;
    }
  );
}
