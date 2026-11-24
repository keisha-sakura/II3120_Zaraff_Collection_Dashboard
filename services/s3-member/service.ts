import { errors } from "@backend/lib/errors";
import { customerRepository } from "./repository";
import type { DbTransaction } from "@backend/lib/db";

export const memberService = {
  list: () => customerRepository.list(),

  async create(input: { nama: string; noWa: string; handleSosmed: string; isMember?: boolean; saldoDeposit?: number }) {
    const existing = await customerRepository.findByHandle(input.handleSosmed);
    if (existing) throw errors.konflik("Handle sosmed sudah digunakan");
    return customerRepository.create(input);
  },

  async update(id: string, input: Partial<{ nama: string; noWa: string; handleSosmed: string; isMember: boolean }>) {
    const customer = await customerRepository.findById(id);
    if (!customer) throw errors.tidakDitemukan("Pelanggan tidak ditemukan");
    if (input.handleSosmed && input.handleSosmed !== customer.handleSosmed) {
      const existing = await customerRepository.findByHandle(input.handleSosmed);
      if (existing) throw errors.konflik("Handle sosmed sudah digunakan");
    }
    return customerRepository.update(id, input);
  },

  async memberStatus(id: string) {
    const customer = await customerRepository.findById(id);
    if (!customer) throw errors.tidakDitemukan("Pelanggan tidak ditemukan");
    return { id: customer.id, nama: customer.nama, isMember: customer.isMember, saldoDeposit: customer.saldoDeposit };
  },

  async addDeposit(id: string, jumlah: number) {
    const customer = await customerRepository.findById(id);
    if (!customer) throw errors.tidakDitemukan("Pelanggan tidak ditemukan");
    return customerRepository.addDeposit(id, jumlah);
  },

  // Called by S12 when payment approved via deposit
  async deductDeposit(id: string, jumlah: number, tx?: DbTransaction) {
    const customer = await customerRepository.findById(id, tx);
    if (!customer) throw errors.tidakDitemukan("Pelanggan tidak ditemukan");
    if (customer.saldoDeposit < jumlah)
      throw errors.konflik("Saldo deposit tidak mencukupi");
    return customerRepository.deductDeposit(id, jumlah, tx);
  },

  // Used by S12 to look up member status for discount calculation
  async getById(id: string, tx?: DbTransaction) {
    const customer = await customerRepository.findById(id, tx);
    if (!customer) throw errors.tidakDitemukan("Pelanggan tidak ditemukan");
    return customer;
  },
};
