const express = require('express');
const { getAllEvents, getAllFutureEvents, getEventsByBuddy, getEventsByBothBuddies, getEventsByCodeLanguage, getEventsByBothCodeLanguages, createEvent, getEventAndAttendees } = require('../db/events');
const { getScheduleWithEventsByUserId, getAllSchedules, getScheduleByUserId } = require('../db/schedules');
const { secondBuddySignUp, addEventToSchedule } = require('../db/schedule_events');
const { requireUser, requireAdmin, requireBuddy } = require('./utils');
const eventsRouter = express.Router();

// * Get all Events - /api/events
eventsRouter.get("/", async (req, res, next) =>{
  
  try {
    
    const allEvents = await getAllEvents();
    res.send(allEvents)

  } catch (error) {
    next (error);
  }

})

// * Get Upcoming Events - /api/events/upcoming
eventsRouter.get("/upcoming", async (req, res, next) =>{
  
  try {
    
    const allEvents = await getAllFutureEvents();
    res.send(allEvents)

  } catch (error) {
    next (error);
  }

})

// * Get Events by Buddy /api/events/search_by_buddy/:buddy
eventsRouter.get("/search_by_buddy/:buddy", async (req, res, next) =>{
  const { buddy } = req.params 

  try {
    
    const allEvents = await getEventsByBuddy(buddy);

    if (allEvents.length === 0 ) {

      next({
        error: "NotFoundError",
        message: `No Events for Buddy, ${buddy}, found`,
      });

    } else {

      res.send(allEvents)

    }

  } catch (error) {
    next (error);
  }

})

// * Get Events by Both Buddies /api/events/search_by_buddy/:buddy_one/:buddy_two
eventsRouter.get("/search_by_buddy/:buddy_one/:buddy_two", async (req, res, next) =>{
  const { buddy_one, buddy_two } = req.params 

  try {
    
    const allEvents = await getEventsByBothBuddies(buddy_one, buddy_two);

    if (allEvents.length === 0 ) {

      next({
        error: "NotFoundError",
        message: `No Events for Buddies, ${buddy_one}, &, ${buddy_two} found`,
      });

    } else {

      res.send(allEvents)

    }

  } catch (error) {
    next (error);
  }

})

// * Get Schedule with Events by User /api/events/my_schedule
eventsRouter.get("/my_schedule", requireUser, async (req, res, next) =>{

  try {

    const [userEvents] = await getScheduleWithEventsByUserId(req.user.id)
    console.log("🚀 events.js:97_eventsRouter.get_userEvents:", userEvents)
    
    res.send(userEvents)

  } catch (error) {
    next (error);
  }

})

// * Get Events by Primary Language /api/events/search_by_code_language/:language
eventsRouter.get("/search_by_code_language/:language", async (req, res, next) =>{
  const { language } = req.params 

  try {
    
    const allEvents = await getEventsByCodeLanguage(language);

    if (allEvents.length === 0 ) {

      next({
        error: "NotFoundError",
        message: `No Events for code language, ${language}, found`,
      });

    } else {

      res.send(allEvents)

    }

  } catch (error) {
    next (error);
  }

})

// * Get Events by Both Languages /api/events/search_by_code_language/:language_one/:language_two
eventsRouter.get("/search_by_code_language/:language_one/:language_two", async (req, res, next) =>{
  const { language_one, language_two } = req.params 

  try {
    
    const allEvents = await getEventsByBothCodeLanguages(language_one, language_two)

    if (allEvents.length === 0 ) {

      next({
        error: "NotFoundError",
        message: `No Events for code languages, ${language_one}, &, ${language_two} found`,
      });

    } else {

      res.send(allEvents)

    }

  } catch (error) {
    next (error);
  }

})

// * Create Event /api/events/
eventsRouter.post("/", requireBuddy, async (req, res, next) =>{
  const eventData = req.body;

  try {

    const newEvent = await createEvent(eventData);
    res.send(newEvent);

  } catch (error) {
    next (error)
  }

})

// * Get All Schedules /api/schedules 
eventsRouter.get("/schedules", requireAdmin, async (req, res, next) => {

  try {

    const allSchedules = await getAllSchedules();
    res.send(allSchedules)
    
  } catch (error) {
    next (error)
  }

})

// * Get all Events - /api/events
eventsRouter.get("/", async (req, res, next) =>{
  
  try {
    
    const allEvents = await getAllEvents();
    res.send(allEvents)

  } catch (error) {
    next (error);
  }

})

// * Get Event by Event Id /api/events/search_by_id/:eventId
eventsRouter.get("/search_by_id/:eventId", async (req, res, next) =>{
  const { eventId } = req.params

  try {
    
    const eventById = await getEventAndAttendees(eventId)
    res.send(eventById)

  } catch (error) {
    next (error);
  }

})

// ! Sign up for Event - Not Acting as buddy  
eventsRouter.post("/signup/:eventId", requireUser, async (req, res, next) => {
  const { id } = req.user;
  console.log("🚀 ~ file: events.js:221 ~ eventsRouter.post ~ userId:", id)
  const { eventId } = req.params;

  
  try {

    const schedule = await getScheduleByUserId(id)
    const scheduleId = schedule.id;

    if (scheduleId) {

      const enrolledEvent = await addEventToSchedule(scheduleId, eventId);
      res.send(enrolledEvent)

    } else {

      next({
        error: "NotFoundError",
        message: `No schedule found to add event`,
      });

    }

    
  } catch (error) {
    next (error)
  }
}) 

// * Second Buddy Sign up api/events/:eventID
eventsRouter.patch("/buddy_signup/:eventId", requireBuddy, async (req, res, next) => {
  const { buddyUserName } = req.body;
  const { eventId } = req.params;

  try {

    const updatedEvent = await secondBuddySignUp(eventId, buddyUserName)
    res.send(updatedEvent)

    
  } catch (error) {
    next (error)
  }

})

// ! Cancel registration for event - Still need DB Function


module.exports = eventsRouter;