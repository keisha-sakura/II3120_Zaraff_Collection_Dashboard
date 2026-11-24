export type ClaimStatus = "menang" | "ditolak" | "tidak valid";

export interface ClaimResult {
  diterima: boolean;
  alasan: string;
  idPesanan?: string;
}
