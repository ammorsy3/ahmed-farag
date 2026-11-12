import type { ComponentPropsWithoutRef } from "react"

import { cn } from "@/lib/utils"

interface MarqueeProps extends ComponentPropsWithoutRef<"div"> {
  /** Reverse the scroll direction */
  reverse?: boolean
  /** Pause the animation while hovered */
  pauseOnHover?: boolean
  /** Scroll vertically instead of horizontally */
  vertical?: boolean
  /** How many times the children are repeated to fill the track */
  repeat?: number
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  vertical = false,
  repeat = 4,
  children,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      className={cn(
        "group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]",
        vertical ? "flex-col" : "flex-row",
        className,
      )}
    >
      {Array.from({ length: repeat }, (_, i) => (
        <div
          key={i}
          // Only the first copy is exposed to assistive tech and the keyboard; the rest are visual repeats
          {...(i > 0 ? ({ "aria-hidden": true, inert: "" } as object) : {})}
          className={cn(
            "flex shrink-0 justify-around [gap:var(--gap)] motion-reduce:[animation-play-state:paused]",
            vertical ? "animate-marquee-vertical flex-col" : "animate-marquee flex-row",
            pauseOnHover && "group-hover:[animation-play-state:paused]",
            reverse && "[animation-direction:reverse]",
          )}
        >
          {children}
        </div>
      ))}
    </div>
  )
}
