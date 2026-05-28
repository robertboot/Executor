// Image embedding — provider-agnostic facade.
//
// Configure ONE provider in env:
//   EMBEDDING_PROVIDER = voyage | cohere | openai
//
// Returns a fixed-dimension Float32 vector you can store in a Postgres
// pgvector column and search with `<->` (L2) or `<=>` (cosine).
//
// Current default vectors are 1024-d (Voyage Multimodal-3 native). Cohere
// Embed v4 also defaults to 1024. OpenAI's text-embedding-3-large returns
// 3072 — we'd resize the pgvector column if you switch to it.

const PROVIDER = process.env.EMBEDDING_PROVIDER?.toLowerCase();

export const EMBEDDING_DIMS = 1024;

export interface EmbedInput {
  /** base64-encoded image bytes, no data: prefix */
  imageBase64: string;
  /** mime type, e.g. "image/jpeg" */
  contentType: string;
  /** optional text companion (item name, category) for stronger signal */
  caption?: string;
}

export async function embedImage(input: EmbedInput): Promise<number[]> {
  if (!PROVIDER) {
    throw new Error(
      'EMBEDDING_PROVIDER is not set. Set it to "voyage", "cohere", or ' +
        '"openai" and add the matching API key (VOYAGE_API_KEY etc.) to ' +
        'enable the scan/recognize feature.',
    );
  }
  switch (PROVIDER) {
    case 'voyage':
      return embedVoyage(input);
    case 'cohere':
      return embedCohere(input);
    case 'openai':
      throw new Error(
        'OpenAI does not currently expose a public multimodal image ' +
          'embedding endpoint. Use voyage or cohere for image-to-vector ' +
          'similarity.',
      );
    default:
      throw new Error(`Unknown EMBEDDING_PROVIDER: ${PROVIDER}`);
  }
}

// ----- Voyage AI (https://docs.voyageai.com/docs/multimodal-embeddings)
async function embedVoyage(input: EmbedInput): Promise<number[]> {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) throw new Error('VOYAGE_API_KEY is not set');

  const content: Array<{ type: string; image_base64?: string; text?: string }> = [
    { type: 'image_base64', image_base64: `data:${input.contentType};base64,${input.imageBase64}` },
  ];
  if (input.caption) content.push({ type: 'text', text: input.caption });

  const res = await fetch('https://api.voyageai.com/v1/multimodalembeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      inputs: [{ content }],
      model: 'voyage-multimodal-3',
      input_type: 'document',
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Voyage embed failed: ${res.status} ${t}`);
  }
  const data = await res.json();
  return data.data[0].embedding as number[];
}

// ----- Cohere (https://docs.cohere.com/reference/embed)
async function embedCohere(input: EmbedInput): Promise<number[]> {
  const key = process.env.COHERE_API_KEY;
  if (!key) throw new Error('COHERE_API_KEY is not set');

  const res = await fetch('https://api.cohere.com/v2/embed', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'embed-v4.0',
      input_type: 'search_document',
      embedding_types: ['float'],
      images: [`data:${input.contentType};base64,${input.imageBase64}`],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Cohere embed failed: ${res.status} ${t}`);
  }
  const data = await res.json();
  return data.embeddings.float[0] as number[];
}
