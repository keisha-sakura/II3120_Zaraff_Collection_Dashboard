const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
export function formatCurrency(value: number) {
  return rupiah.format(value);
}
export function formatDate(value: string | Date, withTime = false) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {}),
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}
