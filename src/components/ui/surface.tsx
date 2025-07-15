
import * as React from "react"

import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const surfaceVariants = cva(
  "rounded-lg border border-border bg-background text-foreground shadow-sm",
  {
    variants: {
      variant: {
        default: "",
        transparent: "border-transparent bg-transparent shadow-none",
      },
      withPadding: {
        true: "p-4",
        false: "",
      },
      withShadow: {
        true: "shadow-sm",
        false: "shadow-none",
      },
    },
    defaultVariants: {
      variant: "default",
      withPadding: false,
      withShadow: false,
    },
  }
)

const Surface = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof surfaceVariants>
>(({ className, variant, withPadding, withShadow, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(surfaceVariants({ variant, withPadding, withShadow, className }))}
    {...props}
  />
))

Surface.displayName = "Surface"

export { Surface, surfaceVariants }
