
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";

interface ObjectField {
  id: string;
  name: string;
  api_name: string;
  data_type: string;
  is_required: boolean;
}

interface UserObject {
  id: string;
  name: string;
  api_name: string;
  fields: ObjectField[];
  recordCount: number;
}

interface UserObjectsListProps {
  userObjects: UserObject[];
}

export function UserObjectsList({ userObjects }: UserObjectsListProps) {
  const [expandedObjects, setExpandedObjects] = useState<string[]>([]);

  const toggleObjectExpand = (objectId: string) => {
    setExpandedObjects(prev => 
      prev.includes(objectId) 
        ? prev.filter(id => id !== objectId) 
        : [...prev, objectId]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Objects</CardTitle>
      </CardHeader>
      <CardContent>
        {userObjects.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground">No objects found</p>
        ) : (
          <div className="space-y-4">
            {userObjects.map((object) => (
              <div key={object.id} className="border rounded-md">
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer bg-muted/20 hover:bg-muted/50"
                  onClick={() => toggleObjectExpand(object.id)}
                >
                  <div className="flex items-center gap-2">
                    {expandedObjects.includes(object.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span className="font-medium">{object.name}</span>
                    <Badge variant="outline" className="ml-2">{object.api_name}</Badge>
                  </div>
                  <div className="flex gap-3">
                    <Badge variant="secondary">{object.fields.length} Fields</Badge>
                    <Badge>{object.recordCount} Records</Badge>
                  </div>
                </div>
                
                {expandedObjects.includes(object.id) && (
                  <div className="p-4 border-t">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Field Name</TableHead>
                          <TableHead>API Name</TableHead>
                          <TableHead>Data Type</TableHead>
                          <TableHead>Required</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {object.fields.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                              No fields found
                            </TableCell>
                          </TableRow>
                        ) : (
                          object.fields.map((field) => (
                            <TableRow key={field.id}>
                              <TableCell>{field.name}</TableCell>
                              <TableCell>{field.api_name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{field.data_type}</Badge>
                              </TableCell>
                              <TableCell>
                                {field.is_required ? (
                                  <Badge className="bg-blue-400 hover:bg-blue-500">Required</Badge>
                                ) : (
                                  <Badge variant="outline">Optional</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
