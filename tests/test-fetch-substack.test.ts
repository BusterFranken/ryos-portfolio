import { describe, test, expect } from "bun:test";
import { parseRss } from "../scripts/fetch-substack";

const FIXTURE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Test Blog</title>
    <link>https://example.substack.com</link>
    <item>
      <title><![CDATA[My First Post]]></title>
      <link>https://example.substack.com/p/my-first-post</link>
      <pubDate>Mon, 01 Jan 2024 12:00:00 +0000</pubDate>
      <guid>https://example.substack.com/p/my-first-post</guid>
      <description><![CDATA[A short intro to the first post.]]></description>
      <content:encoded><![CDATA[<p>Full content of the first post.</p>]]></content:encoded>
    </item>
    <item>
      <title>Plain Text Title</title>
      <link>https://example.substack.com/p/plain-post</link>
      <pubDate>Tue, 02 Jan 2024 10:00:00 +0000</pubDate>
      <guid>https://example.substack.com/p/plain-post</guid>
      <description>A plain text description.</description>
    </item>
  </channel>
</rss>`;

describe("parseRss", () => {
  test("parses CDATA title, link, pubDate, and guid correctly", () => {
    const posts = parseRss(FIXTURE_RSS);
    expect(posts.length).toBeGreaterThanOrEqual(1);
    const first = posts[0];
    expect(first.title).toBe("My First Post");
    expect(first.link).toBe("https://example.substack.com/p/my-first-post");
    expect(first.pubDate).toBe("Mon, 01 Jan 2024 12:00:00 +0000");
    expect(first.guid).toBe("https://example.substack.com/p/my-first-post");
  });

  test("parses plain-text fields (no CDATA)", () => {
    const posts = parseRss(FIXTURE_RSS);
    expect(posts.length).toBeGreaterThanOrEqual(2);
    const second = posts[1];
    expect(second.title).toBe("Plain Text Title");
    expect(second.link).toBe("https://example.substack.com/p/plain-post");
    expect(second.pubDate).toBe("Tue, 02 Jan 2024 10:00:00 +0000");
    expect(second.guid).toBe("https://example.substack.com/p/plain-post");
    expect(second.description).toBe("A plain text description.");
  });

  test("extracts content:encoded into the content field", () => {
    const posts = parseRss(FIXTURE_RSS);
    const first = posts[0];
    expect(first.content).toBe("<p>Full content of the first post.</p>");
  });

  test("falls back to description when content:encoded is absent", () => {
    const posts = parseRss(FIXTURE_RSS);
    const second = posts[1];
    expect(second.content).toBe("A plain text description.");
  });

  test("returns [] on empty string input", () => {
    expect(parseRss("")).toEqual([]);
  });

  test("returns [] on garbage/non-RSS input", () => {
    expect(parseRss("not xml at all { garbage }")).toEqual([]);
  });
});
