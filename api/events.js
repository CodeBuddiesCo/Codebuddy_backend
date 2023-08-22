const express = require('express');
const { getAllEvents, getAllFutureEvents, getEventsByBuddy, getEventsByBothBuddies } = require('../db/events');
const { requireUser, requireAdmin } = require('./utils');
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

// * Get Events by Buddy /api/:buddy
eventsRouter.get("/:buddy", async (req, res, next) =>{
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

// ? Working but thinking about additional behaviors to search by the buddies individually if events not found together
// * Get Events by Both Buddies /api/:buddy_one/:buddy_two
eventsRouter.get("/:buddy_one/:buddy_two", async (req, res, next) =>{
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

// ! Get Events by User

// ! Get Events by Primary Language 

// ! Get Events by Both Languages 

// ! Create Event

// ! Sign up for Event - Non Buddy 

// ! Second Buddy Sign up - Still need DB Function

// ! Cancel registration for event - Still need DB Function




module.exports = eventsRouter;