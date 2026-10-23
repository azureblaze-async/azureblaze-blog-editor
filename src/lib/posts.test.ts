import { describe, expect, it } from "vitest";
import { cleanPostInput, emptyPost, readingTime, slugify, validateForPublish } from "./posts";

describe("post rules", () => {
  it("preserves independent meta and social titles", () => {
    const row = cleanPostInput({ ...emptyPost, seo_title: "Why Does a Phone Still Have to Be Android or iOS? | AzureBlaze", og_title: "Why Does a Phone Still Have to Be Android or iOS?" });
    expect(row.seo_title).toBe("Why Does a Phone Still Have to Be Android or iOS? | AzureBlaze");
    expect(row.og_title).toBe("Why Does a Phone Still Have to Be Android or iOS?");
    expect(row.title).toBe("");
  });
  it("preserves independent meta and OG descriptions", () => {
    const row = cleanPostInput({ ...emptyPost, seo_description: "Two operating systems have carried pocket computing for over a decade. A look at hardware-software co-design, app gravity and the cold-start trap that stops new platforms.", og_description: "Most people think the mobile OS battle is over. Here is why it feels that way, and the loop every new platform runs into." });
    expect(row.seo_description).toBe("Two operating systems have carried pocket computing for over a decade. A look at hardware-software co-design, app gravity and the cold-start trap that stops new platforms.");
    expect(row.og_description).toBe("Most people think the mobile OS battle is over. Here is why it feels that way, and the loop every new platform runs into.");
    expect(row.excerpt).toBeNull();
  });
  it("stores multiple article tags", () => {
    const tags = ["mobile operating systems", "Android", "iOS", "cold-start problem", "two-sided markets", "Windows Phone", "BlackBerry 10", "Firefox OS"];
    expect(cleanPostInput({ ...emptyPost, tags }).tags).toEqual(tags);
  });
  it("stores cover alt text independently of social descriptions", () => {
    const alt = 'Two dark smartphones standing side by side on a black background under a soft azure light, next to a dashed azure outline of an empty third phone, and the words "Why only two?" at the top left.';
    const row = cleanPostInput({ ...emptyPost, cover_image_alt: alt, og_description: "A different social description" });
    expect(row.cover_image_alt).toBe(alt);
    expect(row.og_description).toBe("A different social description");
  });
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
