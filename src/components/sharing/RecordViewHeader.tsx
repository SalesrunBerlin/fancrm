
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings } from 'lucide-react';

interface RecordViewHeaderProps {
  shareId: string;
}

export function RecordViewHeader({ shareId }: RecordViewHeaderProps) {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-wrap justify-between items-center gap-2">
      <Button variant="ghost" size="sm" asChild className="mb-2">
        <Link to="/shared-records">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shared Records
        </Link>
      </Button>
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => navigate(`/field-mapping/${shareId}`)}
      >
        <Settings className="mr-2 h-4 w-4" />
        Adjust Field Mappings
      </Button>
    </div>
  );
}
