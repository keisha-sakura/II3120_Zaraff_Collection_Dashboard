import type { z } from "zod";
import { errors } from "./errors";

export async function body<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.output<T>> {
  let input: unknown;
  try {
    input = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError)
      throw errors.validasi("Body harus berupa JSON yang valid");
    throw error;
  }
  return schema.parse(input);
}

export function query<T extends z.ZodType>(
  request: Request,
  schema: T,
): z.output<T> {
  return schema.parse(Object.fromEntries(new URL(request.url).searchParams));
}
