import { describe, expect, it } from "vitest";
import { POST } from "../src/app/api/auth/login/route";
import { GET } from "../src/app/api/auth/me/route";
import { signToken } from "../lib/auth";
import { requireRole } from "../lib/requireRole";

describe("auth JWT", () => {
  it("login accepts seeded credentials and returns a JWT", async () => {
    const response = await POST(new Request("http://localhost/api/auth/login", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "password123" }),
    }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.user.role).toBe("admin");
    expect(body.token).toEqual(expect.any(String));
  });

  it("rejects a bad login with Bahasa Indonesia error format", async () => {
    const response = await POST(new Request("http://localhost/api/auth/login", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "keliru" }),
    }));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: { kode: "KREDENSIAL_SALAH", pesan: "Username atau kata sandi salah" } });
  });

  it("requires a token and rejects a wrong role", async () => {
    const unauthenticated = await GET(new Request("http://localhost/api/auth/me"));
    expect(unauthenticated.status).toBe(401);
    const hostToken = signToken({ id: "host", username: "host", role: "host" });
    expect(() => requireRole(new Request("http://localhost", { headers: { authorization: `Bearer ${hostToken}` } }), ["admin"])).toThrow("Anda tidak memiliki akses");
  });
});
