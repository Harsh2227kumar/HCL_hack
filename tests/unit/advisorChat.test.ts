import { describe, it, expect } from 'vitest';
import { POST } from '../../src/app/api/chat/route';

describe('AI Career & Roadmap Advisor API (/api/chat)', () => {
  it('returns initial AI advisor greeting with dynamic starter options when messages array is empty', async () => {
    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.response_type).toBe('question');
    expect(json.message).toBeDefined();
    expect(json.thought).toBeDefined();
    expect(json.input).toBeDefined();
    expect(json.input.type).toBe('single_select_with_text');
    expect(Array.isArray(json.input.options)).toBe(true);
    expect(json.input.options.length).toBeGreaterThan(0);
    expect(json.input.allow_custom).toBe(true);
    expect(json.is_ready_for_roadmap).toBe(false);
  });

  it('handles multi-turn conversation and provides structured interaction config', async () => {
    const messages = [
      { role: 'ai', text: "Hey! What domain or technology are you looking to master?" },
      { role: 'user', text: "Mujhe AI Engineer banna hai." },
    ];

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.message || json.reply).toBeDefined();
    expect(json.thought).toBeDefined();
    expect(json.input).toBeDefined();
    expect(json.input.allow_custom).toBe(true);
  });
});
