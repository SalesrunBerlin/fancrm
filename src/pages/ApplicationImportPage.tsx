
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useApplicationImport } from "@/hooks/useApplicationImport";
import { usePublishedApplications, PublishedApplication } from "@/hooks/usePublishedApplications";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";
import { ArrowLeft, Clock, Download, Eye, Globe, Lock, Search, User } from "lucide-react";

export default function ApplicationImportPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { publishedApplications, isLoading, usePublishedApplicationDetails } = usePublishedApplications();
  const { importApplication, isImporting } = useApplicationImport();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [filteredApps, setFilteredApps] = useState<PublishedApplication[]>([]);
  
  const { data: selectedAppDetails, isLoading: isLoadingDetails } = usePublishedApplicationDetails(selectedAppId || undefined);
  
  // Filter applications based on search query
  useEffect(() => {
    if (!publishedApplications) return;
    
    if (!searchQuery.trim()) {
      setFilteredApps(publishedApplications);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = publishedApplications.filter(app => 
      app.name.toLowerCase().includes(query) ||
      app.description?.toLowerCase().includes(query) ||
      app.publisher?.email.toLowerCase().includes(query)
    );
    
    setFilteredApps(filtered);
  }, [publishedApplications, searchQuery]);
  
  // Handle import
  const handleImport = async () => {
    if (!selectedAppId || !selectedAppDetails) {
      toast({
        title: "No application selected",
        description: "Please select an application to import",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const importId = await importApplication(selectedAppId);
      if (importId) {
        toast({
          title: "Import started",
          description: "The application is being imported. You'll be notified when it's complete."
        });
        navigate("/applications");
      }
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: "There was an error importing the application",
        variant: "destructive"
      });
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate("/applications")} 
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader
            title="Import Application"
            description="Browse and import published applications"
          />
        </div>
        
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search applications..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="text-muted-foreground col-span-full text-center py-12">Loading available applications...</p>
        ) : filteredApps && filteredApps.length > 0 ? (
          filteredApps.map(app => (
            <Card 
              key={app.id} 
              className={`cursor-pointer hover:border-primary transition-colors ${selectedAppId === app.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedAppId(app.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{app.name}</CardTitle>
                  <Badge variant={app.is_public ? "default" : "secondary"}>
                    {app.is_public ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                    {app.is_public ? "Public" : "Private"}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">{app.description || "No description available"}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2 pt-0">
                <div className="text-xs text-muted-foreground flex items-center mb-1">
                  <User className="h-3 w-3 mr-1" /> 
                  <span>Published by: {app.publisher?.email || "Unknown user"}</span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center">
                  <Clock className="h-3 w-3 mr-1" /> 
                  <span>Updated: {formatDate(app.updated_at)}</span>
                </div>
                {app.version && (
                  <Badge variant="outline" className="mt-2">v{app.version}</Badge>
                )}
              </CardContent>
              <CardFooter className="pt-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAppId(app.id);
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" /> View Details
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center border rounded-lg">
            <h3 className="text-lg font-medium mb-2">No applications found</h3>
            {searchQuery ? (
              <p className="text-muted-foreground mb-4">No applications match your search criteria</p>
            ) : (
              <p className="text-muted-foreground mb-4">There are no published applications available</p>
            )}
            <Button 
              variant="outline" 
              onClick={() => navigate("/applications")}
            >
              Back to Applications
            </Button>
          </div>
        )}
      </div>
      
      {/* Selected application details */}
      {selectedAppId && (
        <Card>
          <CardHeader>
            <CardTitle>Application Details</CardTitle>
            <CardDescription>
              Review the details of the selected application before importing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingDetails ? (
              <p className="text-center py-4 text-muted-foreground">Loading details...</p>
            ) : selectedAppDetails ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Name</h3>
                  <p>{selectedAppDetails.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Description</h3>
                  <p className="text-muted-foreground">
                    {selectedAppDetails.description || "No description available"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium">Version</h3>
                    <p>{selectedAppDetails.version || "1.0"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Visibility</h3>
                    <p>{selectedAppDetails.is_public ? "Public" : "Private"}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Objects</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAppDetails.objects && selectedAppDetails.objects.length > 0 ? (
                      selectedAppDetails.objects.map(obj => (
                        <Badge key={obj.id} variant="outline">
                          {obj.object_type.name}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No objects included</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAppDetails.actions && selectedAppDetails.actions.length > 0 ? (
                      selectedAppDetails.actions.map(action => (
                        <Badge key={action.id} variant="outline">
                          {action.action.name}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No actions included</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center py-4 text-muted-foreground">Failed to load application details</p>
            )}
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button 
              variant="outline"
              onClick={() => setSelectedAppId(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={isImporting || !selectedAppDetails}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Import Application
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
