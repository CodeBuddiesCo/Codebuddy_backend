const db = require("./db")

// * No API creates a schedule to contain events they registered for - working returns []
async function createSchedule(userId) {
  try {
    
    const [results,rows,fields] = await db.execute(
      `
        INSERT INTO schedules (user_id) 
        VALUES (?);
      `, [userId],
    );

    const [newSchedule] = await db.execute(
      `
        SELECT * 
        FROM schedules
        WHERE id=LAST_INSERT_ID();
      `
    );

    console.log("New Schedule ->", newSchedule); 
    return newSchedule;

  } catch (error) {
    console.error("error adding event");
    throw error;
  }
}

// * No API Helper function that connects the schedule with the user and links the scheduled events
async function attachEventsToScheduleById(scheduleId) {
  try {
    const [userSchedule] = await db.execute(
      `
        SELECT schedules.id AS schedule_id, schedules.user_id, users.username AS owner_name
        FROM schedules 
        INNER JOIN users ON schedules.user_id = users.id
        WHERE schedules.id='${scheduleId}';
      `
    );

    if (userSchedule){
      const [matchingEvents] = await db.execute(
        `
          SELECT events.id AS event_id, events.buddy_one, events.buddy_two, events.primary_language, events.secondary_language,
          events.date_time, events.spots_available, events.meeting_link, schedule_events.id AS schedule_events_id
          FROM events
          INNER JOIN schedule_events ON schedule_events.event_id = events.id
          WHERE schedule_events.schedule_id='${scheduleId}';
        `
      );

      // const userSchedule = scheduleWithUser[1];
      userSchedule[0].events = matchingEvents;

      console.log("Schedule with User and Matching events->", userSchedule[0]); 
      return userSchedule[0];

    }

  } catch (error) {
    console.error("error getting schedule by Id");
    throw error;
  }
}

// ? API Working and returning an array of all schedules with connected events 
async function getAllSchedules() {

  try {
    const scheduleIdArray = []
    const allSchedules = []

    const [schedules] = await db.execute(`
      SELECT *
      FROM schedules;`
    );

    schedules.map(schedule => scheduleIdArray.push(schedule.id))

    await Promise.all (scheduleIdArray.map(async(id) => {
      const schedule = await attachEventsToScheduleById(id);
      allSchedules.push(schedule)
    }))

    console.log("All schedules ->", allSchedules);
    return allSchedules;

  } catch (error) {
    console.error("Error getting all Schedules");
    throw error;
  }

}

// * API Working and returns an array with the users Schedule with enrolled Events
async function getScheduleWithEventsByUserId(userId) {
  try {
    const scheduleIdArray = []
    const allSchedules = []

    const [schedules] = await db.execute(`
      SELECT *
      FROM schedules
      WHERE user_id = "${userId}";`
    );

    schedules.map(schedule => scheduleIdArray.push(schedule.id))

    await Promise.all (scheduleIdArray.map(async(id) => {
      const schedule = await attachEventsToScheduleById(id);
      allSchedules.push(schedule)
    }))

    console.log("Schedule by User Id", userId, "->", allSchedules);
    return allSchedules;

  } catch (error) {
    console.error("Error getting schedule by user id", userId);
    throw error;
  }
}

// * No API working as a helper function in create event - does not get connected events
async function getScheduleByUserId(userId) {
  try {

    const [scheduleByUserId] = await db.execute(`
      SELECT *
      FROM schedules
      WHERE user_id = "${userId}";`
    );

    console.log("Schedule by User Id", userId, "->", scheduleByUserId);
    return scheduleByUserId;

  } catch (error) {
    console.error("Error getting schedule by user id", userId);
    throw error;
  }
}

// * NO API returns an array only of all schedule data with matching id - Does not include events attached to schedule
async function getScheduleById(id) {
  try {

    const [scheduleById] = await db.execute(`
      SELECT *
      FROM schedules
      WHERE id = "${id}";`
    );

    console.log("Schedule by Id", id, "->", scheduleById);
    return scheduleById;

  } catch (error) {
    console.error("Error getting schedule by id", id);
    throw error;
  }
}

// * NO API working as a helper function in getEventAndAttendees - returns only the name of the schedule owner for a specific schedule Id
async function getScheduleOwnerByScheduleId(id) {
  try {

    const [scheduleOwner] = await db.execute(`
      SELECT users.username
      FROM schedules
      INNER JOIN users ON schedules.user_id = users.id
      WHERE schedules.id = "${id}";`
    );

    console.log("Schedule id", id, "owner ->", scheduleOwner[0].username);
    return scheduleOwner[0].username;

  } catch (error) {
    console.error("Error getting schedule by Id with User", id);
    throw error;
  }
}

// ! Delete Schedule 

module.exports = {
  createSchedule,
  attachEventsToScheduleById,
  getScheduleById,
  getAllSchedules,
  getScheduleOwnerByScheduleId,
  getScheduleByUserId,
  getScheduleWithEventsByUserId

};