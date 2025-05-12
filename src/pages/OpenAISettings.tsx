
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ApiKeyManager } from '@/components/ai/ApiKeyManager';
import { ExternalLink, Plug } from 'lucide-react';

export default function OpenAISettings() {
  const { user } = useAuth();
  const [usageStats, setUsageStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUsageStats = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        // Get current day's usage
        const { data: todayData, error: todayError } = await supabase
          .from('openai_usage_profile')
          .select('prompt_tokens, completion_tokens, day')
          .eq('profile_id', user.id)
          .eq('day', new Date().toISOString().split('T')[0])
          .single();
          
        if (todayError && todayError.code !== 'PGRST116') { // Not found is ok
          console.error('Error fetching today usage:', todayError);
        }

        // Get total usage (sum of all days)
        const { data: totalData, error: totalError } = await supabase
          .from('openai_usage_profile')
          .select('prompt_tokens, completion_tokens')
          .eq('profile_id', user.id);
          
        if (totalError) {
          console.error('Error fetching total usage:', totalError);
        }

        // Calculate total from all records
        const totalPrompt = totalData?.reduce((sum, record) => sum + (record.prompt_tokens || 0), 0) || 0;
        const totalCompletion = totalData?.reduce((sum, record) => sum + (record.completion_tokens || 0), 0) || 0;

        setUsageStats({
          today: todayData || { prompt_tokens: 0, completion_tokens: 0 },
          total: {
            prompt_tokens: totalPrompt,
            completion_tokens: totalCompletion,
            records: totalData?.length || 0
          }
        });
      } catch (error) {
        console.error('Error fetching usage stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsageStats();
  }, [user]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="container py-6 space-y-6">
      <PageHeader
        title="OpenAI Settings"
        description="Manage your OpenAI API key and view usage statistics"
      />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>API Connections</CardTitle>
              <CardDescription>Manage all your API connections in one place</CardDescription>
            </div>
            <Button asChild>
              <Link to="/connections">
                <Plug className="h-4 w-4 mr-2" />
                Manage Connections
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            We've improved our connections management! You can now configure and manage all your API connections, including OpenAI,
            in the dedicated Connections page. This gives you a centralized place to organize all your integrations.
          </p>
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link to="/connections">
                <Plug className="h-4 w-4 mr-2" />
                Go to Connections
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ApiKeyManager />
        
        <Card>
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
            <CardDescription>Your OpenAI API usage</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : usageStats ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Today's Usage</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-sm font-medium text-muted-foreground">Prompt Tokens</div>
                      <div className="text-2xl font-bold">{formatNumber(usageStats.today.prompt_tokens)}</div>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-sm font-medium text-muted-foreground">Completion Tokens</div>
                      <div className="text-2xl font-bold">{formatNumber(usageStats.today.completion_tokens)}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium">Total Usage</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-sm font-medium text-muted-foreground">Prompt Tokens</div>
                      <div className="text-2xl font-bold">{formatNumber(usageStats.total.prompt_tokens)}</div>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-sm font-medium text-muted-foreground">Completion Tokens</div>
                      <div className="text-2xl font-bold">{formatNumber(usageStats.total.completion_tokens)}</div>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  Based on {usageStats.total.records} days of usage data
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No usage data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>External Resources</CardTitle>
            <CardDescription>Helpful links for using the OpenAI API</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://platform.openai.com/docs" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center"
                >
                  OpenAI API Documentation
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </li>
              <li>
                <a 
                  href="https://platform.openai.com/account/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center"
                >
                  Get your API key from OpenAI
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </li>
              <li>
                <a 
                  href="https://platform.openai.com/account/usage" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center"
                >
                  OpenAI Usage Dashboard
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
