const firebaseAdmin = require("firebase-admin");
// const moment = require('moment-timezone');
const nodemailer = require('nodemailer');
const { google } = require("googleapis");
const nodeSchedule = require('node-schedule');
const OAuth2 = google.auth.OAuth2


// Firebase Admin SDK initialization using environment variable for security
const serviceAccount = require('adminsdk code acess');
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount)
});

const db = firebaseAdmin.firestore();

async function mergeCollections() {
  try {
    const todos = {};
    const titlesSnapshot = await db.collection('todo_titles').get();
    const itemsSnapshot = await db.collection('todo_items').get();
    const remindersSnapshot = await db.collection('todo_reminders').get();

    if (titlesSnapshot.empty) {
      console.log('No titles found in todo_titles collection.');
    }
    if (itemsSnapshot.empty) {
      console.log('No items found in todo_items collection.');
    }
    if (remindersSnapshot.empty) {
      console.log('No reminders found in todo_reminders collection.');
    }

    // Create a map of titles
    titlesSnapshot.forEach(doc => {
      const data = doc.data();
      todos[doc.id] = { ...data, items: [], reminders: [] };
      console.log(`Processing title: ${doc.id}`);
    });

    // Append items to their respective titles
    itemsSnapshot.forEach(doc => {
      const item = doc.data();
      if (todos[item.titleId]) {
        todos[item.titleId].items.push(item);
        console.log(`Added item ${doc.id} to title ${item.titleId}`);
      } else {
        console.log(`Orphan item found: ${doc.id}, titleId: ${item.titleId} not found`);
      }
    });

    // Append reminders to their respective titles
    remindersSnapshot.forEach(doc => {
      const reminder = doc.data();
      if (todos[reminder.titleId]) {
        todos[reminder.titleId].reminders.push({ ...reminder, id: doc.id });
        console.log(`Added reminder ${doc.id} to title ${reminder.titleId}`);
      } else {
        console.log(`Orphan reminder found: ${doc.id}, titleId: ${reminder.titleId} not found`);
      }
    });

    // Save the new structure in the "todos" collection
    for (const [id, todo] of Object.entries(todos)) {
      await db.collection('todos').doc(id).set(todo);
      console.log(`Todo ${id} with items and reminders saved successfully`);
    }

    console.log('Data merged successfully!');
  } catch (error) {
    console.error('Failed to merge collections:', error);
  }
}

mergeCollections();

// let transporter = nodemailer.createTransport({
//   service: 'gmail',
//   port: 587,
//   secure: false,
//   auth: {
//     user: '',
//     pass: ''
//   }
// });


// // Nodemailer transporter configuration using environment variables
// Correct use of async/await for the accessToken retrieval
const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    "relative code for oauth2client connection"
  );

  oauth2Client.setCredentials({
    refresh_token: "place your refresh token"
  });

  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        console.error("Error obtaining access token:", err);
        reject(err);
      } else {
        console.log("Access token obtained:", token);
        resolve(token);
      }
    });
  });

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: '',
      accessToken,
      clientId: "",
      clientSecret: "",
      refreshToken: ""
    }
  });

  return transporter;
};

async function scheduleEmailReminders() {
  const todosRef = db.collection('todos');
  const snapshot = await todosRef.get();

  if (snapshot.empty) {
    console.log('No todos found for scheduling.');
    return;
  }

  // Clear all previously scheduled jobs before scheduling new ones
  nodeSchedule.scheduledJobs = {};

  snapshot.forEach(doc => {
    const todo = doc.data();
    // Iterate over each reminder in the reminders array
    if (todo.reminders && todo.reminders.length > 0) {
      todo.reminders.forEach(reminder => {
        // Reminder Date Times are assumed to be an array of timestamp objects
        console.log(reminder.reminderDateTimes);
        reminder.reminderDateTimes.forEach(dateTime => {
          const date = dateTime.toDate(); // Convert Firestore Timestamp to JavaScript Date object
          console.log(`Scheduling email for todo with titleId: ${reminder.titleId} at ${date.toString()}`);
          nodeSchedule.scheduleJob(date, () => {
            sendTodoByEmail(reminder.titleId, reminder.email);
          });
        });
      });
    } else {
      console.log(`No reminders found for todo with titleId: ${doc.id}`);
    }
  });
}

function formatDate(dateStr) {
  // Split the input date string "yyyy-mm-dd"
  const parts = dateStr.split('-');
  // Reformat to "mm-dd-yyyy"
  const formattedDate = `${parts[1]}-${parts[2]}-${parts[0]}`;
  return formattedDate;
}

function formatTime(timeStr) {
  // Split the time string into its components
  const [hour, minute] = timeStr.split(':');

  // Convert hour component from string to number
  const hours = parseInt(hour, 10);
  const suffix = hours >= 12 ? "PM" : "AM";

  // Convert hour to 12-hour format
  const adjustedHour = hours % 12 || 12; // Converts "00" to "12"

  // Format the adjusted hour to always have at least two digits
  const formattedHour = adjustedHour.toString().padStart(2, '0');

  // Return the formatted time string
  return `${formattedHour}:${minute} ${suffix}`;
}

async function sendTodoByEmail(titleId, userEmail) {
  const todoRef = db.collection('todos').doc(titleId);
  const doc = await todoRef.get();

  if (!doc.exists) {
    console.log(`No todo found with titleId: ${titleId}`);
    return;
  }

  const todo = doc.data();
  let item = todo.items[0];
  const htmlContent = `
  <div style="margin-bottom: 20px; background-color: #26234f; padding: 20px; border: 1px solid #b3aee0; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
    <h2 style="color: white; font-size: 2rem; font-weight: bold; margin-bottom: 10px;">TITLE: ${todo.title}</h2>
    <ul style="list-style-type: none; padding: 0; margin: 0; font-size: 1.5rem; line-height: 1.5;">
        <div style="background-color: #a9a0d9; padding: 15px; border: 1px solid #c2b9e5; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <li>
                <strong>Task:</strong> ${item.task}<br>
                <strong>Description:</strong> ${item.description}<br>
                <strong>Scheduled on:</strong> ${formatDate(item.scheduledDate)}<br>
                <strong>Scheduled at:</strong> ${formatTime(item.scheduledTime)}
            </li>
        </div>
    </ul>
</div>

  `;

  // Assuming createTransporter is already defined and correctly sets up a nodemailer transporter
  const transporter = await createTransporter();
  try {
    await transporter.sendMail({
      from: `""`,
      to: userEmail,
      subject: `Reminder: Your Upcoming ${todo.title} task`,
      html: `<h1 style="font-size: 3 rem; font-weight: bold; margin-bottom: 10px;">Your Task details:</h1>${htmlContent}`
    });

    console.log(`Email sent successfully to ${userEmail}`);
  } catch (error) {
    console.error(`Error sending email to ${userEmail}:`, error);
  }
}

// Call the schedule function when appropriate in your application setup
scheduleEmailReminders().catch(console.error);