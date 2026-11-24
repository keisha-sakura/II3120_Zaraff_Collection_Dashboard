import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public readonly status: 400 | 401 | 403 | 404 | 409 = 400,
    public readonly kode: string,
    pesan: string,
  ) {
    super(pesan);
  }
}

export const errors = {
  validasi: (pesan = "Data tidak valid") => new AppError(400, "VALIDASI", pesan),
  autentikasi: () => new AppError(401, "TIDAK_TERAUTENTIKASI", "Token autentikasi tidak valid"),
  akses: () => new AppError(403, "AKSES_DITOLAK", "Anda tidak memiliki akses"),
  tidakDitemukan: (pesan = "Data tidak ditemukan") => new AppError(404, "TIDAK_DITEMUKAN", pesan),
  konflik: (pesan = "Transisi status tidak valid") => new AppError(409, "KONFLIK_STATUS", pesan),
};

export function errorResponse(error: unknown) {
  if (error instanceof AppError)
    return Response.json(
      { error: { kode: error.kode, pesan: error.message } },
      { status: error.status },
    );
  if (error instanceof ZodError)
    return Response.json(
      { error: { kode: "VALIDASI", pesan: "Data tidak valid" } },
      { status: 400 },
    );
  console.error(error);
  return Response.json(
    { error: { kode: "KESALAHAN_SERVER", pesan: "Terjadi kesalahan server" } },
    { status: 500 },
  );
}
