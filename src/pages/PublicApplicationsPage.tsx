
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { usePublishedApplications } from "@/hooks/usePublishedApplications";
import { PublishedApplicationCard } from "@/components/publishing/PublishedApplicationCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"; 
import { ArrowLeft, Search, Globe, User, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function PublicApplicationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { publishedApplications, isLoading, refetch, error } = usePublishedApplications();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'public' | 'mine'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initial data load on mount
  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleImport = (applicationId: string) => {
    navigate(`/applications/import/${applicationId}`);
  };

  // Function to refresh applications
  const refreshApplications = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["published-applications"] });
      await refetch();
      console.log("Applications refreshed, count:", publishedApplications?.length || 0);
    } catch (err) {
      console.error("Error refreshing applications:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter applications based on search term and active tab
  const filteredApplications = publishedApplications
    ?.filter(app => {
      // Filter by search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          app.name.toLowerCase().includes(term) ||
          (app.description && app.description.toLowerCase().includes(term))
        );
      }
      return true;
    })
    .filter(app => {
      // Filter by tab
      switch (activeTab) {
        case 'public':
          return app.is_public;
        case 'mine':
          return !app.is_public; // These are user's private apps
        default:
          return true;
      }
    }) || [];

  const publicAppsCount = publishedApplications?.filter(app => app.is_public).length || 0;
  const privateAppsCount = publishedApplications?.filter(app => !app.is_public).length || 0;

  return (
    <div className="space-y-6">
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
          title="Applications Marketplace" 
          description="Browse and import public applications"
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <Tabs 
          defaultValue="all" 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'all' | 'public' | 'mine')}
          className="w-full md:w-auto"
        >
          <TabsList>
            <TabsTrigger value="all" className="flex items-center gap-1">
              All <span className="ml-1 text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">
                {publishedApplications?.length || 0}
              </span>
            </TabsTrigger>
            <TabsTrigger value="public" className="flex items-center gap-1">
              <Globe className="h-3 w-3 mr-1" />
              Public <span className="ml-1 text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">
                {publicAppsCount}
              </span>
            </TabsTrigger>
            <TabsTrigger value="mine" className="flex items-center gap-1">
              <User className="h-3 w-3 mr-1" />
              My Apps <span className="ml-1 text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">
                {privateAppsCount}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshApplications}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search applications..."
              className="pl-9 pr-4"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Display an error message if there was an error fetching applications */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error loading applications</AlertTitle>
          <AlertDescription>
            There was an error loading the published applications. Please try refreshing.
          </AlertDescription>
        </Alert>
      )}

      <TabsContent value="all" className="mt-0 p-0">
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-52" />
            ))}
          </div>
        ) : filteredApplications.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredApplications.map((app) => (
              <PublishedApplicationCard
                key={app.id}
                application={app}
                onImport={handleImport}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg">
            <h3 className="text-xl font-medium text-muted-foreground mb-2">No Applications Found</h3>
            {searchTerm ? (
              <p className="text-muted-foreground">
                No applications matching "{searchTerm}". Try a different search term.
              </p>
            ) : (
              <p className="text-muted-foreground">
                There are no applications available yet. Try refreshing or check back later.
              </p>
            )}
            <Button 
              variant="outline" 
              onClick={refreshApplications} 
              className="mt-4"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Applications
            </Button>
          </div>
        )}
      </TabsContent>
    </div>
  );
}
