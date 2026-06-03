import { google } from "googleapis";
import { prisma } from "./prisma";

export async function getGoogleCalendarClient(userId: string) {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: "google",
    },
  });

  if (!account || !account.access_token) {
    throw new Error("No Google account connected");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

export interface CalendarEvent {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

export async function createCalendarEvent(userId: string, event: CalendarEvent) {
  const calendar = await getGoogleCalendarClient(userId);

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
  });

  return response.data;
}

export async function updateCalendarEvent(
  userId: string,
  eventId: string,
  event: CalendarEvent
) {
  const calendar = await getGoogleCalendarClient(userId);

  const response = await calendar.events.update({
    calendarId: "primary",
    eventId,
    requestBody: event,
  });

  return response.data;
}

export async function deleteCalendarEvent(userId: string, eventId: string) {
  const calendar = await getGoogleCalendarClient(userId);

  await calendar.events.delete({
    calendarId: "primary",
    eventId,
  });
}

export async function getCalendarEvent(userId: string, eventId: string) {
  const calendar = await getGoogleCalendarClient(userId);

  try {
    const response = await calendar.events.get({
      calendarId: "primary",
      eventId,
    });

    return response.data;
  } catch (error: any) {
    // Event not found (404) or deleted
    if (error.code === 404 || error.status === 404) {
      return null;
    }
    throw error;
  }
}
