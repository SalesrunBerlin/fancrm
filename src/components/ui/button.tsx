
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { ActionColor } from "@/hooks/useActions";

// Map of predefined color variants - these are backward compatible with existing code
const predefinedVariants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
  warning: "bg-amber-500 text-white hover:bg-amber-600",
  success: "bg-green-600 text-white hover:bg-green-700",
  icon: "p-0 h-9 w-9 md:h-10 md:w-auto md:px-4",
  // New orange button for primary CTAs
  orange: "bg-orange-500 text-white hover:bg-orange-600",
  // Blues & teals
  cyan: "bg-cyan-500 text-white hover:bg-cyan-600",
  teal: "bg-teal-500 text-white hover:bg-teal-600",
  sky: "bg-sky-500 text-white hover:bg-sky-600",
  azure: "bg-sky-600 text-white hover:bg-sky-700",
  cobalt: "bg-blue-700 text-white hover:bg-blue-800",
  navy: "bg-blue-900 text-white hover:bg-blue-950",
  turquoise: "bg-teal-400 text-white hover:bg-teal-500",
  seafoam: "bg-green-300 text-gray-900 hover:bg-green-400",
  // Greens & yellows
  emerald: "bg-emerald-500 text-white hover:bg-emerald-600",
  lime: "bg-lime-500 text-white hover:bg-lime-600",
  yellow: "bg-yellow-500 text-gray-900 hover:bg-yellow-600",
  olive: "bg-yellow-700 text-white hover:bg-yellow-800",
  forest: "bg-green-800 text-white hover:bg-green-900",
  mint: "bg-green-200 text-gray-900 hover:bg-green-300",
  sage: "bg-green-200 text-gray-900 hover:bg-green-300",
  // Reds, oranges & browns
  coral: "bg-orange-400 text-white hover:bg-orange-500",
  maroon: "bg-red-800 text-white hover:bg-red-900",
  brown: "bg-amber-800 text-white hover:bg-amber-900",
  crimson: "bg-red-700 text-white hover:bg-red-800",
  burgundy: "bg-red-900 text-white hover:bg-red-950",
  brick: "bg-red-600 text-white hover:bg-red-700",
  sienna: "bg-amber-700 text-white hover:bg-amber-800",
  ochre: "bg-yellow-600 text-white hover:bg-yellow-700",
  gold: "bg-yellow-400 text-gray-900 hover:bg-yellow-500",
  bronze: "bg-amber-600 text-white hover:bg-amber-700",
  // Purples & pinks
  purple: "bg-purple-600 text-white hover:bg-purple-700",
  violet: "bg-violet-600 text-white hover:bg-violet-700",
  indigo: "bg-indigo-600 text-white hover:bg-indigo-700",
  lavender: "bg-purple-300 text-gray-900 hover:bg-purple-400",
  fuchsia: "bg-fuchsia-500 text-white hover:bg-fuchsia-600",
  magenta: "bg-pink-600 text-white hover:bg-pink-700",
  rose: "bg-rose-500 text-white hover:bg-rose-600",
  pink: "bg-pink-500 text-white hover:bg-pink-600",
  plum: "bg-purple-800 text-white hover:bg-purple-900",
  mauve: "bg-purple-400 text-white hover:bg-purple-500",
  // Grays
  slate: "bg-slate-500 text-white hover:bg-slate-600",
  silver: "bg-gray-400 text-white hover:bg-gray-500",
  charcoal: "bg-gray-700 text-white hover:bg-gray-800",
};

// Dynamic color generator function that builds Tailwind classes based on color name
const generateDynamicColorClasses = (color: string) => {
  return {
    solid: `bg-${color}-600 text-white hover:bg-${color}-700 focus:ring-${color}-500`,
    outline: `border border-${color}-500 text-${color}-600 hover:bg-${color}-50 focus:ring-${color}-500`,
    ghost: `text-${color}-600 hover:bg-${color}-50 focus:ring-${color}-500`,
    link: `text-${color}-600 underline-offset-4 hover:underline focus:ring-${color}-500`,
  };
};

// The main button variant configuration
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        ...predefinedVariants,
        solid: "bg-primary text-primary-foreground hover:bg-primary/90", // Alias for 'default'
      },
      size: {
        xs: "h-7 px-2 py-1 text-xs",
        sm: "h-9 rounded-md px-3 text-sm",
        md: "h-10 px-4 py-2 text-sm", // Default size
        lg: "h-11 rounded-md px-6 text-base",
        icon: "h-10 w-10 p-2",
        responsive: "h-9 w-9 p-0 md:h-10 md:w-auto md:px-4 md:py-2",
        default: "h-10 px-4 py-2 text-sm", // For backward compatibility
      },
      fullWidth: {
        true: "w-full",
      },
      iconOnly: {
        true: "p-0 aspect-square",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      fullWidth: false,
      iconOnly: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<VariantProps<typeof buttonVariants>, "variant"> {
  /**
   * Visual style preset.
   * Can be a predefined variant or a dynamic color name.
   */
  variant?: "solid" | "outline" | "ghost" | "link" | ActionColor;
  /**
   * Size preset.
   */
  size?: "xs" | "sm" | "md" | "lg" | "icon" | "responsive" | "default";
  /**
   * Optional left icon or right icon.
   */
  icon?: React.ReactNode;
  /**
   * Position of the icon (start or end).
   */
  iconPosition?: "start" | "end";
  /**
   * Show spinner & disables button when true.
   */
  loading?: boolean;
  /**
   * Makes the button take the full width of its container.
   */
  fullWidth?: boolean;
  /**
   * Makes the button circular if it has only an icon inside.
   */
  iconOnly?: boolean;
  /**
   * Optional custom colour token (Tailwind colour name without shade).
   */
  color?: string;
  /**
   * Use the user's favorite color (from AuthContext).
   */
  useUserColor?: boolean;
  /**
   * Radix UI's asChild prop.
   */
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size,
      children,
      icon,
      iconPosition = "start", 
      loading = false,
      fullWidth = false,
      iconOnly = false,
      color,
      useUserColor = false,
      asChild = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const { favoriteColor } = useAuth();
    
    // Determine the final variant to use
    let finalVariant = variant;
    
    // If useUserColor is true and no variant or color is provided, use the user's favorite color
    if (useUserColor && !color && !variant && favoriteColor && favoriteColor !== 'default') {
      finalVariant = favoriteColor as ActionColor;
    }
    
    // Handle dynamic color generation
    let dynamicClasses = "";
    if (color) {
      const variantType = (variant === "default" || variant === "solid") ? "solid" : 
                          (variant === "outline" ? "outline" : 
                          (variant === "ghost" ? "ghost" : "link"));
                          
      const colorClasses = generateDynamicColorClasses(color)[variantType as keyof ReturnType<typeof generateDynamicColorClasses>];
      dynamicClasses = colorClasses || "";
    }
    
    // Auto-detect iconOnly if icon is provided without children
    const effectiveIconOnly = iconOnly || (!!icon && !children);
    
    // Determine if the button is disabled (explicitly or due to loading)
    const isDisabled = disabled || loading;

    // Create the button content that will be used with or without Slot
    const buttonContent = (
      <>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {/* Render icon at the start if specified */}
        {!loading && icon && iconPosition === "start" && icon}
        {/* Render children */}
        {children}
        {/* Render icon at the end if specified */}
        {!loading && icon && iconPosition === "end" && icon}
      </>
    );
    
    // If asChild, use Slot
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(
          buttonVariants({ 
            variant: finalVariant as any, 
            size, 
            fullWidth,
            iconOnly: effectiveIconOnly,
          }),
          dynamicClasses,
          className
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {asChild ? 
          // When using asChild, we need to ensure a single child is passed
          // But we still want our button content, so we wrap it in a span
          // This ensures React.Children.only inside Slot works correctly
          React.isValidElement(children) ? 
            React.cloneElement(children, {
              ...children.props,
              children: (
                <>
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {!loading && icon && iconPosition === "start" && React.cloneElement(icon as React.ReactElement, {
                    className: cn("mr-2", (icon as React.ReactElement).props.className)
                  })}
                  {children.props.children}
                  {!loading && icon && iconPosition === "end" && React.cloneElement(icon as React.ReactElement, {
                    className: cn("ml-2", (icon as React.ReactElement).props.className)
                  })}
                </>
              )
            }) 
          : buttonContent
        : buttonContent
      }
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
