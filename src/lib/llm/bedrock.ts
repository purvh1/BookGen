import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

// ─── BedrockProvider ──────────────────────────────────────────────────────────

/**
 * Thin wrapper around `@aws-sdk/client-bedrock-runtime` using the model-agnostic
 * Converse API — works with Claude, Kimi K3, and any other Bedrock model.
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
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
    });
  }

  /**
   * Send a plain-text prompt via the Converse API and return the model's text reply.
   *
   * Scans all content blocks for the first one containing a `text` field — this
   * handles reasoning models (e.g. Kimi K3) that emit a `reasoningContent` block
   * before the actual text response.
   *
   * @param prompt - The user message to send.
   * @returns The text of the first text-bearing content block in the response.
   * @throws Re-throws any SDK error with its original message preserved.
   */
  async invoke(prompt: string): Promise<string> {
    const command = new ConverseCommand({
      modelId: this.modelId,
      messages: [
        {
          role: "user",
          content: [{ text: prompt }],
        },
      ],
      inferenceConfig: {
        maxTokens: 8096,
      },
    });

    try {
      const response = await this.client.send(command);

      const blocks = response.output?.message?.content ?? [];

      // Reasoning models (e.g. Kimi K3) prepend a reasoningContent block before
      // the actual text — find the first block that carries a text field.
      const textBlock = blocks.find(
        (b): b is { text: string } => "text" in b && typeof b.text === "string"
      );

      if (!textBlock) {
        throw new Error(
          `No text block found in Bedrock response. ` +
          `Block types received: ${blocks.map((b) => Object.keys(b).join("|")).join(", ")}`
        );
      }

      return textBlock.text;
    } catch (err) {
      if (err instanceof Error) throw new Error(err.message);
      throw err;
    }
  }
}
