import { abortableFetch } from "@/utils/abortableFetch";

export interface SubstackPost {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  content: string;
  guid: string;
}

export interface SubstackFeed {
  generatedAt?: string;
  feedUrl?: string;
  posts: SubstackPost[];
}

export async function loadSubstackPosts(): Promise<SubstackPost[]> {
  try {
    const response = await abortableFetch("/data/substack-posts.json", {
      timeout: 15000,
      retry: { maxAttempts: 2, initialDelayMs: 500 },
    });
    const data: SubstackFeed = await response.json();
    return data.posts ?? [];
  } catch {
    return [];
  }
}
