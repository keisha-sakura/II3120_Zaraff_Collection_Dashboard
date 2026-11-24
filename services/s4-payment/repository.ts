import { db, type DbTransaction } from "@backend/lib/db";

type Writer = typeof db | DbTransaction;
const c = (tx?: Writer) => tx ?? db;

export const invoiceRepository = {
  findById: (id: string, tx?: Writer) =>
    c(tx).invoice.findUnique({ where: { id }, include: { payments: true } }),

  findByOrderId: (orderId: string, tx?: Writer) =>
    c(tx).invoice.findUnique({ where: { orderId }, include: { payments: true } }),

  create: (
    data: { orderId: string; subtotal: number; diskon: number; jumlah: number; status: string },
    tx?: Writer,
  ) => c(tx).invoice.create({ data, include: { payments: true } }),

  updateStatus: (id: string, status: string, tx?: Writer) =>
    c(tx).invoice.update({ where: { id }, data: { status } }),
};

export const paymentRepository = {
  findById: (id: string, tx?: Writer) =>
    c(tx).payment.findUnique({ where: { id }, include: { invoice: true } }),

  create: (
    data: { invoiceId: string; metode: string; buktiBayar?: string; jumlah: number; status: string },
    tx?: Writer,
  ) => c(tx).payment.create({ data, include: { invoice: true } }),

  updateStatus: (id: string, data: { status: string; alasanPenolakan?: string }, tx?: Writer) =>
    c(tx).payment.update({ where: { id }, data, include: { invoice: true } }),
};
