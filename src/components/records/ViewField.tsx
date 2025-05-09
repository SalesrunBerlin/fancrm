
import React from 'react';
import { ObjectField } from '@/hooks/useObjectTypes';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { LookupValueDisplay } from './LookupValueDisplay';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

interface ViewFieldProps {
  field: ObjectField;
  value: any;
  objectTypeId: string;
}

export function ViewField({ field, value, objectTypeId }: ViewFieldProps) {
  // Handle different field types for display
  const renderFieldValue = () => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-muted-foreground italic">No value</span>;
    }

    switch (field.data_type) {
      case 'lookup':
        return (
          <LookupValueDisplay 
            value={value} 
            fieldOptions={field.options || { target_object_type_id: '' }}
          />
        );
      
      case 'checkbox':
      case 'boolean':
        return (
          <div className="flex items-center h-9 py-2">
            <Checkbox checked={value === true || value === 'true'} disabled />
            <span className="ml-2">{value === true || value === 'true' ? 'Yes' : 'No'}</span>
          </div>
        );
      
      case 'date':
        return <div className="py-2">{formatDate(value)}</div>;
      
      case 'textarea':
        return (
          <div className="py-2 whitespace-pre-wrap">
            {value}
          </div>
        );
        
      case 'email':
        return (
          <div className="py-2">
            <a href={`mailto:${value}`} className="text-blue-600 hover:underline">
              {value}
            </a>
          </div>
        );
        
      case 'url':
        return (
          <div className="py-2">
            <a 
              href={value.startsWith('http') ? value : `https://${value}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {value}
            </a>
          </div>
        );
        
      case 'picklist':
        return (
          <div className="py-2">
            <Badge variant="outline">{value}</Badge>
          </div>
        );
        
      case 'auto_number':
        return <div className="py-2 font-mono">{value}</div>;
        
      default:
        return <div className="py-2">{value}</div>;
    }
  };

  return (
    <div className="min-h-9 bg-muted/20 px-3 rounded-md">
      {renderFieldValue()}
    </div>
  );
}
