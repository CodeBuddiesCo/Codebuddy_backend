const db = require("./db");
const { getScheduleByUserId } = require("./schedules");
const { addBuddyEventToBuddySchedule } = require("./schedule_events");
const { getUserbyUserName } = require("./users");

// * creates a new event - working
async function createEvent(event) {
  try {
    
    const {buddy_one, buddy_two, primary_language, secondary_language, date_time, spots_available, meeting_link} = event
    
    const [results,rows,fields] = await db.execute(`
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
    console.log(eventId)
    const userToAddEventTo = await getUserbyUserName(buddy_one);
    const userId = userToAddEventTo[0].id
    const userScheduleToAddEventTo = await getScheduleByUserId(userId);
    const scheduleId = userScheduleToAddEventTo[0].id

    console.log(scheduleId)
    if (scheduleId) {
      const addedEvent = await addBuddyEventToBuddySchedule(scheduleId, eventId)
      console.log("results of adding event to buddy Schedule ->", addedEvent); 
    }
    


    console.log("Added Event Details ->", newEvent); 
    return newEvent;

  } catch (error) {
    console.error("error adding event");
    throw error;
  }
}

// * retrieves all events - working returns an array with objects
async function getAllEvents() {

  try {

    const [events] = await db.execute(`
      SELECT *
      FROM events;`
    );

    console.log("All Events ->", events);
    return events;

  } catch (error) {
    console.error("Error getting all Events");
    throw error;
  }

}

// * retrieves all future events - working returns array
async function getAllFutureEvents() {

  const date = new Date().toJSON();

  try {

    const [events] = await db.execute(`
      SELECT *
      FROM events
      WHERE date_time > "${date}";`
    );

    console.log("Upcoming Events ->", events);
    return events;

  } catch (error) {
    console.error("Error getting upcoming events");
    throw error;
  }

}

// * Retrieves a list of events that belong to a specific Buddy
async function getEventsByBuddy(buddyName) {

  try {

    const [events] = await db.execute(`
      SELECT *
      FROM events
      WHERE buddy_one = "${buddyName}" OR buddy_two = "${buddyName}";`
    );

    console.log("Events by Buddy,", buddyName, "->", events);
    return events;

  } catch (error) {
    console.error("Error getting event by Buddy", buddyName);
    throw error;
  }

}

// * Retrieves a list of events that belong to a specific code language - working returns and array
async function getEventsByCodeLanguage(codeLanguage) {

  try {

    const [events] = await db.execute(`
      SELECT *
      FROM events
      WHERE primary_language = "${codeLanguage}" OR secondary_language = "${codeLanguage}";`
    );

    console.log("Events by Code Language,", codeLanguage, "->", events);
    return events;

  } catch (error) {
    console.error("Error getting event by code language", codeLanguage);
    throw error;
  }

}

// * Retrieves a list of events that match both primary and secondary code languages - working returns and array
async function getEventsByBothCodeLanguages(codeLanguageOne, codeLanguageTwo) {

  try {

    const [events] = await db.execute(`
      SELECT *
      FROM events
      WHERE primary_language = "${codeLanguageOne}" AND secondary_language = "${codeLanguageTwo}"
      OR primary_language = "${codeLanguageTwo}" AND secondary_language = "${codeLanguageOne}";`
    );

    console.log("Events by Code Languages,", codeLanguageOne, "&", codeLanguageTwo, "->", events);
    return events

  } catch (error) {
    console.error("Error getting event by code languages", codeLanguageOne, "&", codeLanguageTwo);
    throw error;
  }

}

// ! second Buddy sign up 

// ! updates an existing event

// ? Deletes an event 
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


// ! search for specific event

// createEvent(
//     {
//       buddy_one: 'Catherine', 
//       buddy_two: null,
//       primary_language: 'Node.js',
//       secondary_language: 'MySQL',
//       date_time: '2023-9-7 14:00:00', 
//       spots_available: 3, 
//       meeting_link: 'https://us06web.zoom.us/j/88308212230?pwd=YXh5UWk0WTY2QWQ2S2tPS3BBWUxXdz09'
//     }
//   )
// deleteEvent(6)
// getAllEvents()

module.exports = {
 createEvent,
 getAllEvents,
 getAllFutureEvents,
 getEventsByBuddy,
 getEventsByCodeLanguage,
 getEventsByBothCodeLanguages,
 deleteEvent
};