// firebase-firestore.js
import { serverTimestamp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

import { ToFirestore } from "./ToFirestore.js";

export class ToDoItemData {
    constructor({ email, titleId, uid, task, description, scheduledDate, scheduledTime }) {
        this.email = email;
        this.titleId = titleId;
        this.uid = uid;
        this.task = task;
        this.description = description;
        this.scheduledDate = scheduledDate; // Make sure these names match the keys in the data object you're passing
        this.scheduledTime = scheduledTime;
    }

    toFirestore() {
        return {
            email: this.email,
            titleId: this.titleId,
            uid: this.uid,
            task: this.task,
            description: this.description,
            scheduledDate: this.scheduledDate,
            scheduledTime: this.scheduledTime
        };
    }
}

class ToDoItemTimestamps {
    constructor() {
        this.createdAt = ToFirestore.toFirestore(serverTimestamp());
        this.updatedAt = ToFirestore.toFirestore(serverTimestamp());
    }
}

export class ToDoItem {
    constructor({ email, titleId, uid, task, description, scheduledAt, scheduleTime }) {
        this.data = new ToDoItemData({ email, titleId, uid, task, description, scheduledAt, scheduleTime });
        this.timestamps = new ToDoItemTimestamps();
    }

    toFirestore() {
        return {
            ...this.data.toFirestore(),
            ...this.timestamps
        };
    }
}