import { ToFirestore } from "./ToFirestore.js";
// ToDoTitleData class
export class ToDoTitleData {
    constructor({ title, uid, timestamp, category }) {
        this.title = title;
        this.uid = uid;
        this.timestamp = timestamp;
        this.category = category;
    }

    toFirestore() {
        // This method ensures only the data Firestore needs is sent
        return {
            title: this.title,
            uid: this.uid,
            timestamp: this.timestamp || serverTimestamp(), // Use serverTimestamp as fallback
            category: this.category
        };
    }
}

class ToDoTitleDocId {
    constructor(docId) {
        this.docId = docId;
    }

    set_docId(id) {
        this.docId = id;
    }
}

export class ToDoTitle {
    constructor(data, docId) {
        this.data = new ToDoTitleData(data);
        this.docIdHandler = new ToDoTitleDocId(docId);
    }

    set_docId(id) {
        this.docIdHandler.set_docId(id);
    }

    toFirestore() {
        return this.data.toFirestore();
    }
}
