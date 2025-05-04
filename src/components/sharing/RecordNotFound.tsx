
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function RecordNotFound() {
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Record Not Found</h2>
      <p className="mb-4">The shared record you're looking for doesn't exist or you don't have permission to view it.</p>
      <Button asChild>
        <Link to="/shared-records">Back to Shared Records</Link>
      </Button>
    </div>
  );
}
