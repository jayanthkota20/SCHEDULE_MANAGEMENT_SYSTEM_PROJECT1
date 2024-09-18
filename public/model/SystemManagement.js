import { addToDoItem, deleteToDoItem,deleteToDoTitle, updateToDoItem, updateToDoTitle, deleteToDoReminder, getRemindersByTitleID } from "../controller/firestore_controller.js";
import { currentUser } from "../controller/firebase_auth.js";

export async function createTaskEle(itemData, todoTitle) {
    try {
        await addToDoItem({
            email: currentUser.email,
            titleId: todoTitle.docIdHandler.docId,
            uid: currentUser.uid,
            ...itemData
        });
        alert('Item added successfully!');
    } catch (error) {
        console.error('Error adding new item:', error);
        alert('Failed to add item: ' + error.message);
    }
}

export async function updateCard(cardTextDiv, titleInput, todoTitle, itemList) {
    const inputs = cardTextDiv.querySelectorAll('input[type="text"], input[type="date"], input[type="time"]');
    const newTitle = titleInput.value;

    if (newTitle !== todoTitle.data.title) {
        try {
            await updateToDoTitle(todoTitle.docIdHandler.docId, newTitle);
            console.log("Title updated successfully to:", newTitle);
            todoTitle.data.title = newTitle; // Update local title
        } catch (error) {
            console.error("Error updating title:", error);
            titleInput.textContent = todoTitle.data.title; // Revert on failure
            alert("Failed to update title. Please try again.");
        }
    }

    console.log("Current items with IDs:", itemList);
    itemList.forEach(async (item, index) => {
        const updatedData = {
            task: inputs[index * 4].value,
            description: inputs[index * 4 + 1].value,
            scheduledDate: inputs[index * 4 + 2].value,
            scheduledTime: inputs[index * 4 + 3].value,
        };

        if (!item.id) {
            console.error("Missing document ID for item:", item);
            alert("An internal error occurred: missing document ID.");
            return; // Skip updating this item
        }

        try {
            await updateToDoItem(item.id, updatedData);
            console.log('Item updated successfully');
        } catch (error) {
            console.error('Error updating item:', error);
            alert('Failed to update item: ' + error.message);
        }
    });
}

export async function deleteCard(div, todoTitle, itemList) {
    if (!confirm('Are you sure you want to delete this to-do list and all its items?')) {
        return;
    }

    const titleId = todoTitle.docIdHandler.docId; // Ensure this ID is correctly retrieved and not undefined
    if (!titleId) {
        console.error('Error: Title ID is undefined.');
        alert('Internal error: Missing Title ID.');
        return;
    }

    const itemsToDelete = itemList.map(item => item.id).filter(id => id); // Filter out any undefined IDs
    if (itemsToDelete.length === 0 && itemList.length > 0) {
        console.error('Error: Some item IDs are missing.');
        alert('Internal error: Missing item IDs.');
        return;
    }

    try {
        // Delete all items associated with the title
        for (const itemId of itemsToDelete) {
            await deleteToDoItem(itemId); // Verify that deleteToDoItem handles undefined IDs gracefully
        }
        
        // Delete the title
        await deleteToDoTitle(titleId);

        // Delete all associated reminders
        const remindersToDelete = await getRemindersByTitleID(titleId, currentUser.uid);
        if (remindersToDelete) {
            for (const reminderId of remindersToDelete) {
                await deleteToDoReminder(reminderId);
            }
        }

        // Remove the card element from the UI
        div.remove();
        alert('To-do list and all associated items have been successfully deleted.');
    } catch (error) {
        console.error('Error during deletion:', error);
        alert('Failed to delete items: ' + error.message);
    }
}