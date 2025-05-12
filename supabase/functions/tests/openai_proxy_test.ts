
import { assertEquals, assertMatch } from 'https://deno.land/std@0.177.0/testing/asserts.ts';

// Mock OpenAI response stream
class MockReadableStream {
  private chunks: Uint8Array[];
  private index: number = 0;

  constructor(chunks: string[]) {
    const encoder = new TextEncoder();
    this.chunks = chunks.map(chunk => encoder.encode(chunk));
  }

  getReader() {
    return {
      read: async () => {
        if (this.index < this.chunks.length) {
          const value = this.chunks[this.index++];
          return { done: false, value };
        } else {
          return { done: true, value: undefined };
        }
      }
    };
  }
}

// Test parsing an OpenAI stream
Deno.test("Parse OpenAI stream", async () => {
  const chunks = [
    'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1698149143,"model":"gpt-4","choices":[{"index":0,"delta":{"role":"assistant","content":"Hello"},"finish_reason":null}]}\n\n',
    'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1698149143,"model":"gpt-4","choices":[{"index":0,"delta":{"content":" world"},"finish_reason":null}]}\n\n',
    'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1698149143,"model":"gpt-4","choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":10,"completion_tokens":5,"total_tokens":15}}\n\n',
    'data: [DONE]\n\n'
  ];

  const mockStream = new MockReadableStream(chunks);
  const mockResponse = { body: mockStream } as unknown as Response;

  let content = '';
  let promptTokens = 0;
  let completionTokens = 0;

  const decoder = new TextDecoder();
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (chunk.includes('data: ') && !chunk.includes('data: [DONE]')) {
      try {
        const data = JSON.parse(chunk.replace('data: ', '').trim());
        if (data.choices && data.choices[0]?.delta?.content) {
          content += data.choices[0].delta.content;
        }
        if (data.usage) {
          promptTokens = data.usage.prompt_tokens || 0;
          completionTokens = data.usage.completion_tokens || 0;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }

  assertEquals(content, "Hello world");
  assertEquals(promptTokens, 10);
  assertEquals(completionTokens, 5);
});

// Test content parsing for embeddings
Deno.test("Content extraction for embeddings", () => {
  const testString = "This is a long piece of text that should be processed for embedding. It contains multiple sentences and might have special characters like @#$%. The system should extract relevant content from it.";
  
  // Simulate content extraction (in production this would use more advanced NLP)
  const extractContent = (text: string, maxLength: number = 256): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength-3) + "...";
  };
  
  const result = extractContent(testString);
  
  // Make sure content is not too long
  assert(result.length <= 256);
  
  // Make sure content starts with the original text
  assertMatch(result, /^This is a long piece/);
});
