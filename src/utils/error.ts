/**
 * Safely extract an error message from an unknown thrown value.
 * Returns the Error.message if available, otherwise the provided fallback.
 */
export function getErrorMessage(error: unknown, fallback = 'Unexpected error'): string {
  return error instanceof Error ? error.message : fallback;
}
