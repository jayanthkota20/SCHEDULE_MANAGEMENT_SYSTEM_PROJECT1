export class ToDoReminderData {
    constructor({ email, titleId, uid, reminderDateTime }) {
        this.email = email;
        this.titleId = titleId;
        this.uid = uid;
        this.reminderDateTime = reminderDateTime; // Ensure these keys match the data object you're passing
    }

    toFirestore() {
        return {
            email: this.email,
            titleId: this.titleId,
            uid: this.uid,
            reminderDateTime: this.reminderDateTime
        };
    }
}


export class ToDoReminder {
    constructor({ email, titleId, uid, reminderDateTime }) {
        this.data = new ToDoReminderData({ email, titleId, uid, reminderDateTime });
    }

    toFirestore() {
        return {
            ...this.data.toFirestore(),
        };
    }
}
