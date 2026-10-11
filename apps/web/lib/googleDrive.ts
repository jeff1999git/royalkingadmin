// Saves a CSV into the admin's own Google Drive as a Google Sheet.
//
// Runs entirely in the browser with Google Identity Services: the admin signs
// in with Google in a popup, and the file goes from the browser straight to
// Drive. It uses the drive.file scope, so the app can only see files it
// creates, never the rest of the admin's Drive. The access token is kept in
// memory for this tab only.

const GOOGLE_IDENTITY_SRC = "https://accounts.google.com/gsi/client";
const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const DRIVE_UPLOAD_URL =
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink";

// Public OAuth client ID from Google Cloud (not a secret). See README.
export const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

type TokenResponse = { access_token?: string; expires_in?: number; error?: string };
type TokenClient = { requestAccessToken: () => void };
type GoogleOAuth2 = {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
    error_callback?: (error: { type?: string }) => void;
  }) => TokenClient;
};

declare global {
  interface Window {
    google?: { accounts?: { oauth2?: GoogleOAuth2 } };
  }
}

let scriptPromise: Promise<void> | null = null;

// Loads Google's sign-in script once. Call it early (on page load) so the
// sign-in popup can open straight from the click without being blocked.
export function loadGoogleIdentity(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GOOGLE_IDENTITY_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      script.remove();
      reject(new Error("Couldn't load Google sign-in. Check your connection and try again."));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

// Opens Google sign-in (first time, or after the token expires) and returns an
// access token. Call it directly from a click handler.
export function requestDriveToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return Promise.resolve(cachedToken.value);
  }
  return new Promise((resolve, reject) => {
    const oauth2 = window.google?.accounts?.oauth2;
    if (!oauth2) {
      reject(new Error("Google sign-in didn't load. Check your connection and try again."));
      return;
    }
    oauth2
      .initTokenClient({
        client_id: googleClientId,
        scope: DRIVE_FILE_SCOPE,
        callback: (response) => {
          if (response.error || !response.access_token) {
            reject(new Error("Google didn't allow access to Drive, so nothing was saved."));
            return;
          }
          cachedToken = {
            value: response.access_token,
            expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000,
          };
          resolve(response.access_token);
        },
        error_callback: (error) => {
          reject(
            new Error(
              error.type === "popup_closed"
                ? "Google sign-in was closed before it finished, so nothing was saved."
                : "Couldn't open Google sign-in. Allow pop-ups for this site and try again."
            )
          );
        },
      })
      .requestAccessToken();
  });
}

// Uploads the CSV and lets Drive convert it into a Google Sheet.
export async function saveCsvAsGoogleSheet(
  token: string,
  name: string,
  csv: string
): Promise<{ id: string; webViewLink: string }> {
  const boundary = `rk-sheet-${Date.now().toString(36)}`;
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify({ name, mimeType: "application/vnd.google-apps.spreadsheet" }),
    `--${boundary}`,
    "Content-Type: text/csv; charset=UTF-8",
    "",
    csv,
    `--${boundary}--`,
    "",
  ].join("\r\n");

  const res = await fetch(DRIVE_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (res.status === 401) {
    cachedToken = null;
    throw new Error("Your Google sign-in expired. Tap Save to Google Drive again.");
  }
  if (!res.ok) {
    throw new Error("Google Drive didn't accept the sheet. Please try again.");
  }
  return (await res.json()) as { id: string; webViewLink: string };
}
