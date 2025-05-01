
import { useState } from "react";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { 
  Plus, Loader2, Building, User, Briefcase, Calendar, Box, 
  Trash2, Archive, RefreshCw, Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ObjectType } from "@/hooks/useObjectTypes";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ObjectManager() {
  const [showArchived, setShowArchived] = useState(false);
  const { objectTypes, isLoading } = useObjectTypes(showArchived);
  const [activeTab, setActiveTab] = useState("all");

  const getIconComponent = (iconName: string | null) => {
    switch(iconName) {
      case 'user': return <User className="h-5 w-5" />;
      case 'building': return <Building className="h-5 w-5" />;
      case 'briefcase': return <Briefcase className="h-5 w-5" />;
      case 'calendar': return <Calendar className="h-5 w-5" />;
      default: return <Box className="h-5 w-5" />;
    }
  };

  const activeObjects = objectTypes?.filter(obj => !obj.is_archived) || [];
  const archivedObjects = objectTypes?.filter(obj => obj.is_archived) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Object Manager"
        description="Manage all your custom and standard objects"
        actions={
          <Button asChild>
            <Link to="/settings/object-manager/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Object
            </Link>
          </Button>
        }
      />

      <Tabs 
        defaultValue="all" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">Alle Objekte</TabsTrigger>
            <TabsTrigger value="archived">Archivierte Objekte</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="show-archived" 
              checked={showArchived} 
              onCheckedChange={setShowArchived} 
            />
            <Label htmlFor="show-archived">Archivierte einblenden</Label>
          </div>
        </div>

        <TabsContent value="all">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Aktive Objekte</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : activeObjects.length > 0 ? (
                <div className="space-y-4">
                  {activeObjects.map((objectType: ObjectType) => (
                    <div key={objectType.id} className="block">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <Link 
                          to={`/settings/objects/${objectType.id}`}
                          className="flex-grow hover:bg-accent hover:text-accent-foreground transition-colors rounded-lg p-2 -m-2"
                        >
                          <div className="flex items-center gap-3">
                            {getIconComponent(objectType.icon)}
                            <div>
                              <h3 className="font-medium">{objectType.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {objectType.description || `API Name: ${objectType.api_name}`}
                              </p>
                            </div>
                          </div>
                        </Link>
                        <div className="flex items-center gap-3">
                          <div className="flex gap-2">
                            {objectType.is_system && (
                              <Badge variant="secondary">System</Badge>
                            )}
                            {objectType.is_published && (
                              <Badge variant="outline">Published</Badge>
                            )}
                            {objectType.is_template && (
                              <Badge variant="outline" className="bg-purple-100">Imported</Badge>
                            )}
                            {!objectType.is_active && (
                              <Badge variant="outline" className="bg-red-50 text-red-700">Inactive</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                              asChild
                            >
                              <Link to={`/settings/objects/${objectType.id}/archive`}>
                                <Archive className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              asChild
                            >
                              <Link to={`/settings/objects/${objectType.id}/delete`}>
                                <Trash2 className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No object types found. Create your first custom object to get started.
                  </p>
                  <Button asChild>
                    <Link to="/settings/object-manager/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Object
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archived">
          <ArchivedObjectsCard objects={archivedObjects} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ArchivedObjectsCard({ objects, isLoading }: { objects: ObjectType[], isLoading: boolean }) {
  const getIconComponent = (iconName: string | null) => {
    switch(iconName) {
      case 'user': return <User className="h-5 w-5" />;
      case 'building': return <Building className="h-5 w-5" />;
      case 'briefcase': return <Briefcase className="h-5 w-5" />;
      case 'calendar': return <Calendar className="h-5 w-5" />;
      default: return <Box className="h-5 w-5" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Archivierte Objekte</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : objects.length > 0 ? (
          <div className="space-y-4">
            {objects.map((objectType: ObjectType) => (
              <div key={objectType.id} className="block opacity-70 hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-3">
                    {getIconComponent(objectType.icon)}
                    <div>
                      <h3 className="font-medium">{objectType.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {objectType.description || `API Name: ${objectType.api_name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-slate-100">Archiviert</Badge>
                      {objectType.is_system && (
                        <Badge variant="secondary">System</Badge>
                      )}
                      {objectType.is_published && (
                        <Badge variant="outline">Published</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        asChild
                      >
                        <Link to={`/settings/objects/${objectType.id}/restore`}>
                          <RefreshCw className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                      >
                        <Link to={`/settings/objects/${objectType.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        asChild
                      >
                        <Link to={`/settings/objects/${objectType.id}/delete`}>
                          <Trash2 className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Keine archivierten Objekte gefunden.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
