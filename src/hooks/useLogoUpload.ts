
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { v4 as uuidv4 } from "uuid";

export function useLogoUpload() {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  
  const uploadLogo = async (file: File): Promise<string> => {
    if (!user) {
      throw new Error("User must be authenticated to upload a logo");
    }
    
    setIsUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `icons/custom/${user.id}/${fileName}`;
      
      const { error: uploadError } = await supabase
        .storage
        .from('theme_assets')
        .upload(filePath, file);
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get public URL for the uploaded file
      const { data } = supabase
        .storage
        .from('theme_assets')
        .getPublicUrl(filePath);
        
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };
  
  return {
    uploadLogo,
    isUploading
  };
}
