const db = require("./db");


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

// * connects an event to a schedule when they create it (buddy only) - Does not deplete open spots
async function addBuddyEventToBuddySchedule(scheduleId, eventId) {
  try {
    
    const [results,rows,fields] = await db.execute(
      `
        INSERT INTO schedule_events (schedule_id, event_id) 
        VALUES (?, ?);
      `, [scheduleId, eventId],
    );

    const [newScheduleEvent] = await db.execute(
      `
        SELECT * 
        FROM schedule_events
        WHERE id=LAST_INSERT_ID();
      `
    );

    console.log("New Schedule Event ->", newScheduleEvent); 
    return newScheduleEvent;

  } catch (error) {
    console.error("error adding buddy event to buddy schedule");
    throw error;
  }
}

// * connects an event to a schedule when they sign up - Depletes open spots
async function addEventToSchedule(scheduleId, eventId) {
  try {
    const requestedEvent = await getEventById(eventId);
    const availability = requestedEvent[0].spots_available
    console.log("Requested Event availability ->", availability)

    if (availability > 0) {
      await db.execute(
        `
          INSERT INTO schedule_events (schedule_id, event_id) 
          VALUES (?, ?);
        `, [scheduleId, eventId],
      );

      const [newScheduleEvent] = await db.execute(
        `
          SELECT * 
          FROM schedule_events
          WHERE id=LAST_INSERT_ID();
        `
      );
  
      console.log("New Schedule Event ->", newScheduleEvent); 

      const newAvailability = availability-1

      await db.execute(
        `
          UPDATE events
          SET spots_available='${newAvailability}' 
          WHERE id='${eventId}';
        `,
      );

      const [updatedEvent] = await db.execute(
        `
          SELECT * 
          FROM events
          WHERE id='${eventId}';
        `
      );

      console.log("event with new Availability ->", updatedEvent); 
      return;

    } else {
      console.log("The requested event does not have space available");
      return;
    }

  } catch (error) {
    console.error("error adding event to schedule");
    throw error;
  }
}


// addBuddyEventToBuddySchedule(1, 2)
// addEventToSchedule(2, 1)


module.exports = {
  addEventToSchedule,
  addBuddyEventToBuddySchedule

};