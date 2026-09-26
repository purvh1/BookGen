/**
 * Returns true if the trimmed description meets the 20-character minimum.
 */
export function descriptionIsValid(text: string): boolean {
  return text.trim().length >= 20;
}

/**
 * Maps an HTTP error status code (and optional API body) to a user-facing
 * error string. Always returns a non-empty string.
 */
export function mapApiError(status: number, body: { error?: string }): string {
  if (status === 409) {
    return "A book with that title already exists. Try a different description.";
  }
  if (status === 400) {
    return body.error ?? "Description is required.";
  }
  return "Generation failed. Please try again.";
}
