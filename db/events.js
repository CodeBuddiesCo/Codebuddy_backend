const db = require("./db");
const { getScheduleByUserId, getScheduleOwnerByScheduleId } = require("./schedules");
const { addBuddyEventToBuddySchedule, getEventById } = require("./schedule_events");
const { getUserbyUserName } = require("./users");
 
// * API creates a new event and adds the event to the schedule of the buddy that created it and second buddy if listed- working 
async function createEvent(event) {
  try {
    
    const {buddy_one, buddy_two, primary_language, secondary_language, date_time, spots_available, meeting_link} = event
    
    await db.execute(`
      INSERT INTO events (buddy_one, buddy_two, primary_language, secondary_language, date_time, spots_available, meeting_link) 
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `, [buddy_one, buddy_two, primary_language, secondary_language, date_time, spots_available, meeting_link],
    );

    const [newEvent] = await db.execute(`
      SELECT * 
      FROM events
      WHERE id=LAST_INSERT_ID();`,
    );
    
    const eventId = newEvent[0].id
    const userOneToAddEventTo = await getUserbyUserName(buddy_one);
    const userIdOne = userOneToAddEventTo[0].id
    const userScheduleToAddEventTo = await getScheduleByUserId(userIdOne);
    const scheduleIdBuddyOne = userScheduleToAddEventTo[0].id

    if (scheduleIdBuddyOne) {
      await addBuddyEventToBuddySchedule(scheduleIdBuddyOne, eventId);
    }

    if (buddy_two !== "open" && buddy_two !== "closed" && buddy_two !== null) {
      console.log("🚀 ~ file: events.js:36 ~ createEvent ~ buddy_two:", buddy_two)
      const userTwoToAddEventTo = await getUserbyUserName(buddy_two);
      const userIdTwo = userTwoToAddEventTo[0].id
      const userScheduleToAddEventTo = await getScheduleByUserId(userIdTwo);
      const scheduleIdBuddyTwo = userScheduleToAddEventTo[0].id
  
      if (scheduleIdBuddyTwo) {
        await addBuddyEventToBuddySchedule(scheduleIdBuddyTwo, eventId);
      }
    }
    
    console.log("Added Event Details ->", newEvent); 
    return newEvent;

  } catch (error) {
    console.error("error adding event");
    throw error;
  }
}

// * NO API working to return an object of the event details with an attached array of every user that is signed up to attend - will be helper function for other event functions
async function getEventAndAttendees(eventId) {
  try {
    const scheduleIdsWithSelectedEvent = [];
    let attendeeArray = [];

    const [schedulesWithSelectedEvent] = await db.execute(
      `
        SELECT schedule_events.schedule_id, schedule_events.event_id
        FROM schedule_events 
        INNER JOIN events ON schedule_events.event_id = events.id
        WHERE schedule_events.event_id='${eventId}';
      `
    );
      
    schedulesWithSelectedEvent.map(event => scheduleIdsWithSelectedEvent.push(event.schedule_id))
    
    await Promise.all(scheduleIdsWithSelectedEvent.map(async (id) => {
      const attendee = await getScheduleOwnerByScheduleId(id);
      attendeeArray.push(attendee);
    }))

    const [event] = await getEventById(eventId);
    
    event.attendees = attendeeArray;

    console.log(scheduleIdsWithSelectedEvent)
    console.log("Event with attendees->", event); 
    return event;

  } catch (error) {
    console.error("error getting event with attendees");
    throw error;
  }
}

// * API retrieves all events with attendees - Returns an array of events
async function getAllEvents() {

  try {
    const eventIdArray = []
    const allEvents = []

    const [events] = await db.execute(`
      SELECT *
      FROM events;`
    );

    events.map(event => eventIdArray.push(event.id))

    await Promise.all (eventIdArray.map(async(id) => {
      const event = await getEventAndAttendees(id);
      allEvents.push(event)
    }))
      

    console.log("All Events ->", allEvents);
    return allEvents;

  } catch (error) {
    console.error("Error getting all Events");
    throw error;
  }

}

// * API retrieves all future events with attendees - Returns an array of events
async function getAllFutureEvents() {

  const date = new Date().toJSON();

  try {

    const eventIdArray = []
    const allEvents = []
    
    const [events] = await db.execute(`
      SELECT *
      FROM events
      WHERE date_time > "${date}";`
    );
    
    events.map(event => eventIdArray.push(event.id))

    await Promise.all (eventIdArray.map(async(id) => {
      const event = await getEventAndAttendees(id);
      allEvents.push(event)
    }))

    console.log("Upcoming Events ->", allEvents);
    return allEvents;

  } catch (error) {
    console.error("Error getting upcoming events");
    throw error;
  }

}

// * API Retrieves a list of events that belong to a specific Buddy with attendees - returns an array of events
async function getEventsByBuddy(buddyName) {

  try {
    const eventIdArray = []
    const allEvents = []

    const [events] = await db.execute(`
      SELECT *
      FROM events
      WHERE buddy_one = "${buddyName}" OR buddy_two = "${buddyName}";`
    );

    events.map(event => eventIdArray.push(event.id))

    await Promise.all (eventIdArray.map(async(id) => {
      const event = await getEventAndAttendees(id);
      allEvents.push(event)
    }))

    console.log("Events by Buddy,", buddyName, "->", allEvents);
    return allEvents;

  } catch (error) {
    console.error("Error getting event by Buddy", buddyName);
    throw error;
  }

}

// * API Retrieves a list of events that belong to two Specific Buddies with attendees - returns an array of events
async function getEventsByBothBuddies(buddyOne, buddyTwo) {

  try {
    const eventIdArray = []
    const allEvents = []

    const [events] = await db.execute(`
    SELECT *
    FROM events
    WHERE buddy_one = "${buddyOne}" AND buddy_two = "${buddyTwo}"
    OR buddy_one = "${buddyTwo}" AND buddy_two = "${buddyOne}";`
  );

    events.map(event => eventIdArray.push(event.id))

    await Promise.all (eventIdArray.map(async(id) => {
      const event = await getEventAndAttendees(id);
      allEvents.push(event)
    }))

    console.log("Events by Buddies,", buddyOne, "&", buddyTwo, "->", allEvents);
    return allEvents;

  } catch (error) {
    console.error("Error getting event by Buddies", buddyOne, "&", buddyTwo);
    throw error;
  }

}

// * API Retrieves a list of events that belong to a specific code language with list of attendees - working returns an array of events
async function getEventsByCodeLanguage(codeLanguage) {

  try {
    const eventIdArray = []
    const allEvents = []

    const [events] = await db.execute(`
      SELECT *
      FROM events
      WHERE primary_language = "${codeLanguage}" OR secondary_language = "${codeLanguage}";`
    );

    events.map(event => eventIdArray.push(event.id))

    await Promise.all (eventIdArray.map(async(id) => {
      const event = await getEventAndAttendees(id);
      allEvents.push(event)
    }))

    console.log("Events by Code Language,", codeLanguage, "->", allEvents);
    return allEvents;

  } catch (error) {
    console.error("Error getting event by code language", codeLanguage);
    throw error;
  }

}

// * API Retrieves a list of events that match both primary and secondary code languages with attendees - returns an array of events 
async function getEventsByBothCodeLanguages(codeLanguageOne, codeLanguageTwo) {

  try {
    const eventIdArray = []
    const allEvents = []

    const [events] = await db.execute(`
      SELECT *
      FROM events
      WHERE primary_language = "${codeLanguageOne}" AND secondary_language = "${codeLanguageTwo}"
      OR primary_language = "${codeLanguageTwo}" AND secondary_language = "${codeLanguageOne}";`
    );

    events.map(event => eventIdArray.push(event.id))

    await Promise.all (eventIdArray.map(async(id) => {
      const event = await getEventAndAttendees(id);
      allEvents.push(event)
    }))

    console.log("Events by Code Languages,", codeLanguageOne, "&", codeLanguageTwo, "->", allEvents);
    return allEvents

  } catch (error) {
    console.error("Error getting event by code languages", codeLanguageOne, "&", codeLanguageTwo);
    throw error;
  }

}

// ? Deletes an event - This worked but only to delete an event that is not connected to a schedule - I think i need to add
// ? additional code to first delete the schedule_event before fully deleting the event
async function deleteEvent(eventId){
  try {

    const [results,rows,fields] = await db.execute(`
      DELETE FROM events 
      WHERE id="${eventId}";`
    );



    console.log("Status of event deletion request ->", results);
    return;

  } catch (error) {
    console.error("DB error deleting event");
    throw error;
  }
}

// ! second Buddy sign up - after the fact

// ! get all events where buddy Two is still available 

// ! updates an existing event

// ! search for specific event

module.exports = {
 createEvent,
 getAllEvents,
 getAllFutureEvents,
 getEventsByBuddy,
 getEventsByCodeLanguage,
 getEventsByBothCodeLanguages,
 getEventAndAttendees,
 deleteEvent,
 getEventsByBothBuddies
};