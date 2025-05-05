
import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Save, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

interface HelpContentItem {
  id: string;
  tab_id: string;
  section_id: string;
  title: string;
  content: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export default function HelpContentEditor() {
  const [helpContent, setHelpContent] = useState<HelpContentItem[]>([]);
  const [activeTab, setActiveTab] = useState('getting-started');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedContent, setEditedContent] = useState<Record<string, HelpContentItem>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<HelpContentItem | null>(null);
  const [newItemDialogOpen, setNewItemDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<HelpContentItem>>({
    tab_id: 'getting-started',
    section_id: '',
    title: '',
    content: '',
    display_order: 0
  });
  
  const navigate = useNavigate();

  const tabOptions = [
    { id: 'getting-started', name: 'Getting Started' },
    { id: 'guides', name: 'Feature Guides' },
    { id: 'faq', name: 'FAQ' },
    { id: 'contact', name: 'Contact Support' }
  ];

  // Fetch help content from Supabase
  useEffect(() => {
    const fetchHelpContent = async () => {
      try {
        const { data, error } = await supabase
          .from('help_content')
          .select('*')
          .order('display_order', { ascending: true });
        
        if (error) {
          toast.error('Error fetching help content: ' + error.message);
          throw error;
        }
        
        setHelpContent(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHelpContent();
  }, []);

  // Handle editing content
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

  // Save changes to database
  const saveChanges = async () => {
    setSaving(true);
    try {
      // Update each edited item
      for (const id in editedContent) {
        const item = editedContent[id];
        const { error } = await supabase
          .from('help_content')
          .update({
            title: item.title,
            content: item.content,
            display_order: item.display_order,
            section_id: item.section_id
          })
          .eq('id', id);
        
        if (error) {
          toast.error(`Error updating item ${item.title}: ${error.message}`);
          throw error;
        }
      }
      
      toast.success('Help content updated successfully');
      
      // Refresh the content
      const { data, error } = await supabase
        .from('help_content')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      
      setHelpContent(data || []);
      setEditedContent({});
    } catch (error) {
      console.error('Error saving changes:', error);
    } finally {
      setSaving(false);
    }
  };

  // Handle deleting an item
  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      const { error } = await supabase
        .from('help_content')
        .delete()
        .eq('id', itemToDelete.id);
      
      if (error) {
        toast.error('Error deleting item: ' + error.message);
        throw error;
      }
      
      toast.success('Item deleted successfully');
      
      // Update local state
      setHelpContent(helpContent.filter(item => item.id !== itemToDelete.id));
      
      // Close dialog
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Handle adding a new item
  const handleAddItem = async () => {
    try {
      const { data, error } = await supabase
        .from('help_content')
        .insert([{
          tab_id: newItem.tab_id,
          section_id: newItem.section_id,
          title: newItem.title,
          content: newItem.content,
          display_order: newItem.display_order
        }])
        .select();
      
      if (error) {
        toast.error('Error adding new item: ' + error.message);
        throw error;
      }
      
      toast.success('New help content item added successfully');
      
      // Update local state
      if (data) {
        setHelpContent([...helpContent, ...data]);
        // Set active tab to the tab of the newly added item
        setActiveTab(data[0].tab_id);
      }
      
      // Reset form and close dialog
      setNewItem({
        tab_id: 'getting-started',
        section_id: '',
        title: '',
        content: '',
        display_order: 0
      });
      setNewItemDialogOpen(false);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredContent = helpContent.filter(item => item.tab_id === activeTab);

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
        description="Edit the content displayed in the help center"
        backTo="/admin"
        actions={
          <div className="flex gap-2">
            <Button
              onClick={() => setNewItemDialogOpen(true)}
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
          <CardTitle>Edit Help Content</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {tabOptions.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id} className="w-full">
                  {tab.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {tabOptions.map(tab => (
              <TabsContent key={tab.id} value={tab.id} className="space-y-6 mt-6">
                {filteredContent.length > 0 ? (
                  filteredContent.map(item => (
                    <Card key={item.id} className="relative">
                      <CardHeader className="pb-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-2 text-destructive"
                          onClick={() => {
                            setItemToDelete(item);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
                            <Label htmlFor={`order-${item.id}`}>Display Order</Label>
                            <Input
                              id={`order-${item.id}`}
                              type="number"
                              value={editedContent[item.id]?.display_order ?? item.display_order}
                              onChange={(e) => handleContentChange(item, 'display_order', parseInt(e.target.value))}
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
                          <Label htmlFor={`content-${item.id}`}>Content</Label>
                          <Textarea
                            id={`content-${item.id}`}
                            rows={5}
                            value={editedContent[item.id]?.content ?? item.content}
                            onChange={(e) => handleContentChange(item, 'content', e.target.value)}
                            className="min-h-[150px]"
                          />
                        </div>
                      </CardContent>
                      <CardFooter className="border-t pt-4 text-xs text-muted-foreground">
                        Last updated: {new Date(item.updated_at).toLocaleString()}
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No content found for this tab. Click "Add Item" to create one.
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{itemToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Item Dialog */}
      <Dialog open={newItemDialogOpen} onOpenChange={setNewItemDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Help Content Item</DialogTitle>
            <DialogDescription>
              Create a new help content item that will appear in the help center.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-tab">Tab</Label>
                <select 
                  id="new-tab"
                  className="w-full p-2 border rounded-md"
                  value={newItem.tab_id}
                  onChange={(e) => setNewItem({...newItem, tab_id: e.target.value})}
                >
                  {tabOptions.map(tab => (
                    <option key={tab.id} value={tab.id}>{tab.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-order">Display Order</Label>
                <Input
                  id="new-order"
                  type="number"
                  value={newItem.display_order}
                  onChange={(e) => setNewItem({...newItem, display_order: parseInt(e.target.value)})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-section">Section ID</Label>
              <Input
                id="new-section"
                value={newItem.section_id}
                onChange={(e) => setNewItem({...newItem, section_id: e.target.value})}
                placeholder="Unique identifier for this section"
              />
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
              <Textarea
                id="new-content"
                rows={5}
                value={newItem.content}
                onChange={(e) => setNewItem({...newItem, content: e.target.value})}
                placeholder="Content of the help item"
                className="min-h-[150px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewItemDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddItem}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
