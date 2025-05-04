
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  screen_name: string | null;
}

interface UserSearchFieldProps {
  selectedUserId: string;
  onSelect: (userId: string) => void;
  label?: string;
  description?: string;
}

export function UserSearchField({
  selectedUserId,
  onSelect,
  label = "Select User",
  description
}: UserSearchFieldProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: profiles, isLoading } = useQuery({
    queryKey: ['user-profiles', searchQuery],
    queryFn: async (): Promise<UserProfile[]> => {
      if (!user) return [];
      
      let query = supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, screen_name');
        
      if (searchQuery) {
        query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,screen_name.ilike.%${searchQuery}%`);
      }
      
      // Don't include the current user
      query = query.neq('id', user.id);
      
      // Limit results for performance
      query = query.limit(10);
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching profiles:', error);
        throw error;
      }
      
      return data as UserProfile[];
    },
    enabled: !!user,
  });

  // Reset search when selection changes
  useEffect(() => {
    if (selectedUserId) {
      setSearchQuery('');
    }
  }, [selectedUserId]);
  
  const handleSelect = (userId: string) => {
    onSelect(userId);
    setSearchQuery('');
  };
  
  const getDisplayName = (profile: UserProfile) => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    
    return profile.screen_name || 'User';
  };
  
  const getInitials = (profile: UserProfile) => {
    const firstInitial = profile.first_name ? profile.first_name.charAt(0) : '';
    const lastInitial = profile.last_name ? profile.last_name.charAt(0) : '';
    
    return (firstInitial + lastInitial).toUpperCase() || profile.screen_name?.charAt(0).toUpperCase() || '?';
  };
  
  // Find the selected user profile
  const selectedUser = profiles?.find(p => p.id === selectedUserId);

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      
      {selectedUser ? (
        <div className="flex items-center justify-between p-2 border rounded-md">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={selectedUser.avatar_url || undefined} />
              <AvatarFallback>{getInitials(selectedUser)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{getDisplayName(selectedUser)}</p>
              {selectedUser.screen_name && selectedUser.first_name && selectedUser.last_name && (
                <p className="text-sm text-muted-foreground">@{selectedUser.screen_name}</p>
              )}
            </div>
          </div>
          <button 
            className="text-sm text-blue-600 hover:underline" 
            onClick={() => onSelect('')}
          >
            Change
          </button>
        </div>
      ) : (
        <Command className="rounded-md border">
          <CommandInput 
            placeholder="Search users..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? (
                <div className="flex items-center justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2">Searching...</span>
                </div>
              ) : (
                'No users found'
              )}
            </CommandEmpty>
            <CommandGroup>
              {profiles?.map((profile) => (
                <CommandItem 
                  key={profile.id}
                  onSelect={() => handleSelect(profile.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">{getInitials(profile)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p>{getDisplayName(profile)}</p>
                      {profile.screen_name && profile.first_name && profile.last_name && (
                        <p className="text-xs text-muted-foreground">@{profile.screen_name}</p>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      )}
    </div>
  );
}
