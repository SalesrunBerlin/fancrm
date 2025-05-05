import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Plus, Save, Trash2, ArrowUpDown, Eye } from "lucide-react";
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
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ContentPreview } from "@/components/ui/content-preview";

interface HelpTab {
  id: string;
  name: string;
  tab_id: string;
  icon: string | null;
  display_order: number;
}

interface HelpContentItem {
  id: string;
  tab_id: string;
  section_id: string;
  title: string;
  content: string;
  content_html: string;
  display_order: number;
  section_order: number;
  created_at: string;
  updated_at: string;
}

export default function HelpTabContentEditor() {
  const { tabId } = useParams<{ tabId: string }>();
  const [tab, setTab] = useState<HelpTab | null>(null);
  const [contentItems, setContentItems] = useState<HelpContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNewItemDialog, setShowNewItemDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<HelpContentItem | null>(null);
  const [editedContent, setEditedContent] = useState<Record<string, HelpContentItem>>({});
  const [newItem, setNewItem] = useState<Partial<HelpContentItem>>({
    tab_id: tabId || '',
    section_id: '',
    title: '',
    content: '',
    content_html: '',
    display_order: 0,
    section_order: 0
  });
  const [previewItem, setPreviewItem] = useState<HelpContentItem | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [activeEditorTab, setActiveEditorTab] = useState<Record<string, "edit" | "preview">>({});
  
  const navigate = useNavigate();

  // Fetch tab and content
  useEffect(() => {
    if (!tabId) {
      navigate("/admin/help-tabs");
      return;
    }
    
    fetchTabAndContent();
  }, [tabId, navigate]);

  const fetchTabAndContent = async () => {
    try {
      setLoading(true);
      
      // Fetch tab information
      const { data: tabData, error: tabError } = await supabase
        .from("help_tabs")
        .select("*")
        .eq("tab_id", tabId)
        .single();
      
      if (tabError) throw tabError;
      setTab(tabData);
      
      // Fetch content items for this tab
      const { data: contentData, error: contentError } = await supabase
        .from("help_content")
        .select("*")
        .eq("tab_id", tabId)
        .order("section_id", { ascending: true })
        .order("section_order", { ascending: true })
        .order("display_order", { ascending: true });
      
      if (contentError) throw contentError;
      setContentItems(contentData || []);
      
      // Initialize tabs for each content item
      const initialTabStates: Record<string, "edit" | "preview"> = {};
      contentData?.forEach(item => {
        initialTabStates[item.id] = "edit";
      });
      setActiveEditorTab(initialTabStates);
      
    } catch (error: any) {
      toast.error("Failed to load content", {
        description: error.message
      });
      console.error("Error fetching tab content:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (item: HelpContentItem, field: keyof HelpContentItem, value: string | number) => {
    const updatedItem = { 
      ...item, 
      [field]: value 
    };
    
    setEditedContent({
      ...editedContent,
      [item.id]: updatedItem
    });
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      // Update each edited item
      for (const id in editedContent) {
        const item = editedContent[id];
        const { error } = await supabase
          .from("help_content")
          .update({
            title: item.title,
            content: item.content,
            content_html: item.content_html,
            display_order: item.display_order,
            section_id: item.section_id,
            section_order: item.section_order
          })
          .eq("id", id);
        
        if (error) {
          toast.error(`Error updating item ${item.title}: ${error.message}`);
          throw error;
        }
      }
      
      toast.success("Help content updated successfully");
      
      // Refresh content
      fetchTabAndContent();
      setEditedContent({});
    } catch (error: any) {
      console.error("Error saving changes:", error);
      toast.error("Failed to save changes", {
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async () => {
    try {
      const { data, error } = await supabase
        .from("help_content")
        .insert([{
          tab_id: tabId,
          section_id: newItem.section_id,
          title: newItem.title,
          content: newItem.content,
          content_html: newItem.content_html || newItem.content, // Use HTML content if available, otherwise fallback to plain text
          display_order: contentItems.length > 0 
            ? Math.max(...contentItems.map(item => item.display_order)) + 1 
            : 0,
          section_order: newItem.section_order || 0
        }])
        .select();
      
      if (error) throw error;
      
      toast.success("New help content item added successfully");
      
      if (data) {
        setContentItems([...contentItems, ...data]);
      }
      
      setNewItem({
        tab_id: tabId || '',
        section_id: '',
        title: '',
        content: '',
        content_html: '',
        display_order: 0,
        section_order: 0
      });
      setShowNewItemDialog(false);
      
      // Refresh to ensure we have the latest ordering
      fetchTabAndContent();
    } catch (error: any) {
      toast.error("Failed to add item", {
        description: error.message
      });
      console.error("Error adding item:", error);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      const { error } = await supabase
        .from("help_content")
        .delete()
        .eq("id", itemToDelete.id);
      
      if (error) throw error;
      
      toast.success("Item deleted successfully");
      
      // Update local state
      setContentItems(contentItems.filter(item => item.id !== itemToDelete.id));
      
      // Close dialog
      setShowDeleteDialog(false);
      setItemToDelete(null);
    } catch (error: any) {
      toast.error("Failed to delete item", {
        description: error.message
      });
      console.error("Error deleting item:", error);
    }
  };

  const handleMoveItem = async (item: HelpContentItem, direction: 'up' | 'down') => {
    // Find items in the same section
    const sectionItems = contentItems.filter(i => i.section_id === item.section_id)
      .sort((a, b) => a.section_order - b.section_order);
    
    const currentIndex = sectionItems.findIndex(i => i.id === item.id);
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === sectionItems.length - 1)
    ) {
      return; // Already at the edge
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const otherItem = sectionItems[newIndex];
    
    try {
      // Update first item
      const { error: error1 } = await supabase
        .from("help_content")
        .update({ section_order: otherItem.section_order })
        .eq("id", item.id);
        
      if (error1) throw error1;
      
      // Update second item
      const { error: error2 } = await supabase
        .from("help_content")
        .update({ section_order: item.section_order })
        .eq("id", otherItem.id);
        
      if (error2) throw error2;

      toast.success("Item order updated");
      
      // Refresh to ensure we have the latest ordering
      fetchTabAndContent();
    } catch (error: any) {
      toast.error("Failed to update item order", {
        description: error.message
      });
      console.error("Error updating item order:", error);
    }
  };

  const toggleEditorTab = (itemId: string, tab: "edit" | "preview") => {
    setActiveEditorTab(prev => ({
      ...prev,
      [itemId]: tab
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tab) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Tab Not Found" 
          description="The requested tab could not be found"
          backTo="/admin/help-tabs"
        />
        <Card>
          <CardContent className="text-center py-8">
            The tab you're looking for doesn't exist. Return to the tab management page to see all available tabs.
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group content by section_id
  const groupedContent: Record<string, HelpContentItem[]> = {};
  contentItems.forEach(item => {
    if (!groupedContent[item.section_id]) {
      groupedContent[item.section_id] = [];
    }
    groupedContent[item.section_id].push(item);
  });

  // Sort sections by the lowest display_order item in each
  const sortedSections = Object.keys(groupedContent).sort((a, b) => {
    const aMinOrder = Math.min(...groupedContent[a].map(item => item.display_order));
    const bMinOrder = Math.min(...groupedContent[b].map(item => item.display_order));
    return aMinOrder - bMinOrder;
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Edit Content: ${tab.name}`}
        description={`Manage content for the "${tab.name}" tab (ID: ${tab.tab_id})`}
        backTo="/admin/help-content"
        actions={
          <div className="flex gap-2">
            <Button
              onClick={() => setShowNewItemDialog(true)}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
            <Button 
              onClick={saveChanges} 
              disabled={Object.keys(editedContent).length === 0 || saving}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Help Content Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {sortedSections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No content found for this tab. Click "Add Item" to create one.
            </div>
          ) : (
            sortedSections.map(sectionId => (
              <div key={sectionId} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium border-b pb-1">
                    Section: {sectionId}
                  </h3>
                </div>
                
                {groupedContent[sectionId].map((item, index) => (
                  <Card key={item.id} className="relative">
                    <CardHeader className="pb-2 flex flex-row items-start justify-between">
                      <h4 className="text-base font-medium">{item.title}</h4>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={index === 0}
                          onClick={() => handleMoveItem(item, 'up')}
                        >
                          <ArrowUpDown className="h-4 w-4 rotate-90" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={index === groupedContent[sectionId].length - 1}
                          onClick={() => handleMoveItem(item, 'down')}
                        >
                          <ArrowUpDown className="h-4 w-4 -rotate-90" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setPreviewItem(item);
                            setShowPreviewDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            setItemToDelete(item);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`section-${item.id}`}>Section ID</Label>
                          <Input
                            id={`section-${item.id}`}
                            value={editedContent[item.id]?.section_id ?? item.section_id}
                            onChange={(e) => handleContentChange(item, 'section_id', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`order-${item.id}`}>Section Order</Label>
                          <Input
                            id={`order-${item.id}`}
                            type="number"
                            value={editedContent[item.id]?.section_order ?? item.section_order}
                            onChange={(e) => handleContentChange(item, 'section_order', parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`title-${item.id}`}>Title</Label>
                        <Input
                          id={`title-${item.id}`}
                          value={editedContent[item.id]?.title ?? item.title}
                          onChange={(e) => handleContentChange(item, 'title', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Content</Label>
                        <Tabs 
                          value={activeEditorTab[item.id] || "edit"} 
                          onValueChange={(value) => toggleEditorTab(item.id, value as "edit" | "preview")}
                          className="w-full"
                        >
                          <TabsList className="grid grid-cols-2 w-32 mb-2">
                            <TabsTrigger value="edit">Edit</TabsTrigger>
                            <TabsTrigger value="preview">Preview</TabsTrigger>
                          </TabsList>
                          <TabsContent value="edit" className="mt-0">
                            <RichTextEditor
                              value={editedContent[item.id]?.content_html ?? item.content_html || item.content}
                              onChange={(value) => {
                                handleContentChange(item, 'content_html', value);
                                // Keep the plain text version updated as a fallback
                                const plainText = value.replace(/<[^>]+>/g, '');
                                handleContentChange(item, 'content', plainText);
                              }}
                              className="min-h-[150px]"
                            />
                          </TabsContent>
                          <TabsContent value="preview" className="mt-0 border rounded-md p-4 min-h-[150px]">
                            <ContentPreview 
                              content={editedContent[item.id]?.content_html ?? item.content_html || item.content}
                            />
                          </TabsContent>
                        </Tabs>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4 text-xs text-muted-foreground">
                      Last updated: {new Date(item.updated_at).toLocaleString()}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Add New Item Dialog */}
      <Dialog open={showNewItemDialog} onOpenChange={setShowNewItemDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Help Content Item</DialogTitle>
            <DialogDescription>
              Create a new help content item for the "{tab.name}" tab.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-section">Section ID</Label>
              <Input
                id="new-section"
                value={newItem.section_id}
                onChange={(e) => setNewItem({...newItem, section_id: e.target.value})}
                placeholder="Unique identifier for this section"
              />
              <p className="text-xs text-muted-foreground">
                Group content items by section ID for organization.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-section-order">Section Order</Label>
              <Input
                id="new-section-order"
                type="number"
                value={newItem.section_order}
                onChange={(e) => setNewItem({...newItem, section_order: parseInt(e.target.value)})}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Order within the section (lower numbers appear first).
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-title">Title</Label>
              <Input
                id="new-title"
                value={newItem.title}
                onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                placeholder="Title of the help item"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-content">Content</Label>
              <Tabs defaultValue="edit" className="w-full">
                <TabsList className="grid grid-cols-2 w-32 mb-2">
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="edit" className="mt-0">
                  <RichTextEditor
                    value={newItem.content_html || ""}
                    onChange={(value) => {
                      setNewItem({
                        ...newItem, 
                        content_html: value,
                        content: value.replace(/<[^>]+>/g, '') // Store a plain text version
                      });
                    }}
                    minHeight="200px"
                  />
                </TabsContent>
                <TabsContent value="preview" className="mt-0 border rounded-md p-4 min-h-[200px]">
                  <ContentPreview content={newItem.content_html || ""} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewItemDialog(false)}>Cancel</Button>
            <Button onClick={handleAddItem}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Content Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto border rounded-lg p-4 my-4">
            {previewItem && (
              <ContentPreview 
                content={
                  editedContent[previewItem.id]?.content_html || 
                  previewItem.content_html || 
                  previewItem.content
                } 
              />
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPreviewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
