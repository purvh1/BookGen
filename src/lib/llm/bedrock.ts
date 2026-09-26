import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

interface ClaudeRequestBody {
  anthropic_version: string;
  max_tokens: number;
  messages: ClaudeMessage[];
}

interface ClaudeContentBlock {
  type: string;
  text: string;
}

interface ClaudeResponse {
  content: ClaudeContentBlock[];
}

// ─── BedrockProvider ──────────────────────────────────────────────────────────

/**
 * Thin wrapper around `@aws-sdk/client-bedrock-runtime` for Claude inference.
 *
 * Reads `AWS_REGION` and `BEDROCK_MODEL_ID` from `process.env` at construction
 * time and throws a descriptive error if either is absent.
 *
 * Optional static credentials (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`)
 * are forwarded to the underlying SDK client when present; otherwise the SDK
 * falls back to the default credential-provider chain.
 */
export class BedrockProvider {
  private readonly client: BedrockRuntimeClient;
  private readonly modelId: string;

  constructor() {
    const region = process.env.AWS_REGION;
    if (!region) {
      throw new Error(
        "AWS_REGION environment variable is required but was not set."
      );
    }

    const modelId = process.env.BEDROCK_MODEL_ID;
    if (!modelId) {
      throw new Error(
        "BEDROCK_MODEL_ID environment variable is required but was not set."
      );
    }

    this.modelId = modelId;

    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    this.client = new BedrockRuntimeClient({
      region,
      ...(accessKeyId && secretAccessKey
        ? {
            credentials: {
              accessKeyId,
              secretAccessKey,
            },
          }
        : {}),
    });
  }

  /**
   * Send a plain-text prompt to the configured Claude model and return the
   * model's text reply.
   *
   * @param prompt - The user message to send.
   * @returns The raw text of the first content block in the response.
   * @throws Re-throws any SDK error with its original message preserved.
   */
  async invoke(prompt: string): Promise<string> {
    const body: ClaudeRequestBody = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 8096,
      messages: [{ role: "user", content: prompt }],
    };

    const command = new InvokeModelCommand({
      modelId: this.modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(body),
    });

    try {
      const response = await this.client.send(command);
      const decoded = new TextDecoder().decode(response.body);
      const parsed = JSON.parse(decoded) as ClaudeResponse;
      return parsed.content[0].text;
    } catch (err) {
      // Re-throw with the original message so callers can inspect it.
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw err;
    }
  }
}
