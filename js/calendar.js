// Google Calendar API 用の共通モジュール

let accessToken = null;

// 外部からアクセストークンをセットするための関数
export function setCalendarToken(token) {
    accessToken = token;
}

export async function createCalendarEvent(eventData) {
    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
    });
    const data = await res.json();
    return data.id;
}

export async function updateCalendarEvent(eventId, eventData) {
    if (!eventId) return;
    await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
    });
}

export async function deleteCalendarEvent(eventId) {
    if (!eventId) return;
    await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
}

export async function addGuestToCalendarEvent(eventId, emails) {
    if (!eventId || !emails || emails.length === 0) return;

    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const event = await res.json();
    
    event.attendees = event.attendees || [];
    let isUpdated = false;
    
    for (let email of emails) {
        if (!event.attendees.find(a => a.email === email)) {
            event.attendees.push({ email: email });
            isUpdated = true;
        }
    }
    
    if (isUpdated) {
        await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?sendUpdates=all`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(event)
        });
    }
}
