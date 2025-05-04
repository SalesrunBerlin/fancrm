
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  screen_name: string | null;
  avatar_url: string | null;
}

interface UserSearchFieldProps {
  onSelect: (user: User) => void;
  selectedUserId?: string;
  placeholder?: string;
  excludeCurrentUser?: boolean;
}

export function UserSearchField({
  onSelect,
  selectedUserId,
  placeholder = 'Search users...',
  excludeCurrentUser = true
}: UserSearchFieldProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { user: currentUser } = useAuth();

  // Search for users
  useEffect(() => {
    if (searchTerm.length < 2) return; // Require at least 2 characters
    
    const searchUsers = async () => {
      setIsLoading(true);
      try {
        // Search by first name, last name, or screen name
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, screen_name, avatar_url')
          .or(`first_name.ilike.%${searchTerm}%, last_name.ilike.%${searchTerm}%, screen_name.ilike.%${searchTerm}%`)
          .limit(10);
        
        if (error) throw error;
        
        // Filter out current user if needed
        let filteredUsers = data as User[];
        if (excludeCurrentUser && currentUser) {
          filteredUsers = filteredUsers.filter(user => user.id !== currentUser.id);
        }
        
        setUsers(filteredUsers);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    searchUsers();
  }, [searchTerm, excludeCurrentUser, currentUser]);

  // Fetch selected user details on load if we have an ID
  useEffect(() => {
    if (selectedUserId && !selectedUser) {
      const getUser = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, screen_name, avatar_url')
            .eq('id', selectedUserId)
            .single();
          
          if (error) throw error;
          setSelectedUser(data);
        } catch (error) {
          console.error('Error fetching selected user:', error);
        }
      };
      
      getUser();
    }
  }, [selectedUserId, selectedUser]);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    onSelect(user);
    setOpen(false);
  };

  const getDisplayName = (user: User | null) => {
    if (!user) return '';
    return user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.screen_name || 'User';
  };

  const getInitials = (user: User | null) => {
    if (!user) return '';
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return (user.screen_name?.[0] || 'U').toUpperCase();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex items-center space-x-4 w-full border rounded-md p-2 cursor-pointer">
          {selectedUser ? (
            <>
              <Avatar className="h-8 w-8">
                <AvatarImage src={selectedUser.avatar_url || undefined} alt={getDisplayName(selectedUser)} />
                <AvatarFallback>{getInitials(selectedUser)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-sm">{getDisplayName(selectedUser)}</div>
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start" sideOffset={5}>
        <Command>
          <Input
            placeholder="Search users..."
            className="border-none focus:ring-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <CommandList>
            {isLoading && (
              <CommandEmpty>Loading...</CommandEmpty>
            )}
            {!isLoading && users.length === 0 && (
              <CommandEmpty>No users found</CommandEmpty>
            )}
            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => handleSelectUser(user)}
                  className="flex items-center gap-2"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.avatar_url || undefined} alt={getDisplayName(user)} />
                    <AvatarFallback>{getInitials(user)}</AvatarFallback>
                  </Avatar>
                  <span>{getDisplayName(user)}</span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedUserId === user.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
