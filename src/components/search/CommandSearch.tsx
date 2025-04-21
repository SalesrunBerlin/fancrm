
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useAccounts } from "@/hooks/useAccounts";
import { useContacts } from "@/hooks/useContacts";
import { useDeals } from "@/hooks/useDeals";
import { Account, Contact, DealType } from "@/types";
import { Search, Clock, History } from "lucide-react";

type SearchHistoryItem = {
  id: string;
  type: "contact" | "account" | "deal";
  name: string;
  path: string;
  timestamp: number;
};

export function CommandSearch({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const { data: accounts = [] } = useAccounts();
  const { data: contacts = [] } = useContacts();
  const { data: deals = [] } = useDeals();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  // Load search history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("searchHistory");
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse search history:", e);
        localStorage.removeItem("searchHistory");
      }
    }
  }, []);

  // Filter results based on search query
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${contact.firstName} ${contact.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const filteredAccounts = accounts.filter((account) =>
    account.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDeals = deals.filter((deal) =>
    deal.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add item to search history
  const addToHistory = (
    item: Account | Contact | DealType,
    type: "contact" | "account" | "deal"
  ) => {
    const newHistoryItem: SearchHistoryItem = {
      id: item.id,
      type,
      name:
        type === "contact"
          ? `${(item as Contact).firstName} ${(item as Contact).lastName}`
          : item.name,
      path: `/${type}s/${item.id}`,
      timestamp: Date.now(),
    };

    setSearchHistory((prev) => {
      // Remove if exists already
      const filtered = prev.filter(
        (h) => !(h.id === item.id && h.type === type)
      );
      // Add to the beginning (most recent)
      const newHistory = [newHistoryItem, ...filtered.slice(0, 9)]; // Keep only last 10
      // Save to localStorage
      localStorage.setItem("searchHistory", JSON.stringify(newHistory));
      return newHistory;
    });
  };

  // Handle selection
  const handleSelect = (
    item: Account | Contact | DealType,
    type: "contact" | "account" | "deal"
  ) => {
    setOpen(false);
    addToHistory(item, type);
    navigate(`/${type}s/${item.id}`);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search contacts, accounts, deals..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {searchHistory.length > 0 && searchQuery === "" && (
          <>
            <CommandGroup heading="Recently Viewed">
              {searchHistory.map((item) => (
                <CommandItem
                  key={`${item.type}-${item.id}`}
                  onSelect={() => navigate(item.path)}
                  className="flex items-center"
                >
                  <History className="mr-2 h-4 w-4" />
                  <span>{item.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {item.type}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {filteredContacts.length > 0 && (
          <CommandGroup heading="Contacts">
            {filteredContacts.slice(0, 5).map((contact) => (
              <CommandItem
                key={contact.id}
                onSelect={() => handleSelect(contact, "contact")}
              >
                <Search className="mr-2 h-4 w-4" />
                {contact.firstName} {contact.lastName}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredAccounts.length > 0 && (
          <CommandGroup heading="Accounts">
            {filteredAccounts.slice(0, 5).map((account) => (
              <CommandItem
                key={account.id}
                onSelect={() => handleSelect(account, "account")}
              >
                <Search className="mr-2 h-4 w-4" />
                {account.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredDeals.length > 0 && (
          <CommandGroup heading="Deals">
            {filteredDeals.slice(0, 5).map((deal) => (
              <CommandItem
                key={deal.id}
                onSelect={() => handleSelect(deal, "deal")}
              >
                <Search className="mr-2 h-4 w-4" />
                {deal.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
