
import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Settings, BookOpen } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

interface HelpTab {
  id: string;
  name: string;
  tab_id: string;
  icon: string | null;
  display_order: number;
}

export default function HelpContentEditor() {
  const [tabs, setTabs] = useState<HelpTab[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTabs();
  }, []);

  const fetchTabs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("help_tabs")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setTabs(data || []);
    } catch (error: any) {
      toast.error("Failed to load tabs", {
        description: error.message
      });
      console.error("Error fetching tabs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Help Content Editor" 
        description="Manage tabs and content in the help center"
        backTo="/admin"
        actions={
          <Button 
            variant="outline" 
            onClick={() => navigate("/admin/help-tabs")}
          >
            <Settings className="mr-2 h-4 w-4" /> Manage Tabs
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Select a Tab to Edit Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tabs.map((tab) => (
              <Card 
                key={tab.id} 
                className="cursor-pointer hover:bg-accent/5 transition-colors"
                onClick={() => navigate(`/admin/help-content/${tab.tab_id}`)}
              >
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    {tab.icon ? (
                      <span className="text-primary text-lg">{tab.icon}</span>
                    ) : (
                      <BookOpen className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <h3 className="font-medium text-lg mb-1">{tab.name}</h3>
                  <p className="text-sm text-muted-foreground">ID: {tab.tab_id}</p>
                </CardContent>
              </Card>
            ))}
            
            {tabs.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No tabs found. Go to Tab Management to create tabs first.
              </div>
            )}
          </div>
          
          {tabs.length === 0 && (
            <div className="flex justify-center">
              <Button onClick={() => navigate("/admin/help-tabs")}>
                <Settings className="mr-2 h-4 w-4" /> Manage Tabs
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
