import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./media.functions", () => ({
  prepareImageUpload: vi.fn(), completeImageUpload: vi.fn(),
}));

import { completeImageUpload, prepareImageUpload } from "./media.functions";
import { mediaUrl, uploadImage } from "./posts";

afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe("R2 upload flow", () => {
  it("uploads bytes to R2 and returns only the verified public URL for posts", async () => {
    vi.mocked(prepareImageUpload).mockResolvedValue({ key: "covers/test.jpg", uploadUrl: "https://storage.example.com/signed" });
    vi.mocked(completeImageUpload).mockResolvedValue({ publicUrl: "https://images.example.com/covers/test.jpg" });
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetcher);
    const file = new File(["bytes"], "test.jpg", { type: "image/jpeg" });
    expect(await uploadImage(file, "covers")).toBe("https://images.example.com/covers/test.jpg");
    expect(fetcher).toHaveBeenCalledWith("https://storage.example.com/signed", { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: file });
    expect(completeImageUpload).toHaveBeenCalledWith({ data: { key: "covers/test.jpg", type: "image/jpeg", size: 5 } });
  });
  it("does not return or verify a URL when R2 rejects the upload", async () => {
    vi.mocked(prepareImageUpload).mockResolvedValue({ key: "inline/test.png", uploadUrl: "https://storage.example.com/signed" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("AccessDenied", { status: 403 })));
    await expect(uploadImage(new File(["bytes"], "test.png", { type: "image/png" }), "inline")).rejects.toThrow("403");
    expect(completeImageUpload).not.toHaveBeenCalled();
  });
  it("rejects unsupported images before requesting an R2 upload", async () => {
    await expect(uploadImage(new File(["html"], "test.html", { type: "text/html" }), "covers")).rejects.toThrow();
    expect(prepareImageUpload).not.toHaveBeenCalled();
  });
  it("preserves R2 URLs during editor display instead of prefixing Supabase storage", () => {
    expect(mediaUrl("https://images.example.com/covers/test.jpg")).toBe("https://images.example.com/covers/test.jpg");
  });
});