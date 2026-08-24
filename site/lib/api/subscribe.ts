/**
 * Sends an email to the opening-list backend.
 *
 * Configured (see .env.production) to POST to FormSubmit.co, which
 * forwards submissions by email — no account or API key needed. Its very
 * first delivery to a given destination address is an activation email
 * sent to that address instead of the actual submission; every submission
 * after the link in that email is clicked arrives normally.
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
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        email,
        _subject: "New Optimum Optic early-access signup",
        _template: "table",
        message: `${email} joined the Optimum Optic opening list from optimumoptic.com.`,
      }),
    });

    if (!response.ok) {
      return { success: false, message: "Something went wrong. Please try again." };
    }

    return { success: true };
  } catch {
    return { success: false, message: "Network error. Please try again." };
  }
}
