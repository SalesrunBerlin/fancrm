
import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface DataPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  filteredItemsCount?: number;  // Added new prop for filtered count
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  showFilterStatus?: boolean;  // Show filter status indicator
}

export function DataPagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  filteredItemsCount,  // New prop
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className = "",
  showFilterStatus = false  // Default to false
}: DataPaginationProps) {
  // Use filteredItemsCount if provided, otherwise use totalItems
  const displayCount = typeof filteredItemsCount === 'number' ? filteredItemsCount : totalItems;
  const startItem = Math.min(displayCount, (currentPage - 1) * pageSize + 1);
  const endItem = Math.min(displayCount, currentPage * pageSize);
  
  // Enhanced pagination with visible page numbers
  const getPageNumbers = () => {
    const visiblePages = 5; // Show 5 pages at a time
    let startPage = Math.max(1, currentPage - Math.floor(visiblePages / 2));
    let endPage = startPage + visiblePages - 1;
    
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - visiblePages + 1);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };
  
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between px-2 ${className}`}>
      <div className="flex items-center space-x-6 mb-2 sm:mb-0">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Rows per page</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(val) => onPageSizeChange(parseInt(val))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize.toString()} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {displayCount > 0 ? (
            <>
              {startItem}-{endItem} of {displayCount}
              {showFilterStatus && filteredItemsCount !== undefined && filteredItemsCount !== totalItems && (
                <span className="ml-1 text-xs">(filtered from {totalItems})</span>
              )}
            </>
          ) : (
            "No items"
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-1 sm:space-x-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
        >
          <ChevronsLeft className="h-4 w-4" />
          <span className="sr-only">First page</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous page</span>
        </Button>
        
        {/* Visible page numbers */}
        <div className="hidden sm:flex items-center space-x-1">
          {getPageNumbers().map((pageNum) => (
            <Button
              key={pageNum}
              variant={pageNum === currentPage ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </Button>
          ))}
        </div>
        
        {/* For mobile, just show current/total */}
        <div className="sm:hidden text-sm font-medium px-2">
          Page {currentPage} of {Math.max(1, totalPages)}
        </div>
        
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next page</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
          <span className="sr-only">Last page</span>
        </Button>
      </div>
    </div>
  );
}
