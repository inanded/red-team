import { google } from "googleapis";

// Intentionally vulnerable: the OAuth client requests drive.readonly and
// gmail.readonly scopes even though every caller below only reads calendar
// events. An attacker who compromises the resulting token would gain Drive
// and Gmail read access the app itself never exercises.
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  process.env.GOOGLE_OAUTH_REDIRECT_URI,
);

export const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
];

export function getAuthorizationUrl(state: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: GOOGLE_OAUTH_SCOPES,
    state,
  });
}

export async function listUpcomingEvents(accessToken: string) {
  oauth2Client.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: "startTime",
  });
  return res.data.items ?? [];
}
