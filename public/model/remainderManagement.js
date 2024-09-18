import { addToDoReminder, updateToDoReminder, hasExistingReminders, getRemindersByTitleID } from "../controller/firestore_controller.js";
import { currentUser } from "../controller/firebase_auth.js";

export function setReminderMenu(cardHeader, Taskdiv, cardTextDiv) {
    const threeDotsMenu = document.createElement('div');
    threeDotsMenu.className = 'dropdown';
    threeDotsMenu.innerHTML = '<span class="text-secondary" style="font-size: larger; color: black;"><b>&#8942;</b></span>';
    threeDotsMenu.setAttribute('data-bs-toggle', 'dropdown');
    threeDotsMenu.setAttribute('aria-expanded', 'false');
    threeDotsMenu.style.flexShrink = '0'; // Prevents the menu from resizing
    cardHeader.appendChild(threeDotsMenu);

    const dropdownMenu = document.createElement('ul');
    dropdownMenu.className = 'dropdown-menu dropdown-menu-end';
    threeDotsMenu.appendChild(dropdownMenu);

    const setReminderItem = document.createElement('li');
    setReminderItem.className = 'dropdown-submenu dropdown-item';

    const a = document.createElement('a');
    a.className = 'dropdown-toggle';
    a.href = "#";
    a.textContent = 'Set Reminder';
    a.setAttribute('data-bs-toggle', 'dropdown');
    setReminderItem.appendChild(a);

    const reminderOptions = document.createElement('ul');
    reminderOptions.className = 'dropdown-menu';

    const options = [
        { text: '2 hours', value: 'twoHours' },
        { text: '2 days', value: 'twoDays' },
        { text: '1 week', value: 'week' },
        { text: 'set all reminders', value: 'allthree' }
    ];

    options.forEach(option => {
        const optionItem = document.createElement('li');
        optionItem.className = 'dropdown-item';
        optionItem.textContent = option.text;
        optionItem.addEventListener('click', async () => {
            const scheduleDateInput = cardTextDiv.querySelector(`input[type="date"]`);
            const scheduleTimeInput = cardTextDiv.querySelector(`input[type="time"]`);
            if (scheduleDateInput && scheduleTimeInput) {
                await setReminder(scheduleDateInput, scheduleTimeInput, option.value, Taskdiv.id); // Assuming div.id is the todoId
                alert(`Reminder set successfully for ${option.text}!`);
            } else {
                console.error("Date or Time input not found!");
            }
        });

        reminderOptions.appendChild(optionItem);
    });

    setReminderItem.appendChild(reminderOptions);
    dropdownMenu.appendChild(setReminderItem);
}

async function setReminder(scheduleDateInput, scheduleTimeInput, reminderType, todoId) {
    const fullDateTime = `${scheduleDateInput.value}T${scheduleTimeInput.value}`;
    const taskDateTime = new Date(fullDateTime);

    // Create a Date object with GMT-5 timezone offset
    const taskDateTimeGMT5 = new Date(taskDateTime.toLocaleString('en-US', { timeZone: 'America/New_York' }));

    let reminderDateTimes = [];

    if (reminderType === 'allthree') {
        reminderDateTimes.push(new Date(taskDateTimeGMT5.getTime() - 7 * 24 * 60 * 60 * 1000)); // 1 week
        reminderDateTimes.push(new Date(taskDateTimeGMT5.getTime() - 2 * 24 * 60 * 60 * 1000)); // 2 days
        reminderDateTimes.push(new Date(taskDateTimeGMT5.getTime() - 2 * 60 * 60 * 1000));     // 2 hours
    } else {
        const offset = {
            week: 7 * 24 * 60 * 60 * 1000,
            twoDays: 2 * 24 * 60 * 60 * 1000,
            twoHours: 2 * 60 * 60 * 1000
        }[reminderType];
        reminderDateTimes.push(new Date(taskDateTime.getTime() - offset));
    }

    const reminderData = {
        email: currentUser.email,
        titleId: todoId,
        uid: currentUser.uid,
        reminderDateTimes: reminderDateTimes.map(dateTime => dateTime) // Storing all dates as an array of strings
    };

    const reminderExists = await hasExistingReminders(todoId, currentUser.uid);
    if (!reminderExists) {
        await createReminder(reminderData);
    } else {
        const reminderId = await getRemindersByTitleID(todoId, currentUser.uid);
        await updateReminder(reminderId, reminderData);
    }
}

async function createReminder(reminderData) {
    try {
        await addToDoReminder(reminderData);
        console.log('Reminder added successfully!');
    } catch (error) {
        console.error('Error adding new reminder:', error);
        alert('Failed to add reminder: ' + error.message);
    }
}

async function updateReminder(reminderIds, reminderData) {
    if (!Array.isArray(reminderIds)) {
        reminderIds = [reminderIds];  // Ensure reminderIds is always an array for consistency
    }

    const updates = reminderIds.map(async (reminderId) => {
        try {
            await updateToDoReminder(reminderId, reminderData);
            console.log("Reminder updated successfully for ID:", reminderId);
        } catch (error) {
            console.error("Error updating reminder for ID", reminderId, ":", error);
        }
    });

    try {
        await Promise.all(updates);
        alert("All reminders updated successfully.");
    } catch (error) {
        alert("Failed to update one or more reminders. Please check the logs.");
    }
}