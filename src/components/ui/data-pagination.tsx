
import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface DataPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems?: number;
  filteredItemsCount?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  showFilterStatus?: boolean;
}

export function DataPagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  filteredItemsCount,
  onPageChange,
  onPageSizeChange,
  showFilterStatus = false
}: DataPaginationProps) {
  const pageSizeOptions = [5, 10, 25, 50, 100];

  // Calculate the range of items we're showing
  const startItem = totalPages > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(startItem + pageSize - 1, filteredItemsCount ?? totalItems ?? 0);

  // Function to generate page numbers to display
  const getPageNumbers = () => {
    const maxPageButtons = 5;
    const pages: (number | string)[] = [];
    
    if (totalPages <= maxPageButtons) {
      // If we have fewer pages than buttons, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate start and end of page range around current page
      const leftSide = Math.floor(maxPageButtons / 2);
      const rightSide = Math.ceil(maxPageButtons / 2) - 1;
      
      if (currentPage > leftSide + 1) {
        pages.push('...');
      }
      
      // Calculate page range
      let start = Math.max(2, currentPage - leftSide);
      let end = Math.min(totalPages - 1, currentPage + rightSide);
      
      // Adjust if range is too small from either end
      if (start <= 3) {
        end = Math.min(start + maxPageButtons - 3, totalPages - 1);
        start = 2;
      }
      
      if (end >= totalPages - 2) {
        start = Math.max(end - maxPageButtons + 3, 2);
      }
      
      // Add pages in range
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page if we have multiple pages
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between px-2 py-1">
      <div className="flex items-center gap-2 text-sm text-muted-foreground order-2 md:order-1">
        <div>
          {showFilterStatus && filteredItemsCount !== undefined && totalItems !== undefined && filteredItemsCount < totalItems ? (
            <span>
              Showing {filteredItemsCount} filtered results of {totalItems} total records 
              ({startItem}-{endItem} of {filteredItemsCount})
            </span>
          ) : (
            <span>
              Showing {startItem}-{endItem} of {totalItems ?? filteredItemsCount ?? 0}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1.5">
          <span className="text-xs">Items per page:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-1 md:justify-end order-1 md:order-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
          <span className="sr-only">First page</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous page</span>
        </Button>
        
        <div className="hidden sm:flex gap-1">
          {getPageNumbers().map((page, index) => (
            typeof page === 'number' ? (
              <Button
                key={index}
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            ) : (
              <span key={index} className="flex items-center justify-center w-8">
                {page}
              </span>
            )
          ))}
        </div>

        <span className="sm:hidden text-sm mx-2">
          Page {currentPage} of {totalPages}
        </span>
        
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next page</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
          <span className="sr-only">Last page</span>
        </Button>
      </div>
    </div>
  );
}
