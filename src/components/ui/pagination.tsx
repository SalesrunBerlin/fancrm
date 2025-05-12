
import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface PaginationProps {
  /**
   * The total number of items.
   */
  totalItems: number;
  /**
   * The number of items per page.
   */
  pageSize: number;
  /**
   * The current page number (1-based).
   */
  currentPage: number;
  /**
   * Callback when page changes.
   */
  onPageChange: (page: number) => void;
  /**
   * Optional CSS class name.
   */
  className?: string;
  /**
   * Show first/last page buttons.
   */
  showFirstLastButtons?: boolean;
  /**
   * Whether to disable the component.
   */
  disabled?: boolean;
}

export function Pagination({
  totalItems,
  pageSize,
  currentPage,
  onPageChange,
  className,
  showFirstLastButtons = true,
  disabled = false,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);
  
  // Calculate visible page numbers
  const getVisiblePages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "ellipsis", totalPages];
    }
    
    if (currentPage >= totalPages - 3) {
      return [1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    
    return [
      1,
      "ellipsis",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "ellipsis",
      totalPages,
    ];
  };

  const visiblePages = getVisiblePages();

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-2",
        className
      )}
    >
      {/* First page button */}
      {showFirstLastButtons && (
        <Button
          size="md"
          variant="outline"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || disabled}
          aria-label="Go to first page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      )}
      
      {/* Previous page button */}
      <Button
        size="md"
        variant="outline"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || disabled}
        aria-label="Go to previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Page numbers */}
      {visiblePages.map((page, i) => {
        if (page === "ellipsis") {
          return (
            <div key={`ellipsis-${i}`} className="px-2 py-1">
              ...
            </div>
          );
        }

        return (
          <Button
            key={`page-${page}`}
            size="md"
            variant={currentPage === page ? "default" : "outline"}
            onClick={() => onPageChange(page as number)}
            disabled={disabled}
            aria-label={`Page ${page}`}
            aria-current={currentPage === page ? "page" : undefined}
            className={cn(
              "min-w-[40px]",
              currentPage === page && "pointer-events-none"
            )}
          >
            {page}
          </Button>
        );
      })}

      {/* Next page button */}
      <Button
        size="md"
        variant="outline"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || disabled}
        aria-label="Go to next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      
      {/* Last page button */}
      {showFirstLastButtons && (
        <Button
          size="md"
          variant="outline"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || disabled}
          aria-label="Go to last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
