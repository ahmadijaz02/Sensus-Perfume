import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium tracking-wider uppercase transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_30px_hsl(var(--primary)/0.3)] hover:shadow-[0_6px_40px_hsl(var(--primary)/0.5)] hover:scale-105 active:scale-95",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:scale-105 active:scale-95",
        outline:
          "border border-primary/50 bg-transparent text-foreground hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105 active:scale-95",
        ghost: "hover:bg-secondary hover:text-foreground hover:scale-105",
        link: "text-primary underline-offset-4 hover:underline",
        luxury:
          "bg-transparent border border-foreground/20 text-foreground hover:border-primary hover:text-primary tracking-[0.2em] hover:scale-105 active:scale-95",
        hero:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_30px_hsl(var(--primary)/0.4)] hover:shadow-[0_8px_50px_hsl(var(--primary)/0.6)] tracking-[0.15em] font-semibold hover:scale-105 active:scale-95",
        "hero-outline":
          "bg-transparent border-2 border-foreground/30 text-foreground hover:border-foreground hover:bg-foreground/5 tracking-[0.15em] font-medium hover:scale-105 active:scale-95",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 px-4",
        lg: "h-12 px-10 text-base",
        xl: "h-14 px-12 text-base",
        icon: "h-10 w-10",
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
