import { describe, expect, it } from "vitest";
import { emptyPost, readingTime, slugify, validateForPublish } from "./posts";

describe("post rules", () => {
  it("slugifies to lowercase hyphenated", () => {
    expect(slugify("  The Future Isn't a Limit! ")).toBe("the-future-isnt-a-limit");
  });
  it("blocks publishing without excerpt, content and category", () => {
    const errs = validateForPublish({ ...emptyPost, title: "T", slug: "t" });
    expect(errs).toHaveLength(3);
  });
  it("requires alt text when a cover is set", () => {
    const errs = validateForPublish({ ...emptyPost, title: "T", slug: "t", excerpt: "e", content_markdown: "c", category: "x", cover_image_path: "covers/a.jpg", cover_image_alt: "" });
    expect(errs).toEqual(["Cover image needs alt text."]);
  });
  it("reading time is at least one minute", () => {
    expect(readingTime("")).toBe(1);
    expect(readingTime("word ".repeat(660))).toBe(3);
  });
});
