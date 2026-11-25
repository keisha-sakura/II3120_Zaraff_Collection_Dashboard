import type { DbTransaction } from "./db";
export async function staffIds(
  ids: readonly string[],
  tx: DbTransaction,
): Promise<string[]> {
  const users = await tx.appUser.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true },
  });
  return users.map((user) => user.id);
}
