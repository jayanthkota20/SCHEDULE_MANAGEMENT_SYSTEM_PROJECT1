import { ToDoTitle } from "../model/ToDoTitle.js";
import { currentUser } from "./firebase_auth.js";
import { addToDoTitle } from "./firestore_controller.js";
import { TaskCard } from "../View/home_page.js"; // Verify this import path is correct
import { serverTimestamp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

let selectedCategoryHeading = null;

document.addEventListener('click', (event) => {
    if (event.target.tagName === 'H1' && event.target.dataset.created === 'true') {
        if (selectedCategoryHeading === event.target) {
            selectedCategoryHeading = null;
        } else {
            selectedCategoryHeading = event.target;
        }
    }
});

export async function onSubmitCreateForm(e, categoryName) {
    e.preventDefault();

    if (!selectedCategoryHeading) {
        alert("Please select a category heading before submitting.");
        return;
    }

    const titleInput = e.target.querySelector('#title');
    const title = titleInput.value.trim();
    if (!title) {
        alert("Title cannot be empty.");
        return;
    }

    const uid = currentUser ? currentUser.uid : null;
    if (!uid) {
        console.error("User ID is missing.");
        alert("User authentication is required.");
        return;
    }

    const todoTitle = new ToDoTitle({
        title: title,
        uid: uid,
        timestamp: serverTimestamp(),  // Ensure this is being imported correctly
        category: selectedCategoryHeading.textContent  // Ensure categoryName is obtained correctly
    });

    try {
        const docId = await addToDoTitle(todoTitle);
        todoTitle.set_docId(docId);
        console.log("Document ID:", docId);
        const taskCard = TaskCard(todoTitle, []);
        const container = document.getElementById('todo-container');
        container.prepend(taskCard);
        titleInput.value = '';
        selectedCategoryHeading = null; // Reset after successful submission
    } catch (error) {
        console.error('Failed to create task:', error);
        alert('Failed to create task: ' + error.message);
    }
}
