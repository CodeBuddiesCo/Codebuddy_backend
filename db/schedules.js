const db = require("./db")

// * creates a schedule to contain events they registered for - working returns []
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

// !! need to edit this to add a map of the results through getScheduleById() 
async function getAllSchedules() {

  try {
    const [schedules] = await db.execute(`
      SELECT *
      FROM schedules;`
    );

    console.log("All schedules ->", schedules);
    return schedules;

  } catch (error) {
    console.error("Error getting all Schedules");
    throw error;
  }

}

// * Helper function that connects the schedule with the user and links the scheduled events
async function getScheduleById(id) {
  try {
    const [userSchedule] = await db.execute(
      `
        SELECT schedules.*, users.username AS owner_name
        FROM schedules 
        INNER JOIN users ON schedules.user_id = users.id
        WHERE schedules.id='${id}';
      `
    );

    if (userSchedule){
      const [matchingEvents] = await db.execute(
        `
          SELECT events.*, schedule_events.id AS schedule_events_id,
          schedule_events.event_id 
          FROM events
          INNER JOIN schedule_events ON schedule_events.event_id = events.id
          WHERE schedule_events.schedule_id='${id}';
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

async function getScheduleByUserId(user_id) {
  try {

    const [scheduleByUserId] = await db.execute(`
      SELECT *
      FROM schedules
      WHERE user_id = "${user_id}";`
    );

    console.log("Schedule by User Id", user_id, "->", scheduleByUserId);
    return scheduleByUserId;

  } catch (error) {
    console.error("Error getting event by Id", id);
    throw error;
  }
}

// createSchedule(1),
// createSchedule(2),
getScheduleById(2)
// getAllSchedules()

module.exports = {
  createSchedule,
  getScheduleById,
  getAllSchedules,
  getScheduleByUserId

};