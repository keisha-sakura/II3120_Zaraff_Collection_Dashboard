import { db, type DbTransaction } from "@backend/lib/db";

type Writer = typeof db | DbTransaction;
const client = (tx?: Writer) => tx ?? db;

export const customerRepository = {
  list: () => db.customer.findMany({ orderBy: { nama: "asc" } }),
  findById: (id: string, tx?: Writer) => client(tx).customer.findUnique({ where: { id } }),
  findByHandle: (handleSosmed: string) => db.customer.findUnique({ where: { handleSosmed } }),
  create: (data: { nama: string; noWa: string; handleSosmed: string; isMember?: boolean; saldoDeposit?: number }, tx?: Writer) =>
    client(tx).customer.create({ data }),
  update: (id: string, data: Partial<{ nama: string; noWa: string; handleSosmed: string; isMember: boolean }>, tx?: Writer) =>
    client(tx).customer.update({ where: { id }, data }),
  addDeposit: (id: string, jumlah: number, tx?: Writer) =>
    client(tx).customer.update({ where: { id }, data: { saldoDeposit: { increment: jumlah } } }),
  deductDeposit: (id: string, jumlah: number, tx?: Writer) =>
    client(tx).customer.update({ where: { id }, data: { saldoDeposit: { decrement: jumlah } } }),
};
