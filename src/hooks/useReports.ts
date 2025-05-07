
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Report } from "@/types/report";

export function useReports() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const fetchReports = async (): Promise<Report[]> => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
    
    return data || [];
  };
  
  const { data: reports, isLoading, error } = useQuery({
    queryKey: ['reports'],
    queryFn: fetchReports,
    enabled: !!user,
  });
  
  const createReport = useMutation({
    mutationFn: async (reportData: Omit<Report, 'id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('reports')
        .insert({
          ...reportData,
          owner_id: user.id,
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Report created successfully');
    },
    onError: (error: any) => {
      toast.error(`Error creating report: ${error.message}`);
    },
  });
  
  const updateReport = useMutation({
    mutationFn: async ({ id, ...reportData }: { id: string } & Partial<Report>) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('reports')
        .update(reportData)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Report updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Error updating report: ${error.message}`);
    },
  });
  
  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Report deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Error deleting report: ${error.message}`);
    },
  });
  
  return {
    reports,
    isLoading,
    error,
    createReport,
    updateReport,
    deleteReport,
  };
}
