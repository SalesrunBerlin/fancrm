
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Mail, MessageSquare, Video } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Help Center" 
        description="Find answers and resources to help you use the application"
      />
      
      <Tabs defaultValue="getting-started" className="max-w-4xl mx-auto">
        <TabsList className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          <TabsTrigger value="getting-started" className="w-full">Getting Started</TabsTrigger>
          <TabsTrigger value="guides" className="w-full">Feature Guides</TabsTrigger>
          <TabsTrigger value="faq" className="w-full">FAQ</TabsTrigger>
          <TabsTrigger value="contact" className="w-full">Contact Support</TabsTrigger>
        </TabsList>
        
        <TabsContent value="getting-started" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to the Application</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                This application helps you manage your data through custom objects, fields, and relationships. 
                Follow these steps to get started:
              </p>
              
              <div className="space-y-4 mt-4">
                <div className="flex gap-4 items-start">
                  <div className="bg-primary/10 text-primary font-medium h-8 w-8 rounded-full flex items-center justify-center shrink-0">1</div>
                  <div>
                    <h3 className="text-lg font-medium">Create Your First Object</h3>
                    <p className="text-muted-foreground mt-1">
                      Go to Settings and access the Object Manager to create your first data object.
                    </p>
                    <Button variant="link" asChild className="px-0">
                      <Link to="/settings/object-manager/new">Create Object</Link>
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="bg-primary/10 text-primary font-medium h-8 w-8 rounded-full flex items-center justify-center shrink-0">2</div>
                  <div>
                    <h3 className="text-lg font-medium">Add Fields to Your Object</h3>
                    <p className="text-muted-foreground mt-1">
                      Define fields to capture the data you need for your object.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="bg-primary/10 text-primary font-medium h-8 w-8 rounded-full flex items-center justify-center shrink-0">3</div>
                  <div>
                    <h3 className="text-lg font-medium">Create Records</h3>
                    <p className="text-muted-foreground mt-1">
                      Start adding records to your objects and manage your data.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="bg-primary/10 text-primary font-medium h-8 w-8 rounded-full flex items-center justify-center shrink-0">4</div>
                  <div>
                    <h3 className="text-lg font-medium">Define Relationships</h3>
                    <p className="text-muted-foreground mt-1">
                      Connect your objects through relationships to build a complete data model.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Video Tutorials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="guides" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Guides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Object Manager</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Learn how to create and manage custom objects and fields
                    </p>
                    <Button size="sm" variant="outline" className="w-full">Read Guide</Button>
                  </CardContent>
                </Card>
                
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Applications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Understanding how to create and configure applications
                    </p>
                    <Button size="sm" variant="outline" className="w-full">Read Guide</Button>
                  </CardContent>
                </Card>
                
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Structures</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Creating and managing data structures and relationships
                    </p>
                    <Button size="sm" variant="outline" className="w-full">Read Guide</Button>
                  </CardContent>
                </Card>
                
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Record Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Working with records and data in your objects
                    </p>
                    <Button size="sm" variant="outline" className="w-full">Read Guide</Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="faq" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>What is an object in this application?</AccordionTrigger>
                  <AccordionContent>
                    An object is a database table that stores specific data. For example, a Contact object would store information about people, while an Account object might store information about companies.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2">
                  <AccordionTrigger>How do I create fields for my object?</AccordionTrigger>
                  <AccordionContent>
                    Navigate to the Object Manager in Settings, select your object, and click on "Fields". From there, you can add new fields by specifying field properties like name, data type, and validation rules.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-3">
                  <AccordionTrigger>Can I import data into the system?</AccordionTrigger>
                  <AccordionContent>
                    Yes, you can import data using CSV files. Go to an object's record list page and look for the Import option in the actions menu.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-4">
                  <AccordionTrigger>How do relationships between objects work?</AccordionTrigger>
                  <AccordionContent>
                    Relationships define how objects are connected to each other. For example, a Contact might belong to an Account. You can create lookup relationships between objects to establish these connections.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-5">
                  <AccordionTrigger>What are Applications in the system?</AccordionTrigger>
                  <AccordionContent>
                    Applications are collections of objects grouped together for a specific business purpose. You can assign objects to applications to organize them in a way that makes sense for your users.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="contact" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p>If you need additional help, our support team is ready to assist you:</p>
              
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="border">
                  <CardContent className="pt-6 text-center">
                    <Mail className="h-10 w-10 text-primary mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Email Support</h3>
                    <p className="text-sm text-muted-foreground mb-4">Send us an email anytime</p>
                    <Button variant="outline" size="sm">
                      support@example.com
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="border">
                  <CardContent className="pt-6 text-center">
                    <MessageSquare className="h-10 w-10 text-primary mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Live Chat</h3>
                    <p className="text-sm text-muted-foreground mb-4">Chat with our support team</p>
                    <Button variant="outline" size="sm">
                      Start Chat
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="border">
                  <CardContent className="pt-6 text-center">
                    <Video className="h-10 w-10 text-primary mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Video Call</h3>
                    <p className="text-sm text-muted-foreground mb-4">Schedule a support call</p>
                    <Button variant="outline" size="sm">
                      Book Appointment
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              <div className="border rounded-lg p-4 bg-muted/50">
                <h3 className="font-medium mb-2">Support Hours</h3>
                <p className="text-sm">Monday to Friday: 9am - 6pm ET</p>
                <p className="text-sm">Weekend: Limited support for urgent issues</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
