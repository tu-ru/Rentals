// Currency formatter for KES
export function formatKES(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount)
}

// Date formatter
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit", month: "short", year: "numeric"
  }).format(new Date(date))
}

// Phone formatter: 0712345678 → +254712345678
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("254")) return `+${digits}`
  if (digits.startsWith("0")) return `+254${digits.slice(1)}`
  return `+254${digits}`
}
