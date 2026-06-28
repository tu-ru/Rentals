import { z } from "zod"

export const kenyanPhone = z.string().regex(/^(07|01)\d{8}$/, "Enter a valid Kenyan phone (07XX or 01XX)")

export const kenyanPhoneE164 = kenyanPhone.transform((value) => `+254${value.slice(1)}`)

export const positiveKES = z.number().positive("Amount must be greater than 0")

export const mpesaTransactionId = z.string().regex(/^[A-Z0-9]{10}$/, "Invalid M-Pesa transaction ID")

export const shortcode = z.string().regex(/^\d{5,6}$/, "Shortcode must be 5-6 digits")
