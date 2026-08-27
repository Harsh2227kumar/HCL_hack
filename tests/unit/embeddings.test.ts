import { describe, it, expect, vi } from "vitest";
import { getResourceEmbedding, getQueryEmbedding } from "../../src/lib/ai/embeddings";
import { callAI } from "../../src/lib/ai/callAI";

// Mock the unified callAI module
vi.mock("../../src/lib/ai/callAI", () => ({
  callAI: vi.fn(),
}));

describe("embeddings", () => {
  it("should format resource input correctly and invoke callAI with the 'embedding' role", async () => {
    const dummyVector = new Array(768).fill(0.05);
    vi.mocked(callAI).mockResolvedValue(dummyVector);

    const result = await getResourceEmbedding("Intro to SQL", "A database intro", ["SQL"]);
    
    expect(callAI).toHaveBeenCalledWith(
      "embedding",
      "Title: Intro to SQL\nDescription: A database intro\nSkills: SQL"
    );
    expect(result).toBe(dummyVector);
  });

  it("should send the query text unmodified for query embeddings", async () => {
    const dummyVector = new Array(768).fill(0.12);
    vi.mocked(callAI).mockResolvedValue(dummyVector);

    const result = await getQueryEmbedding("data analyst requirements");
    
    expect(callAI).toHaveBeenCalledWith("embedding", "data analyst requirements");
    expect(result).toBe(dummyVector);
  });
});
