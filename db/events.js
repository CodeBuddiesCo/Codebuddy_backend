const db = require("./db")

// ! creates a new event 
async function createEvent(event) {
  try {
    
    const {buddy_one, buddy_two, primary_language, secondary_language, date_time, spots_available, meeting_link} = event
    console.log(event)
    const [results,rows,fields] = await db.execute(`
      INSERT INTO events (buddy_one, buddy_two, primary_language, secondary_language, date_time, spots_available, meeting_link) 
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `, [buddy_one, buddy_two, primary_language, secondary_language, date_time, spots_available, meeting_link],
    );

    const [data] = await db.execute(`
      SELECT * 
      FROM events
      WHERE buddy_one='${buddy_one}';`,
    );

    console.log("Added Event Details ->", data); 

  } catch (error) {
    console.error("error adding event");
    throw error;
  }
}

// ! retrieves all events 


// ! retrieves all future events


// ! gets a single events data by ID


// ! Retrieves a list of events that belong to a specific language


// ! Retrieves a list of events that belong to a specific buddy 


// ! updates an existing event


// ! Deletes and event 


// ! search for specific event

module.exports = {
 createEvent,
};