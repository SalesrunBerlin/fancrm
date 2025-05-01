
import { useState } from "react";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { 
  Plus, Loader2, Building, User, Briefcase, Calendar, Box, 
  Archive, RefreshCw, Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ObjectType } from "@/hooks/useObjectTypes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ObjectManager() {
  // Fetch all objects including archived ones
  const { objectTypes: allObjectTypes, isLoading } = useObjectTypes(true);
  const [activeTab, setActiveTab] = useState("all");

  // Split objects into active and archived
  const activeObjects = allObjectTypes?.filter(obj => !obj.is_archived) || [];
  const archivedObjects = allObjectTypes?.filter(obj => obj.is_archived) || [];

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
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="all">Active Objects</TabsTrigger>
          <TabsTrigger value="archived">Archived Objects</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Active Objects</CardTitle>
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
                          {!objectType.is_system && (
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
                          )}
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
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Archived Objects</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : archivedObjects.length > 0 ? (
                <div className="space-y-4">
                  {archivedObjects.map((objectType: ObjectType) => (
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
