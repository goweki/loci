"use server";

export interface GetTokenUsingWabaAuthCodeResult {
  success: boolean;
  businessToken?: string;
  error?: string;
}

export async function getTokenUsingWabaAuthCode(
  code: string
): Promise<GetTokenUsingWabaAuthCodeResult> {
  const APP_ID = process.env.FACEBOOK_APP_ID;
  const APP_SECRET = process.env.FACEBOOK_APP_SECRET;

  if (!APP_ID || !APP_SECRET) {
    throw new Error("Missing FACEBOOK_APP_ID or FACEBOOK_APP_SECRET env vars");
  }

  const url = new URL("https://graph.facebook.com/v21.0/oauth_access_token");

  url.searchParams.set("client_id", APP_ID);
  url.searchParams.set("client_secret", APP_SECRET);
  url.searchParams.set("code", code);

  try {
    const req = new Request(url.toString(), { method: "GET" });
    const res = await fetch(req);

    if (!res.ok) {
      const errorDetail = await res.text();
      console.error("OAuth exchange failed:", errorDetail);
      throw new Error("Failed to exchange auth code for business token");
    }

    const data: { access_token: string } = await res.json();

    return {
      success: true,
      businessToken: data.access_token,
    };
  } catch (error: any) {
    console.error("OAuth exchange error:", error);
    return {
      success: false,
      error: error?.message || "Unknown error",
    };
  }
}
