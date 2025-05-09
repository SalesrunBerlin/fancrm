
import React from 'react';
import { ObjectField } from '@/hooks/useObjectTypes';
import { RecordField } from './RecordField';

interface EditFieldProps {
  field: ObjectField;
  value: any;
  onChange: (value: any) => void;
  objectTypeId: string;
}

export function EditField({ field, value, onChange, objectTypeId }: EditFieldProps) {
  return (
    <RecordField
      field={field}
      value={value}
      onChange={onChange}
      objectTypeId={objectTypeId}
    />
  );
}
