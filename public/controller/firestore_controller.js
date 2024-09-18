import { 
   getFirestore,
   collection,
   addDoc,
   query,
   where,
   orderBy,
   getDocs,
   getDoc,
   updateDoc,
   deleteDoc,
   doc,
   serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js"

const TODO_TITLE_COLLECTION = 'todo_titles';
const TODO_ITEM_COLLECTION = 'todo_items';
const TODO_REMINDER_COLLECTION = "todo_reminders"; 


import { app } from "./firebase_core.js";
import { ToDoItemData } from "../model/ToDoItem.js";
import { ToDoTitle } from "../model/ToDoTitle.js";

export const db = getFirestore(app);
console.log('DB initialized:', db);

// Updated addToDoTitle function to handle a plain object directly
export async function addToDoTitle(todoTitle) {
    const dataForFirestore = todoTitle.toFirestore(); // Ensure we're sending a correct object
    console.log("Adding to Firestore:", dataForFirestore); // Check what's actually being sent

    try {
        const docRef = await addDoc(collection(db, TODO_TITLE_COLLECTION), dataForFirestore);
        return docRef.id;
    } catch (error) {
        console.error("Error adding document:", error);
        throw new Error('Failed to add todo title to Firestore: ' + error.message);
    }
}


export async function addToDoItem(todoItem) {
    try {
        const docRef = await addDoc(collection(db, TODO_ITEM_COLLECTION), todoItem);
        console.log("Document written with ID: ", docRef.id);
        return docRef;  // Return the document reference
    } catch (e) {
        console.error("Error adding document: ", e);
        throw new Error(e);
    }
}

// Example modification in your Firestore controller
export async function getItemByTitleId(titleId, uid) {
    const itemList = [];
    const itemsRef = collection(db, "todo_items");
    const q = query(itemsRef, where('uid', '==', uid), where('titleId', '==', titleId));

    try {
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log("Fetched item data:", data); // Debug log
            // Construct ToDoItemData with the right properties and include the document ID
            const item = {
                id: doc.id,  // Include the Firestore document ID here
                ...new ToDoItemData({
                    email: data.email,
                    titleId: data.titleId,
                    uid: data.uid,
                    task: data.task,
                    description: data.description,
                    scheduledDate: data.scheduledDate,
                    scheduledTime: data.scheduledTime
                })
            };
            itemList.push(item);
        });
    } catch (error) {
        console.error('Error fetching items:', error);
        throw new Error('Failed to retrieve items from Firestore');
    }

    return itemList;
}

export async function getToDoTitleList(uid) {
    let titleList = [];
    const q = query(collection(db, TODO_TITLE_COLLECTION), where('uid', '==', uid));
    
    try {
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            // Make sure `doc.id` is set on your `ToDoTitle` object
            const title = new ToDoTitle(doc.data(), doc.id);
            titleList.push(title);
        });
    } catch (error) {
        console.error('Failed to get title list:', error);
        throw error;
    }

    return titleList;
}

export async function getTitleNameByTitleId(titleId) {
    const titleDocRef = doc(db, 'todo_titles', titleId); // Correct path according to your rules and database structure

    try {
        const querySnapshot = await getDoc(titleDocRef);
        if (!querySnapshot.exists()) {
            console.log('No document found with the given ID.');
            return null; // Return null if no document found
        }

        // Assuming 'title' is the field name where the title name is stored
        return {
            titleName: querySnapshot.data().title, // Change 'title' if your document structure has a different field name
            docId: querySnapshot.id
        };
    } catch (error) {
        console.error('Failed to get title by ID:', error);
        throw error;
    }
}

export async function updateToDoItem(docId, update) {
    if (!docId) {
        console.error("Invalid or missing docId");
        throw new Error("Document ID must be provided.");
    }
    const docRef = doc(db, TODO_ITEM_COLLECTION, docId);
    try {
        await updateDoc(docRef, update);
        console.log("Document updated successfully:", docId);
        return true;
    } catch (error) {
        console.error("Error updating document:", docId, error);
        throw error; // Re-throw to handle it in the calling function
    }
}


export async function deleteToDoItem(itemId){
   const docRef = doc(db, TODO_ITEM_COLLECTION, itemId);
   await deleteDoc(docRef);
}

// Function to update a ToDo title in Firestore
export async function updateToDoTitle(docId, newTitle) {
    if (!docId) {
        console.error("Invalid or missing docId");
        throw new Error("Document ID must be provided.");
    }
    const docRef = doc(db, TODO_TITLE_COLLECTION, docId);
    try {
        await updateDoc(docRef, { title: newTitle });
        console.log("Title updated successfully:", newTitle);
    } catch (error) {
        console.error("Error updating title:", error);
        throw error; // Re-throw to handle it in the calling function
    }
}

export async function deleteToDoTitle(itemId){
   const docRef = doc(db, TODO_TITLE_COLLECTION, itemId);
   await deleteDoc(docRef);
}

export async function addToDoReminder(todoReminder) {
    try {
        const docRef = await addDoc(collection(db, TODO_REMINDER_COLLECTION), todoReminder);
        console.log("Document written with ID: ", docRef.id);
        return docRef;  // Return the document reference
    } catch (e) {
        console.error("Error adding document: ", e);
        throw new Error(e);
    }
}

export async function updateToDoReminder(docId, update) {
    if (!docId) {
        console.error("Invalid or missing docId");
        throw new Error("Document ID must be provided.");
    }
    const docRef = doc(db, TODO_REMINDER_COLLECTION, docId);
    try {
        await updateDoc(docRef, update);
        console.log("Document updated successfully:", docId);
        return true;
    } catch (error) {
        console.error("Error updating document:", docId, error);
        throw error; // Re-throw to handle it in the calling function
    }
}

export async function deleteToDoReminder(reminderId) {
    const docRef = doc(db, TODO_REMINDER_COLLECTION, reminderId);
    try {
        await deleteDoc(docRef);
        console.log("Document deleted successfully:", reminderId);
    } catch (error) {
        console.error("Error deleting document:", reminderId, error);
        throw error;
    }
}

export async function hasExistingReminders(titleId, uid) {
    const remindersRef = collection(db, TODO_REMINDER_COLLECTION);
    const q = query(remindersRef, where("titleId", "==", titleId), where("uid", "==", uid));

    try {
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;  // Returns true if at least one document exists
    } catch (error) {
        console.error("Error querying for existing reminders:", error);
        throw new Error("Failed to check for existing reminders.");
    }
}

// Function to retrieve all reminder IDs for a given title ID
export async function getRemindersByTitleID(titleId, uid) {
    const remindersRef = collection(db, "todo_reminders");
    // Construct the query based on title ID and user ID
    const q = query(remindersRef, where("titleId", "==", titleId), where("uid", "==", uid));
    const reminderIds = [];

    try {
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(doc => {
            // Push the document ID into the reminderIds array
            reminderIds.push(doc.id);
        });
        return reminderIds;  // Return the array of reminder IDs
    } catch (error) {
        console.error("Error querying for reminder IDs:", error);
        throw new Error("Failed to retrieve reminder IDs.");  // Re-throw to handle it in the calling function
    }
}


export async function mergeTodos() {
    const todosCollectionRef = collection(db, "todos");
    const titlesRef = collection(db, "todo_titles");
    const itemsRef = collection(db, "todo_items");

    // Fetch all titles
    const titlesSnapshot = await getDocs(titlesRef);
    titlesSnapshot.forEach(async (titleDoc) => {
        const titleData = titleDoc.data();

        // Query items that correspond to the current title
        const q = query(itemsRef, where("titleId", "==", titleDoc.id));
        const itemsSnapshot = await getDocs(q);
        
        const items = [];
        itemsSnapshot.forEach(itemDoc => {
            items.push({ id: itemDoc.id, ...itemDoc.data() });
        });

        // Prepare the merged data
        const mergedData = {
            title: titleData.title,
            items: items
        };

        // Add to "todos" collection
        await addDoc(todosCollectionRef, mergedData);
    });
    console.log('Todos have been merged successfully.');
}