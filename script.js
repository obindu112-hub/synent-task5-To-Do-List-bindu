const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const categoryInput = document.getElementById("categoryInput");
const priorityInput = document.getElementById("priorityInput");
const dueDateInput = document.getElementById("dueDateInput");

const taskList = document.getElementById("taskList");
const emptyMessage = document.getElementById("emptyMessage");
const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const categoryFilter = document.getElementById("categoryFilter");
const clearCompleted = document.getElementById("clearCompleted");

const totalTasks = document.getElementById("totalTasks");
const completedTasks = document.getElementById("completedTasks");
const pendingTasks = document.getElementById("pendingTasks");
const progressPercent = document.getElementById("progressPercent");
const progressFill = document.getElementById("progressFill");
const taskCountLabel = document.getElementById("taskCountLabel");
const todayElement = document.getElementById("today");

const STORAGE_KEY = "taskflow-tasks-v1";

let tasks = [];
let currentFilter = "all";

// Create sample tasks for a first-time visit.
const sampleTasks = [
    {
        id: 1,
        title: "Complete college assignments",
        category: "College",
        priority: "high",
        dueDate: "",
        completed: false
    },
    {
        id: 2,
        title: "Practice Python DSA",
        category: "Coding",
        priority: "high",
        dueDate: "",
        completed: false
    },
    {
        id: 3,
        title: "Solve prefix sum problems",
        category: "Placement",
        priority: "medium",
        dueDate: "",
        completed: false
    },
    {
        id: 4,
        title: "Update resume",
        category: "Placement",
        priority: "medium",
        dueDate: "",
        completed: false
    },
    {
        id: 5,
        title: "Work on StationeryHub",
        category: "Projects",
        priority: "low",
        dueDate: "",
        completed: false
    },
    {
        id: 6,
        title: "Revise aptitude questions",
        category: "Placement",
        priority: "medium",
        dueDate: "",
        completed: false
    }
];

// Load saved tasks or sample tasks.
function loadTasks() {
    try {
        const savedTasks = localStorage.getItem(STORAGE_KEY);

        if (savedTasks !== null) {
            const parsedTasks = JSON.parse(savedTasks);

            if (Array.isArray(parsedTasks)) {
                tasks = parsedTasks;
            } else {
                tasks = [];
            }
        } else {
            tasks = sampleTasks.map(task => ({ ...task }));
            saveTasks();
        }
    } catch (error) {
        console.error("Could not load tasks:", error);
        tasks = [];
    }
}

// Save tasks in the browser.
function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        alert("Unable to save tasks. Please check your browser storage.");
        console.error("Could not save tasks:", error);
    }
}

// Display today's date.
function showToday() {
    const now = new Date();

    todayElement.textContent = now.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// Update task statistics.
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    totalTasks.textContent = total;
    completedTasks.textContent = completed;
    pendingTasks.textContent = pending;
    progressPercent.textContent = percentage + "%";
    progressFill.style.width = percentage + "%";

    taskCountLabel.textContent =
        total + (total === 1 ? " task" : " tasks");
}

// Create a label safely using textContent.
function createTag(text, className = "tag") {
    const tag = document.createElement("span");
    tag.className = className;
    tag.textContent = text;
    return tag;
}

// Format a date without timezone conversion.
function formatDate(dateString) {
    if (!dateString) return "";

    const parts = dateString.split("-");

    if (parts.length !== 3) return dateString;

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Check if a task is overdue.
function isOverdue(task) {
    if (!task.dueDate || task.completed) return false;

    const today = new Date();
    const localToday = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    return task.dueDate < localToday;
}

// Create a task card.
function createTaskCard(task) {
    const item = document.createElement("article");
    item.className = "task-item";

    if (task.completed) {
        item.classList.add("is-complete");
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.completed;
    checkbox.setAttribute(
        "aria-label",
        "Mark " + task.title + " as completed"
    );

    checkbox.addEventListener("change", function () {
        task.completed = checkbox.checked;
        saveTasks();
        renderTasks();
    });

    const info = document.createElement("div");
    info.className = "task-info";

    const title = document.createElement("h3");
    title.className = "task-title";
    title.textContent = task.title;

    const meta = document.createElement("div");
    meta.className = "task-meta";

    meta.appendChild(createTag(task.category));

    const priority = task.priority || "medium";
    const priorityLabel =
        priority.charAt(0).toUpperCase() + priority.slice(1);

    meta.appendChild(
        createTag(priorityLabel + " priority", "tag priority-" + priority)
    );

    if (task.dueDate) {
        const dateLabel = createTag(
            "Due: " + formatDate(task.dueDate),
            "due-date"
        );

        if (isOverdue(task)) {
            dateLabel.classList.add("overdue");
            dateLabel.textContent += " · Overdue";
        }

        meta.appendChild(dateLabel);
    }

    info.appendChild(title);
    info.appendChild(meta);

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.type = "button";
    deleteButton.textContent = "×";
    deleteButton.title = "Delete task";
    deleteButton.setAttribute("aria-label", "Delete " + task.title);

    deleteButton.addEventListener("click", function () {
        const confirmed = confirm("Delete this task?");

        if (!confirmed) return;

        tasks = tasks.filter(item => item.id !== task.id);
        saveTasks();
        renderTasks();
    });

    item.appendChild(checkbox);
    item.appendChild(info);
    item.appendChild(deleteButton);

    return item;
}

// Apply filters and display tasks.
function renderTasks() {
    taskList.replaceChildren();

    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value;

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title
            .toLowerCase()
            .includes(searchTerm);

        const matchesStatus =
            currentFilter === "all" ||
            (currentFilter === "pending" && !task.completed) ||
            (currentFilter === "completed" && task.completed);

        const matchesCategory =
            selectedCategory === "all" ||
            task.category === selectedCategory;

        return matchesSearch && matchesStatus && matchesCategory;
    });

    filteredTasks.forEach(task => {
        taskList.appendChild(createTaskCard(task));
    });

    emptyMessage.classList.toggle("show", filteredTasks.length === 0);

    updateStats();
    updateNavigation();
}

// Keep sidebar selection in sync with the filter.
function updateNavigation() {
    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.filter === currentFilter
        );
    });

    filterSelect.value = currentFilter;
}

// Add a new task.
taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = taskInput.value.trim();

    if (!title) {
        alert("Please enter a task name.");
        taskInput.focus();
        return;
    }

    const task = {
        id: Date.now() + Math.random(),
        title: title,
        category: categoryInput.value,
        priority: priorityInput.value,
        dueDate: dueDateInput.value,
        completed: false
    };

    tasks.unshift(task);

    saveTasks();

    taskInput.value = "";
    categoryInput.value = "Personal";
    priorityInput.value = "medium";
    dueDateInput.value = "";

    currentFilter = "all";
    filterSelect.value = "all";
    categoryFilter.value = "all";
    searchInput.value = "";

    renderTasks();
    taskInput.focus();
});

// Search tasks as you type.
searchInput.addEventListener("input", renderTasks);

// Filter by status.
filterSelect.addEventListener("change", function () {
    currentFilter = filterSelect.value;
    renderTasks();
});

// Filter by category.
categoryFilter.addEventListener("change", renderTasks);

// Sidebar navigation.
document.querySelectorAll(".nav-item").forEach(button => {
    button.addEventListener("click", function () {
        currentFilter = button.dataset.filter;
        filterSelect.value = currentFilter;
        renderTasks();
    });
});

// Delete all completed tasks.
clearCompleted.addEventListener("click", function () {
    const completedCount = tasks.filter(task => task.completed).length;

    if (completedCount === 0) {
        alert("There are no completed tasks to clear.");
        return;
    }

    const confirmed = confirm(
        "Delete all " + completedCount + " completed task(s)?"
    );

    if (!confirmed) return;

    tasks = tasks.filter(task => !task.completed);

    saveTasks();
    renderTasks();
});

// Initialize the app.
showToday();
loadTasks();
renderTasks();