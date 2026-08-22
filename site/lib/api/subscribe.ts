/**
 * Sends an email to the opening-list backend, once one exists.
 *
 * Configure `NEXT_PUBLIC_SUBSCRIBE_ENDPOINT` (see .env.example) to point at
 * a real provider (a serverless function, a CRM form endpoint, etc). Until
 * then this resolves successfully without sending the address anywhere —
 * it exists so the form's loading/success/error states can be built and
 * tested against a real network call shape from day one.
 *
 * Never put a private API key here: this file ships to the browser.
 */
export async function subscribeToOpeningList(
  email: string
): Promise<{ success: boolean; message?: string }> {
  const endpoint = process.env.NEXT_PUBLIC_SUBSCRIBE_ENDPOINT;

  if (!endpoint) {
    return { success: true };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      return { success: false, message: "Something went wrong. Please try again." };
    }

    return { success: true };
  } catch {
    return { success: false, message: "Network error. Please try again." };
  }
}
