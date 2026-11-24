import type { User } from "@/types/domain";
export const mockUsers: readonly User[] = [
  { id: "user-owner", name: "Zahra", email: "zahra@zaraff.id", role: "owner" },
  {
    id: "user-admin",
    name: "Keisha",
    email: "keisha@zaraff.id",
    role: "admin",
  },
  {
    id: "user-sorter",
    name: "Jojo",
    email: "jojo@zaraff.id",
    role: "penyortir",
  },
  {
    id: "user-host",
    name: "Nadia",
    email: "nadia@zaraff.id",
    role: "live-host",
  },
  {
    id: "user-packing",
    name: "Rizky",
    email: "rizky@zaraff.id",
    role: "packing",
  },
];
