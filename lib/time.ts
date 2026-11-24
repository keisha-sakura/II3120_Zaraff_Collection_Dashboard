export const wibFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  dateStyle: "medium",
  timeStyle: "short",
});

export function tampilWib(waktu: Date) {
  return wibFormatter.format(waktu);
}
