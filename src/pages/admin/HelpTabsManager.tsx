
import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Save, Plus, ArrowUpDown, Trash2, Edit, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface HelpTab {
  id: string;
  name: string;
  tab_id: string;
  icon: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export default function HelpTabsManager() {
  const [tabs, setTabs] = useState<HelpTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTabDialog, setShowNewTabDialog] = useState(false);
  const [showEditTabDialog, setShowEditTabDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState<HelpTab | null>(null);
  const [newTab, setNewTab] = useState<Partial<HelpTab>>({
    name: "",
    tab_id: "",
    icon: "",
    display_order: 0
  });
  
  const navigate = useNavigate();

  // Fetch all tabs
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

  const handleCreateTab = async () => {
    try {
      // Validate tab ID format - alphanumeric with dashes only
      if (!/^[a-z0-9-]+$/.test(newTab.tab_id || "")) {
        toast.error("Tab ID must contain only lowercase letters, numbers, and dashes");
        return;
      }

      const { data, error } = await supabase
        .from("help_tabs")
        .insert({
          name: newTab.name,
          tab_id: newTab.tab_id,
          icon: newTab.icon,
          display_order: tabs.length > 0 ? Math.max(...tabs.map(tab => tab.display_order)) + 1 : 0
        })
        .select();

      if (error) throw error;

      toast.success("Tab created successfully");
      setShowNewTabDialog(false);
      setNewTab({
        name: "",
        tab_id: "",
        icon: "",
        display_order: 0
      });
      fetchTabs();
    } catch (error: any) {
      toast.error("Failed to create tab", {
        description: error.message
      });
      console.error("Error creating tab:", error);
    }
  };

  const handleUpdateTab = async () => {
    if (!currentTab) return;

    try {
      // Validate tab ID format - alphanumeric with dashes only
      if (!/^[a-z0-9-]+$/.test(currentTab.tab_id)) {
        toast.error("Tab ID must contain only lowercase letters, numbers, and dashes");
        return;
      }

      const { error } = await supabase
        .from("help_tabs")
        .update({
          name: currentTab.name,
          tab_id: currentTab.tab_id,
          icon: currentTab.icon
        })
        .eq("id", currentTab.id);

      if (error) throw error;

      toast.success("Tab updated successfully");
      setShowEditTabDialog(false);
      fetchTabs();
    } catch (error: any) {
      toast.error("Failed to update tab", {
        description: error.message
      });
      console.error("Error updating tab:", error);
    }
  };

  const handleDeleteTab = async () => {
    if (!currentTab) return;

    try {
      // Check if there's any content using this tab
      const { data: contentData, error: contentError } = await supabase
        .from("help_content")
        .select("id")
        .eq("tab_id", currentTab.tab_id);

      if (contentError) throw contentError;

      if (contentData && contentData.length > 0) {
        if (!window.confirm(`This tab contains ${contentData.length} content items which will also be deleted. Are you sure you want to proceed?`)) {
          setShowDeleteDialog(false);
          return;
        }
      }

      // Delete the tab (cascade will handle content deletion)
      const { error } = await supabase
        .from("help_tabs")
        .delete()
        .eq("id", currentTab.id);

      if (error) throw error;

      toast.success("Tab deleted successfully");
      setShowDeleteDialog(false);
      fetchTabs();
    } catch (error: any) {
      toast.error("Failed to delete tab", {
        description: error.message
      });
      console.error("Error deleting tab:", error);
    }
  };

  const handleMoveTab = async (tab: HelpTab, direction: 'up' | 'down') => {
    const currentIndex = tabs.findIndex(t => t.id === tab.id);
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === tabs.length - 1)
    ) {
      return; // Already at the edge
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const otherTab = tabs[newIndex];
    
    try {
      // Update both tabs in a transaction
      await supabase.rpc('swap_tab_order', {
        tab_id_1: tab.id,
        tab_id_2: otherTab.id,
        new_order_1: otherTab.display_order,
        new_order_2: tab.display_order
      });

      // Update locally
      const updatedTabs = [...tabs];
      [updatedTabs[currentIndex].display_order, updatedTabs[newIndex].display_order] = 
        [updatedTabs[newIndex].display_order, updatedTabs[currentIndex].display_order];
      
      // Sort by display_order
      updatedTabs.sort((a, b) => a.display_order - b.display_order);
      setTabs(updatedTabs);
      
      toast.success("Tab order updated");
    } catch (error: any) {
      toast.error("Failed to update tab order", {
        description: error.message
      });
      console.error("Error updating tab order:", error);
      // Refresh from database to ensure UI consistency
      fetchTabs();
    }
  };

  // Fallback for moving tabs if RPC is not available
  const handleMoveTabFallback = async (tab: HelpTab, direction: 'up' | 'down') => {
    const currentIndex = tabs.findIndex(t => t.id === tab.id);
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === tabs.length - 1)
    ) {
      return; // Already at the edge
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const otherTab = tabs[newIndex];
    
    try {
      // Update first tab
      const { error: error1 } = await supabase
        .from("help_tabs")
        .update({ display_order: otherTab.display_order })
        .eq("id", tab.id);
        
      if (error1) throw error1;
      
      // Update second tab
      const { error: error2 } = await supabase
        .from("help_tabs")
        .update({ display_order: tab.display_order })
        .eq("id", otherTab.id);
        
      if (error2) throw error2;

      // Update locally to avoid refetching
      const updatedTabs = [...tabs];
      [updatedTabs[currentIndex].display_order, updatedTabs[newIndex].display_order] = 
        [updatedTabs[newIndex].display_order, updatedTabs[currentIndex].display_order];
      
      // Sort by display_order
      updatedTabs.sort((a, b) => a.display_order - b.display_order);
      setTabs(updatedTabs);
      
      toast.success("Tab order updated");
    } catch (error: any) {
      toast.error("Failed to update tab order", {
        description: error.message
      });
      console.error("Error updating tab order:", error);
      // Refresh from database to ensure UI consistency
      fetchTabs();
    }
  };

  const handleTabClick = (tab: HelpTab) => {
    navigate(`/admin/help-content/${tab.tab_id}`);
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
        title="Help Tabs Management"
        description="Manage the tabs displayed in the help center"
        backTo="/admin"
        actions={
          <Button onClick={() => setShowNewTabDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Tab
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Help Tabs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {tabs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tabs found. Click "Add Tab" to create one.
            </div>
          ) : (
            <div className="space-y-4">
              {tabs.map((tab, index) => (
                <Card key={tab.id} className="border relative">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4 cursor-pointer" onClick={() => handleTabClick(tab)}>
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        {tab.icon ? (
                          <span className="text-primary text-lg">{tab.icon}</span>
                        ) : (
                          <span className="text-primary font-bold">{tab.name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{tab.name}</h3>
                        <p className="text-sm text-muted-foreground">ID: {tab.tab_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={index === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveTabFallback(tab, 'up');
                        }}
                      >
                        <ArrowUpDown className="h-4 w-4 rotate-90" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={index === tabs.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveTabFallback(tab, 'down');
                        }}
                      >
                        <ArrowUpDown className="h-4 w-4 -rotate-90" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentTab(tab);
                          setShowEditTabDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentTab(tab);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Tab Dialog */}
      <Dialog open={showNewTabDialog} onOpenChange={setShowNewTabDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Tab</DialogTitle>
            <DialogDescription>
              Create a new tab for the help center. The Tab ID should be unique and URL-friendly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input 
                id="name" 
                value={newTab.name} 
                onChange={(e) => setNewTab({ ...newTab, name: e.target.value })}
                placeholder="e.g. Getting Started"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tab-id">Tab ID</Label>
              <Input 
                id="tab-id" 
                value={newTab.tab_id} 
                onChange={(e) => setNewTab({ ...newTab, tab_id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                placeholder="e.g. getting-started"
              />
              <p className="text-xs text-muted-foreground">
                Use lowercase letters, numbers, and dashes only. This ID is used in URLs.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Icon (Lucide Icon Name)</Label>
              <Input 
                id="icon" 
                value={newTab.icon || ''} 
                onChange={(e) => setNewTab({ ...newTab, icon: e.target.value })}
                placeholder="e.g. book-open"
              />
              <p className="text-xs text-muted-foreground">
                Enter a Lucide icon name to be displayed with this tab.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTabDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateTab}>Create Tab</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tab Dialog */}
      <Dialog open={showEditTabDialog} onOpenChange={setShowEditTabDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tab</DialogTitle>
            <DialogDescription>
              Update the tab details. Changing the Tab ID will affect URLs and may break links.
            </DialogDescription>
          </DialogHeader>
          {currentTab && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Display Name</Label>
                <Input 
                  id="edit-name" 
                  value={currentTab.name} 
                  onChange={(e) => setCurrentTab({ ...currentTab, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tab-id">Tab ID</Label>
                <Input 
                  id="edit-tab-id" 
                  value={currentTab.tab_id} 
                  onChange={(e) => setCurrentTab({ ...currentTab, tab_id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                />
                <p className="text-xs text-muted-foreground">
                  Warning: Changing this ID will affect URLs and may break links.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-icon">Icon (Lucide Icon Name)</Label>
                <Input 
                  id="edit-icon" 
                  value={currentTab.icon || ''} 
                  onChange={(e) => setCurrentTab({ ...currentTab, icon: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditTabDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateTab}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tab Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this tab?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the tab and all associated help content. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTab} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
