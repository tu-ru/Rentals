import { motion } from "framer-motion"
import { cn } from "../../lib/utils/cn"

type SpinnerSize = "sm" | "md" | "lg"

const sizeClass: Record<SpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-[3px]",
  lg: "h-12 w-12 border-4",
}

export function LoadingSpinner({ size = "md" }: { size?: SpinnerSize }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
      className={cn("rounded-full border-muted border-t-primary", sizeClass[size])}
    />
  )
}

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
}
