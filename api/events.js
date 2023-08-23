const express = require('express');
const { getAllEvents, getAllFutureEvents, getEventsByBuddy, getEventsByBothBuddies, getEventsByCodeLanguage, getEventsByBothCodeLanguages, createEvent } = require('../db/events');
const { getScheduleWithEventsByUserId } = require('../db/schedules');
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

// * Get Events by User /api/events/my_schedule
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

// ! Get All Schedules 

// ! Sign up for Event - Not Acting as buddy 

// ! Second Buddy Sign up - Still need DB Function

// ! Cancel registration for event - Still need DB Function




module.exports = eventsRouter;