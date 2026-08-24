/**
 * Helper to extract error message from API response.
 * If backend returned an error.details array (e.g. Zod validation errors),
 * it joins the individual issues into a readable string.
 * Otherwise falls back to error.message, and then to fallbackMessage.
 */
export function getErrorMessage(err: any, fallbackMessage = 'An unexpected error occurred.'): string {
  const errorData = err?.response?.data?.error;
  if (Array.isArray(errorData?.details) && errorData.details.length > 0) {
    return errorData.details
      .map((d: any) => d.issue || d.message)
      .filter(Boolean)
      .join(' ');
  }
  return errorData?.message || fallbackMessage;
}
