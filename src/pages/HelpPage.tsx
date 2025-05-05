
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Mail, MessageSquare, Video, Edit } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as LucideIcons from "lucide-react";

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
  display_order: number;
  section_order: number;
}

interface GroupedHelpContent {
  [tabId: string]: {
    [sectionId: string]: HelpContentItem[];
  };
}

export default function HelpPage() {
  const { isSuperAdmin } = useAuth();
  const [helpContent, setHelpContent] = useState<HelpContentItem[]>([]);
  const [helpTabs, setHelpTabs] = useState<HelpTab[]>([]);
  const [groupedContent, setGroupedContent] = useState<GroupedHelpContent>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("");

  // Fetch tabs and help content from Supabase
  useEffect(() => {
    const fetchHelpData = async () => {
      try {
        setLoading(true);
        
        // Fetch tabs first
        const { data: tabsData, error: tabsError } = await supabase
          .from("help_tabs")
          .select("*")
          .order("display_order", { ascending: true });
        
        if (tabsError) throw tabsError;
        setHelpTabs(tabsData || []);
        
        // Set default active tab if tabs exist
        if (tabsData && tabsData.length > 0) {
          setActiveTab(tabsData[0].tab_id);
        }
        
        // Fetch all content
        const { data, error } = await supabase
          .from("help_content")
          .select("*")
          .order("section_order", { ascending: true })
          .order("display_order", { ascending: true });
        
        if (error) throw error;
        
        setHelpContent(data || []);
        
        // Group the content by tab_id and section_id
        const grouped: GroupedHelpContent = {};
        data?.forEach(item => {
          if (!grouped[item.tab_id]) {
            grouped[item.tab_id] = {};
          }
          if (!grouped[item.tab_id][item.section_id]) {
            grouped[item.tab_id][item.section_id] = [];
          }
          grouped[item.tab_id][item.section_id].push(item);
        });
        
        setGroupedContent(grouped);
      } catch (error: any) {
        toast.error('Error fetching help content: ' + error.message);
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHelpData();
  }, []);

  // Function to render dynamic Lucide icon
  const DynamicIcon = ({ iconName }: { iconName: string }) => {
    const IconComponent = (LucideIcons as any)[iconName];
    
    if (IconComponent) {
      return <IconComponent className="h-6 w-6" />;
    }
    
    // Fallback icon
    return <LucideIcons.HelpCircle className="h-6 w-6" />;
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
        title="Help Center" 
        description="Find answers and resources to help you use the application"
        actions={isSuperAdmin && (
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link to="/admin/help-tabs">
                <Edit className="mr-2 h-4 w-4" /> Manage Tabs
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/help-content">
                <Edit className="mr-2 h-4 w-4" /> Edit Content
              </Link>
            </Button>
          </div>
        )}
      />
      
      {helpTabs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No help content available.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
          <TabsList className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {helpTabs.map(tab => (
              <TabsTrigger key={tab.id} value={tab.tab_id} className="w-full">
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {helpTabs.map(tab => {
            const tabContent = groupedContent[tab.tab_id] || {};
            
            // Special case for Getting Started tab which has a specific layout
            if (tab.tab_id === 'getting-started') {
              return (
                <TabsContent key={tab.id} value={tab.tab_id} className="mt-6 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {(tabContent['welcome']?.[0]?.title) || 'Welcome to the Application'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p>
                        {(tabContent['welcome']?.[0]?.content) || 
                         'This application helps you manage your data through custom objects, fields, and relationships.'}
                      </p>
                      
                      <div className="space-y-4 mt-4">
                        {tabContent['steps']?.map((step, index) => (
                          <div key={step.id} className="flex gap-4 items-start">
                            <div className="bg-primary/10 text-primary font-medium h-8 w-8 rounded-full flex items-center justify-center shrink-0">
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="text-lg font-medium">{step.title}</h3>
                              <p className="text-muted-foreground mt-1">{step.content}</p>
                              {step.section_id === 'create-object' && (
                                <Button variant="link" asChild className="px-0">
                                  <Link to="/settings/object-manager/new">Create Object</Link>
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}

                        {!tabContent['steps'] && (
                          <>
                            <div className="flex gap-4 items-start">
                              <div className="bg-primary/10 text-primary font-medium h-8 w-8 rounded-full flex items-center justify-center shrink-0">1</div>
                              <div>
                                <h3 className="text-lg font-medium">Create Your First Object</h3>
                                <p className="text-muted-foreground mt-1">Go to Settings and access the Object Manager to create your first data object.</p>
                                <Button variant="link" asChild className="px-0">
                                  <Link to="/settings/object-manager/new">Create Object</Link>
                                </Button>
                              </div>
                            </div>
                            <div className="flex gap-4 items-start">
                              <div className="bg-primary/10 text-primary font-medium h-8 w-8 rounded-full flex items-center justify-center shrink-0">2</div>
                              <div>
                                <h3 className="text-lg font-medium">Add Fields to Your Object</h3>
                                <p className="text-muted-foreground mt-1">Define fields to capture the data you need for your object.</p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {tabContent['videos'] && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{tabContent['videos'][0]?.title || 'Quick Video Tutorials'}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                          {tabContent['videos'].slice(0, 4).map((video) => (
                            <div key={video.id} className="border rounded-lg p-4 flex flex-col gap-2">
                              <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                                <Video className="h-10 w-10 text-muted-foreground/60" />
                              </div>
                              <h3 className="font-medium">{video.title}</h3>
                              <p className="text-sm text-muted-foreground">{video.content}</p>
                            </div>
                          ))}

                          {!tabContent['videos'] && (
                            <>
                              <div className="border rounded-lg p-4 flex flex-col gap-2">
                                <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                                  <Video className="h-10 w-10 text-muted-foreground/60" />
                                </div>
                                <h3 className="font-medium">Application Overview</h3>
                                <p className="text-sm text-muted-foreground">Learn about the main features and navigation</p>
                              </div>
                              <div className="border rounded-lg p-4 flex flex-col gap-2">
                                <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                                  <Video className="h-10 w-10 text-muted-foreground/60" />
                                </div>
                                <h3 className="font-medium">Creating Your First Object</h3>
                                <p className="text-sm text-muted-foreground">Step-by-step guide to creating objects</p>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              );
            }
            
            // Special case for FAQ tab which uses accordions
            else if (tab.tab_id === 'faq') {
              return (
                <TabsContent key={tab.id} value={tab.tab_id} className="mt-6 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Frequently Asked Questions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {Object.keys(tabContent).flatMap(sectionId => 
                          tabContent[sectionId].map((item, index) => (
                            <AccordionItem key={item.id} value={`item-${index}`}>
                              <AccordionTrigger>{item.title}</AccordionTrigger>
                              <AccordionContent>{item.content}</AccordionContent>
                            </AccordionItem>
                          ))
                        )}
                        
                        {Object.keys(tabContent).length === 0 && (
                          <>
                            <AccordionItem value="default-1">
                              <AccordionTrigger>What is an object in this application?</AccordionTrigger>
                              <AccordionContent>
                                An object is a database table that stores specific data. For example, a Contact object would store information about people, while an Account object might store information about companies.
                              </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="default-2">
                              <AccordionTrigger>How do I create fields for my object?</AccordionTrigger>
                              <AccordionContent>
                                Navigate to the Object Manager in Settings, select your object, and click on "Fields". From there, you can add new fields by specifying field properties like name, data type, and validation rules.
                              </AccordionContent>
                            </AccordionItem>
                          </>
                        )}
                      </Accordion>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            }
            
            // Special case for Contact tab which has contact cards
            else if (tab.tab_id === 'contact') {
              return (
                <TabsContent key={tab.id} value={tab.tab_id} className="mt-6 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Contact Support</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <p>If you need additional help, our support team is ready to assist you:</p>
                      
                      <div className="grid gap-6 md:grid-cols-3">
                        {tabContent['contact-methods']?.map((method) => (
                          <Card key={method.id} className="border">
                            <CardContent className="pt-6 text-center">
                              {method.section_id === 'email' && <Mail className="h-10 w-10 text-primary mx-auto mb-4" />}
                              {method.section_id === 'chat' && <MessageSquare className="h-10 w-10 text-primary mx-auto mb-4" />}
                              {method.section_id === 'video' && <Video className="h-10 w-10 text-primary mx-auto mb-4" />}
                              
                              <h3 className="font-medium mb-2">{method.title}</h3>
                              <p className="text-sm text-muted-foreground mb-4">{method.content}</p>
                              <Button variant="outline" size="sm">
                                {method.section_id === 'email' && 'support@example.com'}
                                {method.section_id === 'chat' && 'Start Chat'}
                                {method.section_id === 'video' && 'Book Appointment'}
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                        
                        {!tabContent['contact-methods'] && (
                          <>
                            <Card className="border">
                              <CardContent className="pt-6 text-center">
                                <Mail className="h-10 w-10 text-primary mx-auto mb-4" />
                                <h3 className="font-medium mb-2">Email Support</h3>
                                <p className="text-sm text-muted-foreground mb-4">Send us an email anytime</p>
                                <Button variant="outline" size="sm">support@example.com</Button>
                              </CardContent>
                            </Card>
                            <Card className="border">
                              <CardContent className="pt-6 text-center">
                                <MessageSquare className="h-10 w-10 text-primary mx-auto mb-4" />
                                <h3 className="font-medium mb-2">Live Chat</h3>
                                <p className="text-sm text-muted-foreground mb-4">Chat with our support team</p>
                                <Button variant="outline" size="sm">Start Chat</Button>
                              </CardContent>
                            </Card>
                            <Card className="border">
                              <CardContent className="pt-6 text-center">
                                <Video className="h-10 w-10 text-primary mx-auto mb-4" />
                                <h3 className="font-medium mb-2">Video Call</h3>
                                <p className="text-sm text-muted-foreground mb-4">Schedule a support call</p>
                                <Button variant="outline" size="sm">Book Appointment</Button>
                              </CardContent>
                            </Card>
                          </>
                        )}
                      </div>
                      
                      {tabContent['support-hours'] && (
                        <div className="border rounded-lg p-4 bg-muted/50">
                          <h3 className="font-medium mb-2">Support Hours</h3>
                          <p className="text-sm whitespace-pre-line">
                            {tabContent['support-hours'][0]?.content || 
                             'Monday to Friday: 9am - 6pm ET\nWeekend: Limited support for urgent issues'}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            }
            
            // Default case for other tabs - simple cards for each section
            else {
              return (
                <TabsContent key={tab.id} value={tab.tab_id} className="mt-6 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{tab.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        {Object.keys(tabContent).map(sectionId => 
                          tabContent[sectionId].map(item => (
                            <Card key={item.id} className="border">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base">{item.title}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">{item.content}</p>
                                <Button size="sm" variant="outline" className="w-full">Read Guide</Button>
                              </CardContent>
                            </Card>
                          ))
                        )}
                        
                        {Object.keys(tabContent).length === 0 && (
                          <div className="col-span-2 text-center py-4 text-muted-foreground">
                            No content available for this tab.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            }
          })}
        </Tabs>
      )}
    </div>
  );
}
