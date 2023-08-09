// ! creates a new event 
async function createUser(user) {
  try {
    
    const {name, email, username, password, is_buddy, isAdmin} = user
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const [results,rows,fields] = await db.execute(`
      INSERT INTO users (name, email, username, password, is_buddy, isAdmin) 
      VALUES (?, ?, ?, ?, ?, ?);
    `, [name, email, username, hashedPassword, is_buddy, isAdmin],
    );

    const [data] = await db.execute(`
      SELECT * 
      FROM users
      WHERE username='${username}';`,
    );

    delete data[0].password
    console.log("results:", data); 

  } catch (error) {
    console.error("error adding users");
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