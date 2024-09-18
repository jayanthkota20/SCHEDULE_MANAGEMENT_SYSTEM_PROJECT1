import { currentUser } from "../controller/firebase_auth.js";
import { onSubmitCreateForm } from "../controller/home_controller.js";
import { getToDoTitleList, getItemByTitleId, getTitleNameByTitleId, mergeTodos } from "../controller/firestore_controller.js";
import { protectedView } from "./protected_view.js";
import { setReminderMenu } from "../model/remainderManagement.js";
import { createTaskEle, updateCard, deleteCard } from "../model/SystemManagement.js";
import { auth } from "../controller/firebase_auth.js";

let selectedCategoryHeading = null;  // Declare selectedCategoryHeading at the module level

export async function ShowhomePage() {
    if (!currentUser) {
        root.innerHTML = await protectedView();
        return;
    }

    const response = await fetch('/view/templates/home_page_template.html', { cache: 'no-store' });
    const divWrapper = document.createElement('div');
    divWrapper.innerHTML = await response.text();
    divWrapper.classList.add('m-4', 'p-4');

    root.innerHTML = '';
    root.appendChild(divWrapper);

    const container = document.getElementById('todo-container');
    if (!container) {
        console.error("ToDo container div not found on the page.");
        return;
    }

    const form = divWrapper.querySelector('form');
    if (!form) {
        console.error("Form not found in the loaded template.");
        alert("Failed to load the form. Please check the template.");
        return;
    }

    setupEventListeners(form, container);

    try {
        await initializeTasks(container);
    } catch (error) {
        console.error("Failed to initialize tasks:", error);
    }
}

function setupEventListeners(form, container) {
    const titleInput = form.querySelector('#title');
    const addButton = form.querySelector('#add-button');
    const categoryInput = document.getElementById('category');
    const addCategoryButton = form.querySelector('#add-c-button');

    titleInput.disabled = true;
    addButton.disabled = true;

    addCategoryButton.addEventListener('click', (e) => {
        e.preventDefault();
        const categoryValue = categoryInput.value.trim();
        if (categoryValue) {
            createCategory(categoryValue, container);
            categoryInput.value = ''; // Clear the input after adding the category
            selectedCategoryHeading = null;  // Optionally reset selectedCategoryHeading
        } else {
            alert('Please enter a category name.');
        }
    });

    container.addEventListener('click', (event) => {
        if (event.target.tagName === 'H1' && event.target.dataset.created === 'true') {
            selectedCategoryHeading = event.target;  // Set the current category heading
            titleInput.disabled = false;
            addButton.disabled = false;
            categoryInput.disabled = true; 
            addCategoryButton.disabled = true;
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selectedCategoryHeading) {
            alert("Please select a category by clicking on its heading.");
        } else {
            await onSubmitCreateForm(e);
            selectedCategoryHeading = null;  // Optionally reset selectedCategoryHeading after submitting the form
            titleInput.disabled = true;
            addButton.disabled = true;
            categoryInput.disabled = false;
            addCategoryButton.disabled = false;
        }
    });
}

function createCategory(categoryValue, container) {
    const categoryHeading = document.createElement('h1');
    categoryHeading.textContent = categoryValue;
    categoryHeading.dataset.created = 'true'; // Mark as a created category
    categoryHeading.style.cursor = 'pointer'; // Make it obvious it's selectable
    container.appendChild(categoryHeading);

    categoryHeading.addEventListener('click', () => {
        const titleInput = document.querySelector('#title');
        const addButton = document.querySelector('#add-button');
        const categoryInput = document.getElementById('category');
        const addCategoryButton = document.querySelector('#add-c-button');

        titleInput.disabled = false;
        addButton.disabled = false;
        categoryInput.disabled = true;
        addCategoryButton.disabled = true;
    });
}

async function initializeTasks(container) {
    const toDoTitleList = await getToDoTitleList(currentUser.uid);
    if (toDoTitleList.length === 0) {
        console.log("No titles found for the user.");
        return;
    }

    const groupedTasks = {};

    // Group tasks by their categories retrieved from Firestore
    for (const title of toDoTitleList) {
        const itemList = await getItemByTitleId(title.docIdHandler.docId, currentUser.uid);
        const category = title.data.category; // Assuming each title object has a 'category' attribute

        if (!groupedTasks[category]) {
            groupedTasks[category] = [];
        }
        groupedTasks[category].push({ title, itemList });
    }

    // Clear the container before appending new content
    container.innerHTML = '';

    // Create a section for each category and append tasks to it
    for (const [category, cards] of Object.entries(groupedTasks)) {
        const section = document.createElement('section');
        const categoryHeading = document.createElement('h1');
        categoryHeading.textContent = category;
        categoryHeading.dataset.category = category; // Useful for identifying sections by category
        categoryHeading.dataset.created = 'true'; // Mark it as a created category
        categoryHeading.style.cursor = 'pointer'; // Make it obvious that it's selectable
        section.appendChild(categoryHeading);

        for (const card of cards) {
            const cardElement = TaskCard(card.title, card.itemList);
            section.appendChild(cardElement);
        }

        container.appendChild(section);
    }
    disableInputs();
}

function disableInputs() {
    const container = document.querySelector('#todo-container');

    const inputEle = container.querySelectorAll('input')
    for (let i = 0; i < inputEle.length; i++) {
        inputEle[i].disabled = true;
    }
}

export function TaskCard(todoTitle, itemList = []) {
    const Taskdiv = document.createElement('div');
    Taskdiv.classList.add('card', 'd-inline-block', 'm-4', 'p-4');
    Taskdiv.style.height = "23rem";
    Taskdiv.style.width = "23rem";
    Taskdiv.id = todoTitle.docIdHandler.docId;

    const cardHeader = document.createElement('div');
    cardHeader.className = 'd-flex justify-content-between align-items-center';
    Taskdiv.appendChild(cardHeader);

    const titleInput = document.createElement('input');
    titleInput.className = 'card-title form-control fs-3';
    titleInput.id = "title";
    titleInput.value = todoTitle.data.title;
    titleInput.style.width = "calc(100% - 40px)"; // Reduce width to make space for the menu
    titleInput.style.marginRight = '10px'; // Ensures uniform alignment with input fields
    titleInput.disabled = true;
    cardHeader.appendChild(titleInput);

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    Taskdiv.appendChild(cardBody);

    const cardTextDiv = document.createElement('div');
    cardTextDiv.classList.add('card-text', 'd-block');

    setReminderMenu(cardHeader, Taskdiv, cardTextDiv);

    if (itemList.length === 0) {
        // Create empty fields for a new task if no items exist
        itemList.push({ task: '', description: '', scheduledDate: '', scheduledTime: '' });
    }

    let allFieldsEmpty = true;
    itemList.forEach((item, index) => {
        const taskInput = document.createElement('input');
        taskInput.type = "text";
        taskInput.placeholder = "Task";
        taskInput.value = item.task || '';
        taskInput.classList.add('form-control', 'mb-2');
        taskInput.disabled = true;
        cardTextDiv.appendChild(taskInput);

        const descriptionInput = document.createElement('input');
        descriptionInput.type = "text";
        descriptionInput.placeholder = "Description";
        descriptionInput.value = item.description || '';
        descriptionInput.classList.add('form-control', 'mb-2');
        descriptionInput.disabled = true;
        cardTextDiv.appendChild(descriptionInput);

        const scheduleDateInput = document.createElement('input');
        scheduleDateInput.type = "date";
        scheduleDateInput.value = item.scheduledDate || '';
        scheduleDateInput.classList.add('form-control', 'mb-2');
        scheduleDateInput.disabled = true;
        cardTextDiv.appendChild(scheduleDateInput);

        const scheduleTimeInput = document.createElement('input');
        scheduleTimeInput.type = "time";
        scheduleTimeInput.value = item.scheduledTime || '';
        scheduleTimeInput.classList.add('form-control', 'mb-2');
        scheduleTimeInput.disabled = true;
        cardTextDiv.appendChild(scheduleTimeInput);

        // Assume an existing task if it has any non-empty field values
        if (item.task || item.description || item.scheduledDate || item.scheduledTime) {
            taskInput.disabled = true;
            descriptionInput.disabled = true;
            scheduleDateInput.disabled = true;
            scheduleTimeInput.disabled = true;
            allFieldsEmpty = false;
        }
    });

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';

    const enterButton = document.createElement('button');
    enterButton.textContent = 'Enter';
    enterButton.className = 'btn btn-primary mt-2';
    enterButton.style.display = allFieldsEmpty ? 'block' : 'none';
    buttonContainer.appendChild(enterButton);

    const updateButton = document.createElement('button');
    updateButton.textContent = 'Update';
    updateButton.className = 'btn btn-success me-2';
    updateButton.style.display = allFieldsEmpty ? 'none' : 'block';
    buttonContainer.appendChild(updateButton);

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.className = 'btn btn-secondary me-2';
    saveButton.style.display = 'none';
    buttonContainer.appendChild(saveButton);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'btn btn-danger';
    deleteButton.style.display = allFieldsEmpty ? 'none' : 'block';
    buttonContainer.appendChild(deleteButton);

    titleInput.disabled = false
    itemList.forEach((_, index) => {
        cardTextDiv.children[index * 4].disabled = false; // taskInput
        cardTextDiv.children[index * 4 + 1].disabled = false; // descriptionInput
        cardTextDiv.children[index * 4 + 2].disabled = false; // scheduleDateInput
        cardTextDiv.children[index * 4 + 3].disabled = false; // scheduleTimeInput
    });

    // Ensure to use local variables correctly within event listeners
    enterButton.addEventListener('click', async (e) => {
        e.preventDefault();

        // Iterate through each taskInput, descriptionInput, scheduleDateInput, and scheduleTimeInput
        for (let i = 0; i < itemList.length; i++) {
            const taskInput = cardTextDiv.children[i * 4]; // taskInput
            const descriptionInput = cardTextDiv.children[i * 4 + 1]; // descriptionInput
            const scheduledDateInput = cardTextDiv.children[i * 4 + 2]; // scheduleDateInput
            const scheduledTimeInput = cardTextDiv.children[i * 4 + 3]; // scheduleTimeInput

            const itemData = {
                task: taskInput.value,
                description: descriptionInput.value,
                scheduledDate: scheduledDateInput.value,
                scheduledTime: scheduledTimeInput.value,
            };

            await createTaskEle(itemData, todoTitle);

            // Disable inputs after submitting
            taskInput.disabled = true;
            descriptionInput.disabled = true;
            scheduledDateInput.disabled = true;
            scheduledTimeInput.disabled = true;
        }

        titleInput.disabled = "false";
        enterButton.style.display = 'none';
        updateButton.style.display = 'block';
        deleteButton.style.display = 'block';
        mergeTodos();
        window.location.reload();
    });



    updateButton.addEventListener('click', () => {
        titleInput.disabled = false
        itemList.forEach((_, index) => {
            cardTextDiv.children[index * 4].disabled = false; // taskInput
            cardTextDiv.children[index * 4 + 1].disabled = false; // descriptionInput
            cardTextDiv.children[index * 4 + 2].disabled = false; // scheduleDateInput
            cardTextDiv.children[index * 4 + 3].disabled = false; // scheduleTimeInput

        });

        saveButton.style.display = 'block';
        updateButton.style.display = 'none';
        deleteButton.style.display = 'none';
    });

    let initialTitleValue = titleInput.value;

    saveButton.addEventListener('click', async () => {
        await updateCard(cardTextDiv, titleInput, todoTitle, itemList);
        // Post-update UI adjustments
        console.log("Save changes here");
        titleInput.disabled = true;
        const inputs = cardTextDiv.querySelectorAll('input');
        inputs.forEach(input => input.disabled = true);
        saveButton.style.display = 'none';
        updateButton.style.display = 'block';
        deleteButton.style.display = 'block';

        // Check if titleInput value has changed
        if (titleInput.value !== initialTitleValue) {
            window.location.reload(); // Reload the window if the title input value has changed
        }
    });

    deleteButton.addEventListener('click', async () => {
        deleteCard(Taskdiv, todoTitle, itemList);
    });


    cardTextDiv.appendChild(buttonContainer);
    cardBody.appendChild(cardTextDiv);

    return Taskdiv;
}

export async function applyFilter() {
    const titleFilterInput = document.getElementById('filter-title');
    const taskFilterInput = document.getElementById('filter-task');
    const descriptionFilterInput = document.getElementById('filter-description');
    const dateFilterInput = document.getElementById('filter-date');

    // Get filter values from the input fields
    const titleFilter = titleFilterInput.value.toLowerCase();
    const taskFilter = taskFilterInput.value.toLowerCase();
    const descriptionFilter = descriptionFilterInput.value.toLowerCase();
    const dateFilter = dateFilterInput.value;

    // Clear the current task display
    const container = document.querySelector('#todo-container');
    container.innerHTML = '';

    // Fetch all titles
    const toDoTitleList = await getToDoTitleList(auth.currentUser.uid);

    for (const title of toDoTitleList) {
        const titleData = await getTitleNameByTitleId(title.docIdHandler.docId);
        if (titleData && (!titleFilter || titleData.titleName.toLowerCase().includes(titleFilter))) {
            const itemList = await getItemByTitleId(title.docIdHandler.docId, auth.currentUser.uid);
            itemList.forEach(item => {
                if (matchesFilters(item, taskFilter, descriptionFilter, dateFilter)) {
                    const cardElement = TaskCard(title, [item]); // Assuming TaskCard can handle a list of one item
                    container.appendChild(cardElement);
                }
            });
        }
    }
    disableInputs();
}

function matchesFilters(item, taskFilter, descriptionFilter, dateFilter) {
    const taskMatch = taskFilter ? item.task.toLowerCase().includes(taskFilter) : true;
    const descriptionMatch = descriptionFilter ? item.description.toLowerCase().includes(descriptionFilter) : true;
    const dateMatch = dateFilter ? item.scheduledDate === dateFilter : true;

    return taskMatch && descriptionMatch && dateMatch;
}


document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('apply-filter').addEventListener('click', async (e) => {
        e.preventDefault(); // Prevent form submission
        await applyFilter();
    });
});