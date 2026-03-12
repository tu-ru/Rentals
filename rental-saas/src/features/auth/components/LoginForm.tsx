import { zodResolver } from "@hookform/resolvers/zod"
import { AnimatePresence, motion } from "framer-motion"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link } from "react-router-dom"
import { z } from "zod"
import { useAuth } from "../../../app/providers"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"

const passwordSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

const magicSchema = z.object({
  email: z.string().email("Enter a valid email"),
})

type PasswordValues = z.infer<typeof passwordSchema>
type MagicValues = z.infer<typeof magicSchema>

export function LoginForm() {
  const { signIn, sendMagicLink, loading } = useAuth()
  const [magicSent, setMagicSent] = useState(false)

  const passwordForm = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) })
  const magicForm = useForm<MagicValues>({ resolver: zodResolver(magicSchema) })

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Tabs defaultValue="password">
        <TabsList className="mb-6 grid w-full grid-cols-2">
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="magic">Magic Link</TabsTrigger>
        </TabsList>

        <TabsContent value="password">
          <form className="space-y-4" onSubmit={passwordForm.handleSubmit((values) => signIn(values.email, values.password))}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...passwordForm.register("email")} />
              <p className="text-xs text-red-500">{passwordForm.formState.errors.email?.message}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...passwordForm.register("password")} />
              <p className="text-xs text-red-500">{passwordForm.formState.errors.password?.message}</p>
            </div>
            <Button className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="magic">
          <form
            className="space-y-4"
            onSubmit={magicForm.handleSubmit(async (values) => {
              await sendMagicLink(values.email)
              setMagicSent(true)
            })}
          >
            <div className="space-y-2">
              <Label htmlFor="magic-email">Email</Label>
              <Input id="magic-email" type="email" {...magicForm.register("email")} />
              <p className="text-xs text-red-500">{magicForm.formState.errors.email?.message}</p>
            </div>
            <Button className="w-full" disabled={loading}>
              Send Magic Link
            </Button>
            <AnimatePresence>
              {magicSent && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="text-sm text-emerald-600"
                >
                  Magic link sent. Check your email.
                </motion.p>
              )}
            </AnimatePresence>
          </form>
        </TabsContent>
      </Tabs>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="text-primary hover:underline">
          Register
        </Link>
      </p>
    </motion.div>
  )
}
