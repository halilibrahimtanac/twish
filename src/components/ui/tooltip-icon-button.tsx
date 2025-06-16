import * as React from "react"
import { cn } from "@/lib/utils" // Assuming you use shadcn/ui's standard setup

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Define the props for our component
interface TooltipIconButtonProps {
  /** The text to display in the tooltip. Also used for the aria-label. */
  tooltipText: string
  /** The icon component to render, e.g., `Heart` from lucide-react. */
  IconComponent: React.ElementType
  /** Tailwind classes for the icon's hover and fill states, e.g., "group-hover:text-red-500". */
  hoverClassName?: string
  /** An optional click handler for the button. */
  onClick?: () => void
  /** Optional additional classes to apply to the root element for layout purposes. */
  className?: string
  /** Optional props to pass directly to the underlying Button component. */
  buttonProps?: Omit<React.ComponentProps<"button">, "asChild" | "children">
}

export const TooltipIconButton = React.forwardRef<
  HTMLButtonElement,
  TooltipIconButtonProps
>(
  (
    {
      tooltipText,
      IconComponent,
      hoverClassName,
      onClick,
      className,
      buttonProps,
    },
    ref,
  ) => {
    return (
      <div className={cn(className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              ref={ref}
              variant="ghost"
              size="icon"
              className="group"
              onClick={onClick}
              aria-label={tooltipText}
              {...buttonProps}
            >
              <IconComponent
                className={cn(
                  "h-5 w-5 transition-colors",
                  hoverClassName
                )}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    )
  },
)

TooltipIconButton.displayName = "TooltipIconButton"