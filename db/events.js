const db = require("./db")

// * creates a new event - working
async function createEvent(event) {
  try {
    
    const {buddy_one, buddy_two, primary_language, secondary_language, date_time, spots_available, meeting_link} = event
    console.log(event)
    const [results,rows,fields] = await db.execute(`
      INSERT INTO events (buddy_one, buddy_two, primary_language, secondary_language, date_time, spots_available, meeting_link) 
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `, [buddy_one, buddy_two, primary_language, secondary_language, date_time, spots_available, meeting_link],
    );

    const [newEvent] = await db.execute(`
      SELECT * 
      FROM events
      WHERE buddy_one='${buddy_one}';`,
    );

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

// * gets a single event data by ID - working returns array
async function getEventById(id) {

  try {

    const [event] = await db.execute(`
      SELECT *
      FROM events
      WHERE id = "${id}";`
    );

    console.log("Event by Id", id, "->", event);
    return event;

  } catch (error) {
    console.error("Error getting event by Id", id);
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

// ! updates an existing event


// ! Deletes and event 


// ! search for specific event

module.exports = {
 createEvent,
 getAllEvents,
 getAllFutureEvents,
 getEventById,
 getEventsByBuddy,
 getEventsByCodeLanguage,
 getEventsByBothCodeLanguages,
};