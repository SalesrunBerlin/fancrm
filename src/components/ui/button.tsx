import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
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
        orange: "bg-orange-500 text-white hover:bg-orange-600",
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
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        responsive: "h-9 w-9 p-0 md:h-10 md:w-auto md:px-4 md:py-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  iconOnly?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, iconOnly = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
