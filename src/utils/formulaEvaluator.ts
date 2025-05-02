
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
  
  // Handle lookup field references - this should be done before regular field references
  // so that {lookupField.fieldName} is processed before potentially matching {fieldName}
  if (context.fieldValues && context.lookupFieldsValues) {
    result = replaceLookupFieldReferences(result, context.fieldValues, context.lookupFieldsValues);
  }
  
  // Handle regular field references
  if (context.fieldValues) {
    result = replaceFieldReferences(result, context.fieldValues);
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
 * Replaces lookup field references in the expression
 * This specifically handles patterns like {LookupField.FieldName}
 */
function replaceLookupFieldReferences(
  expression: string,
  fieldValues: Record<string, any>,
  lookupFieldsValues: Record<string, Record<string, any>>
): string {
  // Handle explicit lookup field references like {LookupField.FieldName}
  return expression.replace(
    /{([^{}\.]+)\.([^{}\.]+)}/g,
    (match, lookupFieldName, fieldName) => {
      console.log(`Processing lookup reference: ${match} -> ${lookupFieldName}.${fieldName}`);
      
      // First check if we have values for this lookup field
      if (lookupFieldsValues[lookupFieldName]) {
        const lookupData = lookupFieldsValues[lookupFieldName];
        console.log(`Found lookup data for ${lookupFieldName}:`, lookupData);
        
        const fieldValue = lookupData[fieldName];
        if (fieldValue !== undefined) {
          console.log(`Found lookup field value: ${lookupFieldName}.${fieldName} = ${fieldValue}`);
          return String(fieldValue);
        }
      }
      
      // If lookup field itself has a value (record ID) but we don't have the lookup data yet
      const lookupId = fieldValues[lookupFieldName];
      if (lookupId) {
        console.log(`Lookup field ${lookupFieldName} has ID ${lookupId} but no resolved values available`);
      } else {
        console.log(`Lookup field ${lookupFieldName} has no value`);
      }
      
      // If we can't resolve the lookup, return the original placeholder
      // This allows for later reevaluation when lookup data is available
      return match;
    }
  );
}

/**
 * Replaces simple field references in the expression
 * This handles patterns like {FieldName}
 */
function replaceFieldReferences(
  expression: string, 
  fieldValues: Record<string, any>
): string {
  // Handle simple field references like {FieldName}
  return expression.replace(
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
      if (value !== undefined) {
        console.log(`Replacing field reference {${fieldName}} with value:`, value);
        return String(value);
      }
      
      console.log(`Field reference {${fieldName}} has no value, keeping placeholder`);
      return match;
    }
  );
}
