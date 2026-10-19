import { describe, expect, it, vi, afterEach } from "vitest";
import { publicImageUrl, validateImage, validateImageKey } from "./media";
import { verifyMediaAdmin } from "./media-auth";

afterEach(() => vi.unstubAllGlobals());

describe("R2 media rules", () => {
  it("accepts the existing five image formats", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]) {
      expect(() => validateImage(type, 100)).not.toThrow();
    }
    expect(() => validateImage("text/html", 100)).toThrow();
  });
  it("keeps the existing 5 MB cap and rejects empty files", () => {
    expect(() => validateImage("image/png", 5 * 1024 * 1024)).not.toThrow();
    expect(() => validateImage("image/png", 5 * 1024 * 1024 + 1)).toThrow();
    expect(() => validateImage("image/png", 0)).toThrow();
  });
  it("returns a permanent public URL rather than a temporary signed upload URL", () => {
    expect(publicImageUrl("https://images.example.com/", "covers/a.jpg")).toBe("https://images.example.com/covers/a.jpg");
    expect(() => publicImageUrl("http://images.example.com", "covers/a.jpg")).toThrow();
    expect(() => publicImageUrl("https://images.example.com?token=secret", "covers/a.jpg")).toThrow();
  });
  it("rejects keys outside generated cover and inline folders", () => {
    expect(() => validateImageKey("covers/12345678-abcd-1234-abcd-123456789012.jpg")).not.toThrow();
    expect(() => validateImageKey("../private/file.jpg")).toThrow();
  });
  it("rejects anonymous callers without contacting R2 or Supabase", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    await expect(verifyMediaAdmin("https://db.example.com", "public-key", undefined)).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("rejects an invalid identity", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("{}", { status: 401 }));
    vi.stubGlobal("fetch", fetcher);
    await expect(verifyMediaAdmin("https://db.example.com", "public-key", "Bearer test-only")).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("rejects signed-in users outside the admin allowlist", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response('{"id":"user"}')).mockResolvedValueOnce(new Response("false")));
    await expect(verifyMediaAdmin("https://db.example.com", "public-key", "Bearer test-only")).rejects.toThrow("Only an authorized editor");
  });
  it("accepts only a verified identity with an admin allowlist match", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response('{"id":"user"}')).mockResolvedValueOnce(new Response("true"));
    vi.stubGlobal("fetch", fetcher);
    await expect(verifyMediaAdmin("https://db.example.com", "public-key", "Bearer test-only")).resolves.toBeUndefined();
    expect(fetcher.mock.calls[1]?.[0]).toBe("https://db.example.com/rest/v1/rpc/is_admin");
  });
});