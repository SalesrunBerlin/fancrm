
import { AssistantChat } from '@/components/ai/AssistantChat';
import { PageHeader } from '@/components/ui/page-header';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useObjectTypes } from '@/hooks/useObjectTypes';

export default function OpenAIAssistant() {
  const { useObjectTypesList } = useObjectTypes();
  const { data: objectTypes = [], isLoading: isLoadingObjects } = useObjectTypesList();
  
  const [enabledObjectTypes, setEnabledObjectTypes] = useState<string[]>([]);

  const handleObjectTypeToggle = (objectTypeId: string) => {
    setEnabledObjectTypes(prev => {
      if (prev.includes(objectTypeId)) {
        return prev.filter(id => id !== objectTypeId);
      } else {
        return [...prev, objectTypeId];
      }
    });
  };

  return (
    <div className="container py-6 space-y-6">
      <PageHeader
        title="AI Assistant"
        description="Get insights from your CRM data using AI"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AssistantChat
            title="CRM Assistant"
            description="Ask questions about your contacts, accounts, and more"
            systemPrompt="You are a helpful CRM assistant. Help the user find and analyze their data stored in the CRM system. Be concise, accurate and helpful."
            dataScope={enabledObjectTypes}
          />
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Data Context</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select which object types to include in the AI context
                  </p>
                </div>
                
                {isLoadingObjects ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : objectTypes.length > 0 ? (
                  <div className="space-y-3">
                    {objectTypes.map(objectType => (
                      <div key={objectType.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`toggle-${objectType.id}`} className="cursor-pointer">
                            {objectType.name}
                          </Label>
                        </div>
                        <Switch
                          id={`toggle-${objectType.id}`}
                          checked={enabledObjectTypes.includes(objectType.id)}
                          onCheckedChange={() => handleObjectTypeToggle(objectType.id)}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No object types available
                  </div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm font-medium mb-2">
                    Selected Data Types:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {enabledObjectTypes.length === 0 ? (
                      <span className="text-sm text-muted-foreground">No data types selected</span>
                    ) : (
                      enabledObjectTypes.map(id => {
                        const objectType = objectTypes.find(ot => ot.id === id);
                        return (
                          <Badge key={id} variant="outline">
                            {objectType?.name || id}
                          </Badge>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">Example Questions</h3>
              <ul className="space-y-2 list-disc list-inside text-sm">
                <li>Show me all contacts from [company]</li>
                <li>What deals are closing this month?</li>
                <li>Summarize recent account activity</li>
                <li>Find contacts in [location]</li>
                <li>What was my last interaction with [contact]?</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
