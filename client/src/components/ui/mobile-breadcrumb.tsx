import React, { useState } from "react";
import { Link } from "wouter";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  title: string;
  href?: string;
  icon?: React.ReactNode;
}

interface MobileBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function MobileBreadcrumb({ items, className }: MobileBreadcrumbProps) {
  // Define which items to show directly (first and last two)
  // and which to collapse into the dropdown
  const [isOpen, setIsOpen] = useState(false);
  
  if (!items || items.length === 0) {
    return null;
  }
  
  // Always show first item
  const firstItem = items[0];
  
  // If there are 3 or fewer items, show them all
  if (items.length <= 3) {
    return (
      <nav className={cn("flex items-center overflow-x-auto py-2", className)}>
        {items.map((item, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="mx-1 h-4 w-4 flex-shrink-0 text-muted-foreground" />
            )}
            {item.href ? (
              <Link 
                href={item.href}
                className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setIsOpen(false)}
              >
                {item.icon && <span className="mr-1">{item.icon}</span>}
                {item.title}
              </Link>
            ) : (
              <span className="flex items-center text-sm font-medium">
                {item.icon && <span className="mr-1">{item.icon}</span>}
                {item.title}
              </span>
            )}
          </div>
        ))}
      </nav>
    );
  }
  
  // For more items, show first, dropdown, and last item
  const lastItem = items[items.length - 1];
  const middleItems = items.slice(1, items.length - 1);
  
  return (
    <nav className={cn("flex items-center overflow-x-auto py-2", className)}>
      {/* First item */}
      <Link 
        href={firstItem.href || "#"}
        className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        {firstItem.icon && <span className="mr-1">{firstItem.icon}</span>}
        {firstItem.title}
      </Link>
      
      <ChevronRight className="mx-1 h-4 w-4 flex-shrink-0 text-muted-foreground" />
      
      {/* Middle items dropdown */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-auto px-1 py-0.5 text-muted-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {middleItems.map((item, index) => (
            <DropdownMenuItem key={index} asChild>
              <Link 
                href={item.href || "#"} 
                className="flex items-center"
                onClick={() => setIsOpen(false)}
              >
                {item.icon && <span className="mr-2">{item.icon}</span>}
                {item.title}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <ChevronRight className="mx-1 h-4 w-4 flex-shrink-0 text-muted-foreground" />
      
      {/* Last item */}
      <span className="flex items-center text-sm font-medium">
        {lastItem.icon && <span className="mr-1">{lastItem.icon}</span>}
        {lastItem.title}
      </span>
    </nav>
  );
}