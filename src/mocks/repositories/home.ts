import "server-only";
import type { HomeRepository } from "@/features/beranda/contracts";
import { mockHomeData } from "../data/home";
import { mockUsers } from "../data/users";

/** Replace with session-aware reporting services when the backend is connected. */
export const mockHomeRepository: HomeRepository = {
  async getDashboard(role) {
    const user = mockUsers.find((user) => user.role === role);
    if (!user) throw new Error("Preview user is unavailable");
    return structuredClone({ user, data: mockHomeData[role] });
  },
};
