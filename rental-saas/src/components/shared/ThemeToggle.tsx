import { AnimatePresence, motion } from "framer-motion"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "../../app/providers/ThemeProvider"
import { Button } from "../ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"

const modes = ["light", "dark", "system"] as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const nextTheme = () => {
    const index = modes.indexOf(theme)
    setTheme(modes[(index + 1) % modes.length])
  }

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor
  const label = theme[0].toUpperCase() + theme.slice(1)

  return (
    <TooltipProvider>
      <Tooltip>
        <div className="relative inline-flex">
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={nextTheme} aria-label={`Theme mode: ${label}`}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.2 }}
                >
                  <Icon className="h-5 w-5" />
                </motion.span>
              </AnimatePresence>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{label} mode</TooltipContent>
        </div>
      </Tooltip>
    </TooltipProvider>
  )
}
