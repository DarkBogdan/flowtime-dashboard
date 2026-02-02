  /**
 * Flowtime Dashboard Application
 * Logic for authentication, employee management, and time tracking.
 */

// ==========================================================================
//    IMPORTS & DEPENDENCIES
// ==========================================================================
import { employees } from "./data.js";
import { authService } from "./authService.js";
import { themeService } from "./themeService.js";
import { timerService } from "./timerService.js";


// ==========================================================================
//    CONSTANTS & CONFIGURATION
// ==========================================================================
const ADMIN_LOGIN = "admin";
const ADMIN_PASSWORD = "admin123";
const TIMESHEET_KEY = "timeEntries";


// ==========================================================================
// APPLICATION DATA STATE
// Persistent data loaded from storage or initial sources
// ==========================================================================
const storedEmployees = getEmployeesFromStorage();
let employeesList = storedEmployees ? storedEmployees : [...employees];


// ==========================================================================
//    DOM ELEMENTS & UI REFERENCES
// ==========================================================================

// Employees table
const tbody = document.getElementById("employeesTbody");

// Filters and search
const statusSelect = document.getElementById("statusFilter");
const departmentSelect = document.getElementById("departmentFilter");
const searchInput = document.getElementById("searchInput");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");

// Edit employee modal
const editModal = document.getElementById("editModal");
const editName = document.getElementById("editName");
const editPosition = document.getElementById("editPosition");
const editDepartment = document.getElementById("editDepartment");
const editStatus = document.getElementById("editStatus");
const saveEditBtn = document.getElementById("saveEditBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

// Time tracking (Time Clock)
const timeClockBtn = document.getElementById("timeClockBtn");
const timeClockModal = document.getElementById("timeClockModal");
const closeTimeClock = document.getElementById("closeTimeClock");
const departmentButtons = document.querySelectorAll(".department-btn");
const closeModalBtn = document.querySelector(".modal-close");
const continueBtn = document.getElementById("continueTimeClockBtn");
const clockBtn = document.getElementById("clockBtn");

// Add new employee modal
const addEmployeeBtn = document.getElementById("addEmployeeBtn");
const addEmployeeModal = document.getElementById("addEmployeeModal");
const addName = document.getElementById("addName");
const addPosition = document.getElementById("addPosition");
const addDepartment = document.getElementById("addDepartment");
const addStatus = document.getElementById("addStatus");
const addHireDate = document.getElementById("addHireDate");
const saveAddEmployee = document.getElementById("saveAddEmployee");
const cancelAddEmployee = document.getElementById("cancelAddEmployee");

// Authentication (login / logout)
const loginPage = document.getElementById("loginPage");
const appContent = document.getElementById("appContent");
const loginBtn = document.getElementById("loginBtn");
const loginInput = document.getElementById("loginInput");
const passwordInput = document.getElementById("passwordInput");
const loginError = document.getElementById("loginError");
const passwordError = document.getElementById("passwordError");

// Authentication result modal
const authModal = document.getElementById("authResultModal");
const authIcon = document.getElementById("authIcon");
const authTitle = document.getElementById("authTitle");
const authMessage = document.getElementById("authMessage");
const authBackBtn = document.getElementById("authBackBtn");

// Application pages
const employeesPage = document.getElementById("employeesPage");
const timeClockPage = document.getElementById("timeClockPage");

// Logout confirmation
const logoutBtn = document.getElementById("logoutBtn");
const logoutModal = document.getElementById("logoutModal");
const cancelLogoutBtn = document.getElementById("cancelLogoutBtn");
const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");

// Theme toggle (dark / light mode)
const themeBtn = document.getElementById("themeToggleBtn");

// Generic confirmation modal
const confirmModal = document.getElementById("confirmModal");
const confirmTitle = document.getElementById("confirmTitle");
const confirmMessage = document.getElementById("confirmMessage");
const confirmOkBtn = document.getElementById("confirmOkBtn");
const confirmCancelBtn = document.getElementById("confirmCancelBtn");

// Validation error messages
const addNameError = document.getElementById("addNameError");
const addPositionError = document.getElementById("addPositionError");
const editNameError = document.getElementById("editNameError");
const editPositionError = document.getElementById("editPositionError");

// Navigation link to the main Employees page
const homeLink = document.getElementById("homeLink");


// ==========================================================================
// APPLICATION RUNTIME STATE
// Volatile state used for UI, interactions and timers
// ==========================================================================

// Time tracking state
let timerArmed = false;
let isWorking = false;
let startTime = null;
let timerInterval = null;

// Persisted timesheet entries
  const timeEntries = loadTimeEntries();
  renderTimesheet();

// Currently selected department for time tracking
let selectedDepartment = null;

// Currently edited employee ID
let currentEditId = null;

// Sorting state
let nameSortDirection = null; // 'asc' | 'desc'


// ==========================================================================
// GLOBAL UI EVENTS
// ==========================================================================

// Close edit modal
  cancelEditBtn.addEventListener("click", () => {
  editModal.classList.add("hidden");
  currentEditId = null;
});

// Open logout confirmation modal
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    logoutModal.classList.remove("hidden");
  });
}

// Prevent body scroll lock leaks (safety reset)
document.body.classList.add("modal-open");
document.body.classList.remove("modal-open");


// ==========================================================================
// EMPLOYEES TABLE
// Rendering, formatting and empty state handling.
// ==========================================================================

  function renderEmployees(list) {
    tbody.innerHTML = "";

    if (list.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");

      td.colSpan = 6;
      td.className = "empty-state";
      td.textContent = `🔍 No results
Try changing filters or clearing search`;

      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

// Render employee rows
    list.forEach((employee) => {
      const tr = document.createElement("tr");
      tr.classList.add("row-animate");

  const isTerminated = employee.status === "terminated";

  tr.innerHTML = `
    <td>${highlightText(employee.name, searchInput.value)}</td>
    <td>${employee.position}</td>
    <td>${employee.department}</td>
    <td>
      <span class="status-badge ${employee.status}">
        ${formatStatus(employee.status)}
      </span>
    </td>
    <td>${employee.hireDate}</td>
    <td>
    <div class="table-actions">
      <button 
      class="btn btn-edit" 
      data-id="${employee.id}" 
      ${isTerminated ? "disabled" : ""}>
        Edit
      </button>
      <button
        class="btn btn-delete"
        data-id="${employee.id}"
        ${isTerminated ? "disabled" : ""}
      >
        Delete
      </button>
      </div>
    </td>
  `;
      tbody.appendChild(tr);
    });
  }

  function formatStatus(status) {
    if (status === "working") return "Working";
    if (status === "day_off") return "Day off";
    if (status === "sick") return "Sick leave";
    if (status === "terminated") return "Terminated";
  }


// ==========================================================================
// FILTERS & SEARCH
// ==========================================================================

  renderEmployees(employeesList);

  function applyFilters() {

    sortEmployees();

    const filteredEmployees = filterEmployees(employeesList);
    renderEmployees(filteredEmployees);
    updateSortIndicators();
  }

// Filter change listeners
  statusSelect.addEventListener("change", applyFilters);
  departmentSelect.addEventListener("change", applyFilters);
  searchInput.addEventListener("input", applyFilters);
  clearFiltersBtn.addEventListener("click", clearFilters);

// Core filtering logic
  function filterEmployees(list) {
    const selectedStatus = statusSelect.value;
    const selectedDepartment = departmentSelect.value;
    const searchValue = searchInput.value.toLowerCase();

    return list.filter(employee => {
      const statusMatch =
        selectedStatus === "all" ||
        employee.status === selectedStatus;

      const departmentMatch =
        selectedDepartment === "all" ||
        employee.department === selectedDepartment;

      const searchMatch =
        employee.name.toLowerCase().includes(searchValue);

      return statusMatch && departmentMatch && searchMatch;
    });
  }

// Reset all filters
  function clearFilters() {
    searchInput.value = "";
    statusSelect.value = "all";
    departmentSelect.value = "all";

  // Sync custom select UI
  syncCustomSelect("statusFilter");
  syncCustomSelect("departmentFilter");

    applyFilters();
  }


// ==========================================================================
// TABLE ROW ACTIONS
// Edit and delete employee handlers.
// ==========================================================================  

// Delete employee
tbody.addEventListener("click", (event) => {
  const btn = event.target.closest(".btn-delete");
  if (!btn || btn.disabled) return;

  const id = Number(btn.dataset.id);
  const index = employeesList.findIndex(e => e.id === id);
  if (index === -1) return;

  const employeeName = employeesList[index].name;

  openConfirmModal({
    title: "Delete employee",
    message: `Are you sure you want to delete <strong class="modal-name">${employeeName}</strong>? This action cannot be undone.`,
    onConfirm: () => {
      employeesList.splice(index, 1);
      saveEmployeesToStorage(employeesList);
      sortEmployees();
    }
  });
});

// Edit employee
  tbody.addEventListener("click", (event) => {
  const btn = event.target.closest(".btn-edit");
  if (!btn) return;
  if (btn.disabled) return;

  const id = Number(btn.dataset.id);
  const employee = employeesList.find(e => e.id === id);
  if (!employee) return;

  currentEditId = id;

  editName.value = employee.name;
  editPosition.value = employee.position;
  editDepartment.value = employee.department;
  editStatus.value = employee.status;

  editModal.classList.remove("hidden");
});


// ==========================================================================
// AUTH INPUT VALIDATION
// Remove error states while user is typing
// ==========================================================================


loginInput.addEventListener("input", () => {
  loginInput.classList.remove("error");
  loginError.textContent = "";
});

passwordInput.addEventListener("input", () => {
  passwordInput.classList.remove("error");
  passwordError.textContent = "";
});


// ==========================================================================
// LOCAL STORAGE HELPERS
// Persist and restore employees data
// ==========================================================================

  function saveEmployeesToStorage(list) {
    localStorage.setItem("employees", JSON.stringify(list));
  }

  function getEmployeesFromStorage() {
    const data = localStorage.getItem("employees");
    return data ? JSON.parse(data) : null;
  }


// ==========================================================================
// SEARCH HIGHLIGHTING
// Highlights matched text inside employee names
// ==========================================================================

  function highlightText(text, searchValue) {
    if (!searchValue) return text;

    const lowerText = text.toLowerCase();
    const lowerSearch = searchValue.toLowerCase();

    const index = lowerText.indexOf(lowerSearch);
    if (index === -1) return text;

    const before = text.slice(0, index);
    const match = text.slice(index, index + searchValue.length);
    const after = text.slice(index + searchValue.length);

    return `${before}<mark>${match}</mark>${after}`;
  }


// ==========================================================================
// TIME CLOCK ENTRY
// Department selection and modal control
// ==========================================================================  

timeClockBtn.addEventListener("click", () => {
  enableTimeClockEnterSubmit();
  showPage("timeClock");
});

// Close time clock modal
  closeTimeClock.addEventListener("click", closeTimeClockModal);

// Handle department selection buttons
  departmentButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      departmentButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const department = btn.textContent;
      console.log("Selected department:", department);
    });
  });

// Reset department selection and modal UI state
  function resetDepartmentSelection() {
    departmentButtons.forEach(btn => {
      btn.classList.remove("active");

    selectedDepartment = null;
    continueBtn.disabled = true;

    
    continueBtn.querySelector(".btn-text").textContent = "Continue";
    continueBtn.querySelector(".btn-loader").classList.add("hidden");

    });
  }

// Close time clock modal and reset state
  function closeTimeClockModal() {
    timeClockModal.classList.add("hidden");
    resetDepartmentSelection();
    resetTimeClockState();
  }

  closeModalBtn.addEventListener("click", closeTimeClockModal);

  departmentButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      // Remove active state from all buttons
      departmentButtons.forEach(b => b.classList.remove("active"));

      // Set active state for the clicked button
      btn.classList.add("active");

      // Save the selected department
      selectedDepartment = btn.textContent.trim();

      // Enable the Continue button
      continueBtn.disabled = false;
    });
  });

// Continue button -> start time tracking flow
continueBtn.addEventListener("click", () => {
  if (!selectedDepartment) return;

  continueBtn.disabled = true;
  continueBtn.querySelector(".btn-text").textContent = "Loading";
  continueBtn.querySelector(".btn-loader").classList.remove("hidden");

  setTimeout(() => {
    timeClockModal.classList.add("hidden");
    showPage("timeClock");
    armTimer();
  }, 500);
});

  closeTimeClock.addEventListener("click", closeTimeClockModal);
  closeModalBtn.addEventListener("click", closeTimeClockModal);


// ==========================================================================
// TIMESHEET
// Render stored time entries
// ==========================================================================

  function renderTimesheet() {
    const tbody = document.querySelector("#timesheetTable tbody");
    tbody.innerHTML = "";

    timeEntries.forEach(entry => {
      const tr = document.createElement("tr");

tr.innerHTML = `
  <td data-label="Date">
    <span class="cell-value">${entry.date}</span>
  </td>
  <td data-label="Department">
    <span class="cell-value">${entry.department}</span>
  </td>
  <td data-label="Start">
    <span class="cell-value">${entry.start}</span>
  </td>
  <td data-label="End">
    <span class="cell-value">${entry.end}</span>
  </td>
  <td data-label="Total">
    <span class="cell-value">${entry.total}</span>
  </td>
`;

      tbody.appendChild(tr);
    });
  }

  function formatTime(date) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }

  function calculateDuration(start, end) {
    const diff = end - start;
    const totalSeconds = Math.floor(diff / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }


// ==========================================================================
// TIME TRACKING CORE LOGIC
// Start, update and stop working session
// ==========================================================================  

function startShift() {
  isWorking = true;
  startTime = new Date();

// Persist active timer state
    timerService.save({
    isWorking: true,
    startTime: startTime.getTime(),
    selectedDepartment
  });

  document.body.classList.add("timer-running");

  clockBtn.textContent = "Clock out";
  clockBtn.classList.add("active");

// Reset and animate live timer
  liveTimer.textContent = "00:00:00";

  liveTimer.classList.remove("timer-start");
  void liveTimer.offsetWidth;  // force reflow for animation restart
  liveTimer.classList.add("timer-start");

 startTimerInterval();
}

// Update live timer every second
function startTimerInterval() {
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    liveTimer.textContent = calculateDuration(
      new Date(startTime),
      new Date()
    );
  }, 1000);
}

// Finish working session and save entry
  function endShift() {
    const endTime = new Date();

clockBtn.classList.remove("armed");
timerArmed = false;

    clearInterval(timerInterval);
    liveTimer.textContent = "00:00:00";

// Build timesheet entry
    const entry = {
      date: new Date().toLocaleDateString(),
      department: selectedDepartment,
      start: formatTime(startTime),
      end: formatTime(endTime),
      total: calculateDuration(startTime, endTime)
    };

    timeEntries.push(entry);
    saveTimeEntries();
    renderTimesheet();

    resetTimeClockLogic();

    isWorking = false;
    startTime = null;

    clockBtn.textContent = "Clock in";
    clockBtn.classList.remove("active");
    document.body.classList.remove("timer-running");

      timerService.clear();
  resetTimeClockLogic();
  resetTimeClockUI();
  }


// ==============================
// CLOCK BUTTON FLOW
// ==============================

// Handle main clock button behavior
clockBtn.addEventListener("click", () => {

// Require department selection before starting
  if (!selectedDepartment) {
    timeClockModal.classList.remove("hidden");
    return;
  }
// Arm → start shift
  if (!isWorking && timerArmed) {
    timerArmed = false;
    clockBtn.classList.remove("armed");
    startShift();
    return;
  }
 // End active shift
  if (isWorking) {
    endShift();
  }
});


// ==============================
// NAVIGATION (BACK TO EMPLOYEES)
// ==============================

  const backBtn = document.getElementById("backToEmployees");

if (backBtn) {
  backBtn.addEventListener("click", () => {
    showPage("employees");

    resetTimeClockUI();
  });
}


// ==============================
// TIME CLOCK RESET HELPERS
// ==============================

// Fully reset time clock runtime state
function resetTimeClockState() {

  // Reset department
  selectedDepartment = null;

// Reset department buttons
  departmentButtons.forEach(btn => {
    btn.classList.remove("active");
  });

// Reset Continue button
  continueBtn.disabled = true;
  continueBtn.querySelector(".btn-text").textContent = "Continue";
  continueBtn.querySelector(".btn-loader").classList.add("hidden");

// Safety: stop running timer
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  isWorking = false;
  startTime = null;
}


// ==============================
// ADD EMPLOYEE FLOW
// ==============================

// Open add employee modal
addEmployeeBtn.addEventListener("click", () => {
  addEmployeeModal.classList.remove("hidden");
});
// Cancel add employee
cancelAddEmployee.addEventListener("click", () => {
  resetAddEmployeeForm();
  addEmployeeModal.classList.add("hidden");
});
// Save new employee
saveAddEmployee.addEventListener("click", () => {
  addName.classList.remove("error");
  addPosition.classList.remove("error");
  addNameError.textContent = "";
  addPositionError.textContent = "";

const isValid = validateEmployeeFields(
  {
    name: addName.value,
    position: addPosition.value
  },
  {
    nameInput: addName,
    positionInput: addPosition,
    nameError: addNameError,
    positionError: addPositionError
  }
);

if (!isValid) return;

  const newEmployee = {
    id: getNextEmployeeId(employeesList),
    name: addName.value.trim(),
    position: addPosition.value.trim(),
    department: addDepartment.value,
    status: addStatus.value,
    hireDate: addHireDate.value || new Date().toISOString().slice(0, 10)
  };

  employeesList.unshift(newEmployee);
  saveEmployeesToStorage(employeesList);
  sortEmployees();

resetAddEmployeeForm();
  addEmployeeModal.classList.add("hidden");
});


// ==============================
// SORTING LOGIC
// ==============================

// Generate next employee ID based on current max ID
function getNextEmployeeId(list) {
  const maxId = list.reduce((max, e) => Math.max(max, Number(e.id) || 0), 0);
  return maxId + 1;
}
// Active sort directions
let hireDateSortDirection = null; // null | "asc" | "desc"

// Sort employees based on active filters + active sorting settings
function sortEmployees() {
  const filtered = filterEmployees(employeesList);
  let list = [...filtered];

   // Sort by Name
  if (nameSortDirection) {
    list.sort((a, b) =>
      nameSortDirection === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );
  }
 // Sort by Hire Date
  if (hireDateSortDirection) {
    list.sort((a, b) =>
      hireDateSortDirection === "asc"
        ? new Date(a.hireDate) - new Date(b.hireDate)
        : new Date(b.hireDate) - new Date(a.hireDate)
    );
  }

  renderEmployees(list);
  updateSortIndicators();
}

// Handle "Sort by Name" click
document.getElementById("sortByName").addEventListener("click", () => {
  // Toggle sort direction (asc <-> desc)
  nameSortDirection = nameSortDirection === "asc" ? "desc" : "asc";
  // Reset other sorting criteria
  hireDateSortDirection = null;

  sortEmployees();
});

// Update visual sort arrows in table headers
function updateSortIndicators() {
  const nameIndicator =
    document.querySelector("#sortByName .sort-indicator");
  const dateIndicator =
    document.querySelector("#sortByHireDate .sort-indicator");

  if (!nameIndicator || !dateIndicator) return;
// Set arrow for Name column (▲, ▼, or neutral ↕)
  nameIndicator.textContent = nameSortDirection
    ? nameSortDirection === "asc" ? "▲" : "▼"
    : "↕";
// Set arrow for Hire Date column
  dateIndicator.textContent = hireDateSortDirection
    ? hireDateSortDirection === "asc" ? "▲" : "▼"
    : "↕";
}

// Handle "Sort by Hire Date" click
document.getElementById("sortByHireDate").addEventListener("click", () => {
  // Toggle sort direction
  hireDateSortDirection = hireDateSortDirection === "asc" ? "desc" : "asc";
  // Reset other sorting criteria
  nameSortDirection = null;

  sortEmployees();
});


// ==============================
// EDIT EMPLOYEE: SAVE CHANGES
// Validate form, update employee in list, persist to storage
// ==============================

saveEditBtn.addEventListener("click", () => {
  if (currentEditId === null) return;
// Reset error UI
  editName.classList.remove("error");
  editPosition.classList.remove("error");
  editNameError.textContent = "";
  editPositionError.textContent = "";

// Validate required fields
  const isValid = validateEmployeeFields(
    {
      name: editName.value,
      position: editPosition.value
    },
    {
      nameInput: editName,
      positionInput: editPosition,
      nameError: editNameError,
      positionError: editPositionError
    }
  );

  if (!isValid) return;

// Find employee and update
  const index = employeesList.findIndex(e => e.id === currentEditId);
  if (index === -1) return;

  employeesList[index] = {
    ...employeesList[index],
    name: editName.value.trim(),
    position: editPosition.value.trim(),
    department: editDepartment.value,
    status: editStatus.value
  };

  // Persist + close modal + refresh table
  saveEmployeesToStorage(employeesList);
  editModal.classList.add("hidden");
  sortEmployees();
});


// ==============================
// LOGIN FORM VALIDATION
// Validate login + password inputs before attempting auth
// ==============================

function validateFields() {
  let valid = true;
// Reset UI state
  loginError.textContent = "";
  passwordError.textContent = "";
  loginInput.classList.remove("error");
  passwordInput.classList.remove("error");
// Validate login
  if (!loginInput.value.trim()) {
    loginInput.classList.add("error");
    loginError.textContent = "Login cannot be empty";
    valid = false;
  }
// Validate password
  if (!passwordInput.value.trim()) {
    passwordInput.classList.add("error");
    passwordError.textContent = "Password cannot be empty";
    valid = false;
  }

  return valid;
}


// ==============================
// AUTH RESULT MODAL
// Show success/error state after login attempt
// ==============================

function showAuthModal(type, title, message) {
  authIcon.className = `auth-icon ${type}`;
  authIcon.textContent = type === "success" ? "✓" : "✕";

  authTitle.textContent = title;
  authMessage.textContent = message;

  authModal.classList.remove("hidden");

  const authCard = authModal.querySelector(".auth-card");

// Always reset shake animation first
  authCard.classList.remove("shake");

// Back button visible only on error
  if (type === "success") {
    authBackBtn.classList.add("hidden");   // hidden
  } else {
    authBackBtn.classList.remove("hidden"); // visible
    void authCard.offsetWidth;     // restart animation
    authCard.classList.add("shake");
  }
}


// ==============================
// LOGIN FLOW
// Handle login attempt, update auth state and redirect
// ==============================

loginBtn.addEventListener("click", handleLogin);
passwordInput.addEventListener("keydown", e => {
  if (e.key === "Enter") handleLogin();
});

function handleLogin() {
  if (!validateFields()) return;

// UX: temporary disabled button state
  loginBtn.disabled = true;
  loginBtn.textContent = "Checking...";

  setTimeout(() => {
    loginBtn.disabled = false;
    loginBtn.textContent = "Sign in";

    const login = loginInput.value.trim();
    const password = passwordInput.value.trim();
    
// Validate login credentials
    if (login !== ADMIN_LOGIN) {
      showAuthModal(
        "error",
        "User not found",
        "A user with this login does not exist"
      );
      return;
    }

    if (password !== ADMIN_PASSWORD) {
      showAuthModal(
        "error",
        "Incorrect password",
        "The password you entered is incorrect"
      );
      return;
    }
// SUCCESS: persist auth state
    authService.login();

showAuthModal(
  "success",
  "Login successful",
  "Authentication successful"
);

// After short success screen — show app and redirect to Employees page
setTimeout(() => {
  authModal.classList.add("hidden");

// show app
  checkAuth();

// Force default page after successful login
  setCurrentPage("employees");
  showPage("employees");
}, 1200);

  }, 1000);
}

// Close auth modal manually on error
authBackBtn.addEventListener("click", () => {
  authModal.classList.add("hidden");
});


// ==============================
// AUTH STATE RENDERING
// Show login page or main app depending on auth flag
// ==============================

function checkAuth() {
  if (authService.isAuthenticated()) {
    loginPage.classList.add("hidden");
    appContent.classList.remove("hidden");
  } else {
    loginPage.classList.remove("hidden");
    appContent.classList.add("hidden");
  }
}


// ==============================
// LOGOUT FLOW
// Confirm logout in modal and reset stored page state
// ==============================

logoutBtn.addEventListener("click", () => {
  logoutModal.classList.remove("hidden");
});

cancelLogoutBtn.addEventListener("click", () => {
  logoutModal.classList.add("hidden");
});

confirmLogoutBtn.addEventListener("click", () => {
  authService.logout();

// Reset default page for next session
localStorage.setItem("currentPage", "employees");

  logoutModal.classList.add("hidden");
  checkAuth();
});
// Close logout modal via ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !logoutModal.classList.contains("hidden")) {
    logoutModal.classList.add("hidden");
  }
});


// ==============================
// THEME TOGGLE
// Switch dark/light theme and update icon
// ==============================

themeBtn.addEventListener("click", () => {
  themeService.toggleTheme();
  updateThemeIcon();
});

function updateThemeIcon() {
  const theme = themeService.getTheme();
  themeBtn.textContent = theme === "dark" ? "☀️" : "🌙";
} 


// ==============================
// GENERIC CONFIRM MODAL
// Reusable confirm modal for delete actions etc.
// ==============================

function openConfirmModal({ title, message, onConfirm }) {
  confirmTitle.textContent = title;
  confirmMessage.innerHTML = message;
  confirmModal.classList.remove("hidden");

  function close() {
    confirmModal.classList.add("hidden");
    document.removeEventListener("keydown", onKey);
  }

  function onKey(e) {
    if (e.key === "Escape") close();
    if (e.key === "Enter") {
      close();
      onConfirm();
    }
  }

  confirmOkBtn.onclick = () => {
    close();
    onConfirm();
  };

  confirmCancelBtn.onclick = close;
  document.addEventListener("keydown", onKey);
}


// ==============================
// ADD EMPLOYEE FORM: LIVE ERROR RESET
// Remove error highlighting when user edits inputs
// ==============================

[addName, addPosition].forEach(input => {
  input.addEventListener("input", () => {
    input.classList.remove("error");
    const errorEl = document.getElementById(input.id + "Error");
    if (errorEl) errorEl.textContent = "";
  });
});


// ==============================
// ADD EMPLOYEE FORM RESET
// Restore default values and clear errors
// ==============================

function resetAddEmployeeForm() {
  // values
  addName.value = "";
  addPosition.value = "";
  addDepartment.value = "IT";
  addStatus.value = "working";
  addHireDate.value = "";

  // errors (inputs)
  addName.classList.remove("error");
  addPosition.classList.remove("error");

  // errors (texts)
  addNameError.textContent = "";
  addPositionError.textContent = "";
}


// ==============================
// TIME CLOCK UI RESET
// Reset only visuals (buttons, Continue state)
// ==============================

function resetTimeClockUI() {
departmentButtons.forEach(btn => btn.classList.remove("active"));
  continueBtn.disabled = true;
  continueBtn.querySelector(".btn-text").textContent = "Continue";
  continueBtn.querySelector(".btn-loader").classList.add("hidden");
}


// ==============================
// TIME CLOCK LOGIC RESET
// Reset timer runtime state (no UI)
// ==============================

function resetTimeClockLogic() {
  isWorking = false;
  startTime = null;
  selectedDepartment = null;
}


// ==============================
// TIMER RESTORE (AFTER RELOAD)
// Restore working session if user had active timer
// ==============================

function restoreTimerState() {
  const saved = timerService.load();
  if (!saved) return;

  selectedDepartment = saved.selectedDepartment || null;

  setTimeout(() => {

    restoreSelectedDepartmentUI(); // ⬅️ ВАЖЛИВО

    if (saved.isWorking) {
      isWorking = true;
      startTime = new Date(saved.startTime);

      document.body.classList.add("timer-running");
      clockBtn.textContent = "Clock out";
      clockBtn.classList.add("active");

      liveTimer.textContent = calculateDuration(startTime, new Date());
      startTimerInterval();
    }
  }, 300);
}


// ==============================
// TIME ENTRIES STORAGE
// Save/load timesheet table from localStorage
// ==============================

function saveTimeEntries() {
  localStorage.setItem(TIMESHEET_KEY, JSON.stringify(timeEntries));
}

function loadTimeEntries() {
  const raw = localStorage.getItem(TIMESHEET_KEY);
  return raw ? JSON.parse(raw) : [];
}


// ==============================
// PAGE STATE STORAGE
// Remember last opened page between reloads
// ==============================

function setCurrentPage(page) {
  localStorage.setItem("currentPage", page);
}


// ==============================
// PAGE RESTORE (AFTER RELOAD)
// Restore last page and timer state if needed
// ==============================

function restorePageAfterReload() {
// If not authenticated — show employees layout only
  if (!authService.isAuthenticated()) {
    employeesPage.classList.remove("is-hidden");
    timeClockPage.classList.add("is-hidden");
    updateHeaderButtons("employees");
    return;
  }

  const timerState = timerService.load();
  const lastPage = localStorage.getItem("currentPage");

// Hide both first, then show only one
  employeesPage.classList.add("is-hidden");
  timeClockPage.classList.add("is-hidden");

  if (lastPage === "timeClock") {
    timeClockPage.classList.remove("is-hidden");
  } else {
    employeesPage.classList.remove("is-hidden");
  }
// Restore active timer (if running)
  if (timerState?.isWorking) {
    setTimeout(restoreTimerState, 300);
  }

  updateHeaderButtons(lastPage || "employees"); // 🔥 ВАЖЛИВО
}

// ==============================
// DEPARTMENT UI RESTORE
// Restore previously selected department after reload
// ==============================

function restoreSelectedDepartmentUI() {
  if (!selectedDepartment) return;

  departmentButtons.forEach(btn => {
    if (btn.textContent.trim() === selectedDepartment) {
      btn.classList.add("active");
    }
  });

  continueBtn.disabled = false;
}


// ==============================
// APP PRELOADER
// Fade-out and remove preloader after app is ready
// ==============================

function hideAppPreloader() {
  const preloader = document.getElementById("appPreloader");
  if (!preloader) return;

  preloader.classList.add("hidden");

  setTimeout(() => {
    preloader.remove();
  }, 300);
}


// ==============================
// APP INIT
// Initialize theme, auth, restore page state and preload
// ==============================

document.addEventListener("DOMContentLoaded", initApp);

function initApp() {
// 1) Theme initialization
  themeService.init();
  updateThemeIcon();

// 2) Auth state rendering
  checkAuth();

// 3) Ensure default page exists
  if (!localStorage.getItem("currentPage")) {
    setCurrentPage("employees");
  }

// 4) Restore page + timer state
  restorePageAfterReload();

// 5) Preloader fade-out
  setTimeout(hideAppPreloader, 1000);
}


// ==============================
// TIME CLOCK ARM MODE
// Enable "Start shift" state before actual start
// ==============================

function armTimer() {
  timerArmed = true;

  clockBtn.classList.add("armed");
  clockBtn.textContent = "Start shift";

// Optional UX cue
  document.body.classList.add("timer-armed");
}

// ==============================
// PAGE NAVIGATION
// Show one page and sync header state + persist to storage
// ==============================

function showPage(page) {
  employeesPage.classList.add("is-hidden");
  timeClockPage.classList.add("is-hidden");

  if (page === "employees") {
    employeesPage.classList.remove("is-hidden");
  }

  if (page === "timeClock") {
    timeClockPage.classList.remove("is-hidden");
  }

// Header state
  timeClockBtn.classList.toggle("is-active", page === "timeClock");
  timeClockBtn.classList.toggle("is-disabled", page === "timeClock");

  setCurrentPage(page);
}


// ==============================
// EMPLOYEE FORM VALIDATION
// Used for add/edit employee modals
// ==============================

function validateEmployeeFields({ name, position }, options = {}) {
  let valid = true;

  if (!name.trim()) {
    if (options.nameInput) {
      options.nameInput.classList.add("error");
    }
    if (options.nameError) {
      options.nameError.textContent = "Name is required";
    }
    valid = false;
  }

  if (!position.trim()) {
    if (options.positionInput) {
      options.positionInput.classList.add("error");
    }
    if (options.positionError) {
      options.positionError.textContent = "Position is required";
    }
    valid = false;
  }

  return valid;
}


// ==============================
// KEYBOARD SHORTCUTS
// Submit modal forms on Enter
// ==============================

function submitOnEnter(inputs, submitButton) {
  inputs.forEach(input => {
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitButton.click();
      }
    });
  });
}

submitOnEnter([editName, editPosition], saveEditBtn);
submitOnEnter([addName, addPosition], saveAddEmployee);


// ==============================
// MODAL ENTER/ESC HANDLING (TIME CLOCK)
// Allow Enter to confirm, Esc to close
// ==============================

function enableTimeClockEnterSubmit() {
  function onKey(e) {
    if (e.key === "Enter") {
      if (!timeClockModal.classList.contains("hidden") && selectedDepartment) {
        e.preventDefault();
        continueBtn.click();
      }
    }

    if (e.key === "Escape") {
      if (!timeClockModal.classList.contains("hidden")) {
        closeTimeClockModal();
      }
    }
  }

  document.addEventListener("keydown", onKey);

// Cleanup listener when modal closes (prevents leaks)
  timeClockModal.addEventListener("transitionend", () => {
    if (timeClockModal.classList.contains("hidden")) {
      document.removeEventListener("keydown", onKey);
    }
  });
}


// ==============================
// GENERIC ESC HANDLER FOR MODALS
// Attach Esc close behavior for any modal element
// ==============================

function enableModalEsc(modalEl, onClose) {
  function onKey(e) {
    if (e.key !== "Escape") return;
    if (modalEl.classList.contains("hidden")) return;

    e.preventDefault();
    onClose();
  }

  document.addEventListener("keydown", onKey);

// optional cleanup 
  return () => document.removeEventListener("keydown", onKey);
}

// Bind Esc close for edit modal
enableModalEsc(editModal, () => {
  editModal.classList.add("hidden");
  currentEditId = null;
});

// Bind Esc close for add employee modal
enableModalEsc(addEmployeeModal, () => {
  resetAddEmployeeForm();
  addEmployeeModal.classList.add("hidden");
});


// ==============================
// HEADER BUTTONS STATE
// Disable Time Clock button when already on Time Clock page
// ==============================

function updateHeaderButtons(page) {
  if (page === "timeClock") {
    timeClockBtn.classList.add("is-disabled");
  } else {
    timeClockBtn.classList.remove("is-disabled");
  }
}


// ==============================
// CUSTOM SELECT UI
// Replace native <select> with custom dropdown styling
// ==============================

document.querySelectorAll(".custom-select").forEach(select => {
  const trigger = select.querySelector(".select-trigger");
  const valueEl = select.querySelector(".select-value");
  const options = select.querySelectorAll(".option");
  const realSelect = select.querySelector("select");

// Toggle dropdown
  trigger.addEventListener("click", () => {
    select.classList.toggle("open");
  });
// Option selection
  options.forEach(option => {
    option.addEventListener("click", () => {
      const value = option.dataset.value;
      const label = option.textContent;

      valueEl.textContent = label;
      realSelect.value = value;

// Trigger native change listeners (filters etc.)      
      realSelect.dispatchEvent(new Event("change"));

// Update active class
      options.forEach(o => o.classList.remove("active"));
      option.classList.add("active");

      select.classList.remove("open");
    });
  });
});

// Close any open dropdown when clicking outside
document.addEventListener("click", e => {
  document.querySelectorAll(".custom-select").forEach(select => {
    if (!select.contains(e.target)) {
      select.classList.remove("open");
    }
  });
});

// Sync custom select UI when value is changed programmatically
function syncCustomSelect(selectId) {
  const realSelect = document.getElementById(selectId);
  const wrapper = realSelect.closest(".custom-select");
  if (!wrapper) return;

  const valueEl = wrapper.querySelector(".select-value");
  const options = wrapper.querySelectorAll(".option");

  const selectedOption = [...options].find(
    o => o.dataset.value === realSelect.value
  );

  if (selectedOption) {
    valueEl.textContent = selectedOption.textContent;

    options.forEach(o => o.classList.remove("active"));
    selectedOption.classList.add("active");
  }
}

// ==============================
// HOME LINK (NAV)
// Force navigation to Employees page without reload
// ==============================

homeLink.addEventListener("click", (e) => {
  e.preventDefault();
  showPage("employees")
});












































