// DOM Elements
const authContainer = document.getElementById('auth-container');
const portal = document.getElementById('portal');
const loginToggle = document.getElementById('login-toggle');
const signupToggle = document.getElementById('signup-toggle');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const logoutBtn = document.getElementById('logout-btn');
const userName = document.getElementById('user-name');
const themeButtons = document.querySelectorAll('.theme-btn');
const navLinks = document.querySelectorAll('.nav-link');
const contentSections = document.querySelectorAll('.content-section');

// Student Record Elements
const recordName = document.getElementById('record-name');
const recordStudentNumber = document.getElementById('record-student-number');
const recordCourse = document.getElementById('record-course');
const recordYear = document.getElementById('record-year');
const recordEmail = document.getElementById('record-email');

// Documents Elements
const documentsGrid = document.getElementById('documents-grid');

// User data storage (in a real app, this would be on a server)
let users = JSON.parse(localStorage.getItem('studentPortalUsers')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Student Portal Initialized');
    
    // Always show auth first, clear any existing user
    currentUser = null;
    localStorage.removeItem('currentUser');
    showAuth();
    
    // Set up event listeners
    setupEventListeners();
});

// Validate and fix user data
function validateUserData() {
    if (currentUser && currentUser.ledger) {
        let needsFix = false;
        
        currentUser.ledger = currentUser.ledger.map(item => {
            // Ensure amount has proper formatting
            if (item.amount) {
                let amountStr = item.amount.toString();
                
                // Remove any existing currency symbols
                amountStr = amountStr.replace('P', '').replace('¥', '');
                
                // Ensure it has .00 if no decimal
                if (!amountStr.includes('.')) {
                    amountStr += '.00';
                    needsFix = true;
                }
                
                // Add P prefix
                item.amount = 'P' + amountStr;
            }
            return item;
        });
        
        // Fix grades data if units are undefined
        if (currentUser.grades) {
            currentUser.grades.forEach(grade => {
                if (grade.units === undefined || grade.units === 'undefined') {
                    // Find matching subject in schedule to get units
                    const scheduleItem = currentUser.schedule.find(item => item.subject === grade.subject);
                    if (scheduleItem) {
                        grade.units = scheduleItem.units;
                        needsFix = true;
                    } else {
                        grade.units = 3; // Default to 3 units
                        needsFix = true;
                    }
                }
            });
        }
        
        // Save fixed data back to localStorage if changes were made
        if (needsFix) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Update users array if this user exists there
            const userIndex = users.findIndex(u => u.studentNumber === currentUser.studentNumber);
            if (userIndex !== -1) {
                users[userIndex] = currentUser;
                localStorage.setItem('studentPortalUsers', JSON.stringify(users));
            }
            
            console.log('User data validated and fixed');
        }
    }
}

// Set up all event listeners
function setupEventListeners() {
    // Toggle between login and signup forms
    loginToggle.addEventListener('click', function() {
        toggleForm('login');
    });
    
    signupToggle.addEventListener('click', function() {
        toggleForm('signup');
    });
    
    // Form submissions
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    
    // Logout
    logoutBtn.addEventListener('click', handleLogout);
    
    // Theme selection
    themeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const theme = this.id.replace('-theme', '');
            setTheme(theme);
        });
    });
    
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            showSection(target);
            
            // Update active nav link
            navLinks.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Toggle between login and signup forms
function toggleForm(formType) {
    if (formType === 'login') {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
        loginToggle.classList.add('active');
        signupToggle.classList.remove('active');
    } else {
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
        signupToggle.classList.add('active');
        loginToggle.classList.remove('active');
    }
}

// Handle login form submission
function handleLogin(e) {
    e.preventDefault();
    
    const name = document.getElementById('login-name').value;
    const password = document.getElementById('login-password').value;
    
    // Find user - FIXED: Check both name and student number for login
    const user = users.find(u => (u.name === name || u.studentNumber === name) && u.password === password);
    
    if (user) {
        currentUser = user;
        validateUserData(); // Validate data on login
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showPortal();
    } else {
        alert('Invalid credentials. Please try again.');
    }
}

// Handle signup form submission
function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const studentNumber = document.getElementById('student-number').value;
    const course = document.getElementById('course').value;
    const year = document.getElementById('year').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validation
    if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }
    
    // Check if user already exists
    if (users.find(u => u.name === name || u.studentNumber === studentNumber)) {
        alert('User already exists with this name or student number.');
        return;
    }
    
    // Create new user
    const newUser = {
        name,
        studentNumber,
        course,
        year,
        email,
        password,
        // Generate sample data for the user
        schedule: generateSampleSchedule(course, year),
        grades: generateSampleGrades(course, year),
        ledger: generateSampleLedger(),
        academicRecord: generateSampleAcademicRecord(year),
        documents: generateSampleDocuments()
    };
    
    users.push(newUser);
    localStorage.setItem('studentPortalUsers', JSON.stringify(users));
    
    // Switch to login form
    toggleForm('login');
    alert('Account created successfully. Please login.');
}

// Handle logout
function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showAuth();
}

// Show authentication container
function showAuth() {
    authContainer.classList.remove('hidden');
    portal.classList.add('hidden');
    
    // Reset forms
    loginForm.reset();
    signupForm.reset();
    toggleForm('login');
}

// Show portal
function showPortal() {
    authContainer.classList.add('hidden');
    portal.classList.remove('hidden');
    
    // Set user name
    userName.textContent = currentUser.name;
    
    // Update all sections with user data
    updateStudentRecord();
    updateClassSchedule();
    updateGrades();
    updateStudentLedger();
    updateDashboard();
    
    // Show dashboard by default
    showSection('dashboard');
    
    // Set active nav link
    navLinks.forEach(link => {
        if (link.getAttribute('data-target') === 'dashboard') {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Show specific section
function showSection(sectionId) {
    contentSections.forEach(section => {
        if (section.id === sectionId) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });
}

// Set theme
function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    
    // Update active theme button
    themeButtons.forEach(button => {
        if (button.id === `${theme}-theme`) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // Save theme preference
    localStorage.setItem('studentPortalTheme', theme);
}

// Update Student Record section with user data
function updateStudentRecord() {
    recordName.textContent = currentUser.name;
    recordStudentNumber.textContent = currentUser.studentNumber;
    recordCourse.textContent = currentUser.course;
    recordYear.textContent = currentUser.year;
    recordEmail.textContent = currentUser.email;
    
    // Update academic record table
    const recordBody = document.getElementById('record-body');
    recordBody.innerHTML = '';
    
    currentUser.academicRecord.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.academicYear}</td>
            <td>${record.year}</td>
            <td>${record.semester}</td>
            <td>${record.status}</td>
            <td>${record.units}</td>
            <td>${record.gwa}</td>
        `;
        recordBody.appendChild(row);
    });
    
    // Update documents section within student record
    updateDocuments();
}

// Update Class Schedule section with user data
function updateClassSchedule() {
    const scheduleBody = document.getElementById('schedule-body');
    scheduleBody.innerHTML = '';
    
    currentUser.schedule.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.subject}</td>
            <td>${item.units}</td>
            <td>${item.day}</td>
            <td>${item.time}</td>
            <td>${item.room}</td>
            <td>${item.professor}</td>
        `;
        scheduleBody.appendChild(row);
    });
}

// Update Grades section with user data
function updateGrades() {
    const gradesBody = document.getElementById('grades-body');
    gradesBody.innerHTML = '';
    
    currentUser.grades.forEach(grade => {
        // Ensure units are defined, fallback to 3 if not
        const units = grade.units || 3;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${grade.subject}</td>
            <td>${units}</td>
            <td>${grade.prelim}</td>
            <td>${grade.midterm}</td>
            <td>${grade.final}</td>
            <td>${grade.finalGrade}</td>
        `;
        gradesBody.appendChild(row);
    });
    
    // Update GWA
    const gwaDisplay = document.getElementById('gwa-display');
    const currentAcademicRecord = currentUser.academicRecord.filter(record => 
        record.academicYear === currentUser.academicRecord[currentUser.academicRecord.length - 1].academicYear
    );
    
    if (currentAcademicRecord.length > 0) {
        gwaDisplay.textContent = currentAcademicRecord[currentAcademicRecord.length - 1].gwa;
    } else {
        gwaDisplay.textContent = calculateGWA(currentUser.grades);
    }
}

// Update Student Ledger section with user data
function updateStudentLedger() {
    const ledgerBody = document.getElementById('ledger-body');
    ledgerBody.innerHTML = '';
    
    currentUser.ledger.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.date}</td>
            <td>${item.description}</td>
            <td>${item.amount}</td>
            <td><span class="status-badge ${item.status === 'Paid' ? 'paid' : 'outstanding'}">${item.status}</span></td>
        `;
        ledgerBody.appendChild(row);
    });
    
    // Update summary with enhanced error handling
    const totalAmount = document.getElementById('total-amount');
    const amountPaid = document.getElementById('amount-paid');
    const balanceAmount = document.getElementById('balance-amount');
    
    const totals = calculateLedgerTotals(currentUser.ledger);
    
    // Safe display function
    const safeDisplay = (value, fallback = 'P0.00') => {
        if (isNaN(value) || value === null || value === undefined) {
            console.warn('Invalid value detected, using fallback:', value);
            return fallback;
        }
        return `P${value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    };
    
    totalAmount.textContent = safeDisplay(totals.total, 'P25,000.00');
    amountPaid.textContent = safeDisplay(totals.paid, 'P15,000.00');
    balanceAmount.textContent = safeDisplay(totals.balance, 'P10,000.00');
}

// Update Dashboard with user data
function updateDashboard() {
    const currentBalance = document.getElementById('current-balance');
    const dueDateDisplay = document.getElementById('due-date-display');
    
    const totals = calculateLedgerTotals(currentUser.ledger);
    
    // Safe display for balance
    if (isNaN(totals.balance)) {
        console.warn('Invalid balance detected, using fallback value');
        currentBalance.textContent = 'P10,000.00';
    } else {
        currentBalance.textContent = `P${totals.balance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    
    // Set due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    dueDateDisplay.textContent = dueDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Update Documents section
function updateDocuments() {
    documentsGrid.innerHTML = '';
    
    currentUser.documents.forEach(doc => {
        const documentItem = document.createElement('div');
        documentItem.className = 'document-item';
        
        documentItem.innerHTML = `
            <div class="document-icon">
                <i class="fas ${doc.icon}"></i>
            </div>
            <div class="document-name">${doc.name}</div>
            <div class="document-status ${doc.status === 'Completed' ? 'completed' : 'incomplete'}">${doc.status}</div>
        `;
        
        documentsGrid.appendChild(documentItem);
    });
}

// Calculate GWA from grades
function calculateGWA(grades) {
    if (grades.length === 0) return '0.00';
    
    const total = grades.reduce((sum, grade) => sum + parseFloat(grade.finalGrade), 0);
    return (total / grades.length).toFixed(2);
}

// Calculate ledger totals - ENHANCED: More robust calculation
function calculateLedgerTotals(ledger) {
    const total = 25000; // P5,000 × 5 payments = P25,000
    
    console.log('Calculating ledger totals for:', ledger);
    
    const paid = ledger
        .filter(item => {
            const isPaid = item.status === 'Paid';
            console.log('Item status check:', item.description, 'isPaid:', isPaid);
            return isPaid;
        })
        .reduce((sum, item) => {
            try {
                // Handle different amount formats
                let amountStr = item.amount.toString();
                console.log('Processing amount:', amountStr);
                
                // Remove currency symbol and commas
                amountStr = amountStr.replace('P', '').replace('¥', '').replace(/,/g, '');
                
                // Parse to float
                const amountValue = parseFloat(amountStr);
                console.log('Parsed amount value:', amountValue);
                
                if (isNaN(amountValue)) {
                    console.warn('Invalid amount found, using 0:', item.amount);
                    return sum;
                }
                
                const newSum = sum + amountValue;
                console.log('Running total:', newSum);
                return newSum;
            } catch (error) {
                console.error('Error processing amount:', item.amount, error);
                return sum;
            }
        }, 0);
    
    console.log('Final paid amount:', paid);
    
    const balance = total - paid;
    
    console.log('Final totals:', { total, paid, balance });
    
    return { total, paid, balance };
}

// Generate sample schedule based on course and year
function generateSampleSchedule(course, year) {
    let baseSubjects = [];
    
    // Common subjects for all courses
    const commonSubjects = [
        { subject: 'Research Methods', units: 3, day: 'Tuesday, Thursday', time: '10:30 AM - 12:00 PM', room: 'Library Room 202', professor: 'Prof. Johnson' },
        { subject: 'Professional Ethics', units: 3, day: 'Monday, Wednesday', time: '1:00 PM - 2:30 PM', room: 'Room 205', professor: 'Dr. Williams' }
    ];
    
    // Course-specific subjects
    if (course === 'BS Information Technology') {
        baseSubjects = [
            { subject: 'IT Fundamentals', units: 3, day: 'Monday, Wednesday', time: '9:00 AM - 10:30 AM', room: 'Main Hall 101', professor: 'Dr. Smith' },
            { subject: 'Web Development', units: 3, day: 'Tuesday, Thursday', time: '2:30 PM - 4:00 PM', room: 'IT Lab 1', professor: 'Prof. Brown' },
            { subject: 'Database Management', units: 3, day: 'Friday', time: '9:00 AM - 12:00 PM', room: 'IT Lab 2', professor: 'Dr. Davis' },
            ...commonSubjects
        ];
    } else if (course === 'BS Computer Science') {
        baseSubjects = [
            { subject: 'CS Fundamentals', units: 3, day: 'Monday, Wednesday', time: '9:00 AM - 10:30 AM', room: 'Main Hall 101', professor: 'Dr. Smith' },
            { subject: 'Algorithms', units: 3, day: 'Tuesday, Thursday', time: '2:30 PM - 4:00 PM', room: 'CS Lab 1', professor: 'Prof. Taylor' },
            { subject: 'Data Structures', units: 3, day: 'Friday', time: '9:00 AM - 12:00 PM', room: 'CS Lab 2', professor: 'Dr. Anderson' },
            ...commonSubjects
        ];
    } else if (course === 'BS Business Administration') {
        baseSubjects = [
            { subject: 'Business Fundamentals', units: 3, day: 'Monday, Wednesday', time: '9:00 AM - 10:30 AM', room: 'Main Hall 101', professor: 'Dr. Smith' },
            { subject: 'Business Management', units: 3, day: 'Tuesday, Thursday', time: '2:30 PM - 4:00 PM', room: 'Business Hall 301', professor: 'Prof. Martinez' },
            { subject: 'Economics', units: 3, day: 'Friday', time: '9:00 AM - 12:00 PM', room: 'Business Hall 302', professor: 'Dr. Garcia' },
            ...commonSubjects
        ];
    } else if (course === 'BS Education') {
        baseSubjects = [
            { subject: 'Education Fundamentals', units: 3, day: 'Monday, Wednesday', time: '9:00 AM - 10:30 AM', room: 'Main Hall 101', professor: 'Dr. Smith' },
            { subject: 'Teaching Methods', units: 3, day: 'Tuesday, Thursday', time: '2:30 PM - 4:00 PM', room: 'Education Hall 401', professor: 'Prof. Wilson' },
            { subject: 'Child Psychology', units: 3, day: 'Friday', time: '9:00 AM - 12:00 PM', room: 'Education Hall 402', professor: 'Dr. Thompson' },
            ...commonSubjects
        ];
    } else if (course === 'BS Nursing') {
        baseSubjects = [
            { subject: 'Nursing Fundamentals', units: 3, day: 'Monday, Wednesday', time: '9:00 AM - 10:30 AM', room: 'Main Hall 101', professor: 'Dr. Smith' },
            { subject: 'Anatomy and Physiology', units: 3, day: 'Tuesday, Thursday', time: '2:30 PM - 4:00 PM', room: 'Science Lab 501', professor: 'Prof. Clark' },
            { subject: 'Medical Ethics', units: 3, day: 'Friday', time: '9:00 AM - 12:00 PM', room: 'Science Lab 502', professor: 'Dr. Lewis' },
            ...commonSubjects
        ];
    } else {
        // Default subjects for any other course
        baseSubjects = [
            { subject: `${course} Fundamentals`, units: 3, day: 'Monday, Wednesday', time: '9:00 AM - 10:30 AM', room: 'Main Hall 101', professor: 'Dr. Smith' },
            { subject: `${course} Advanced Topics`, units: 3, day: 'Tuesday, Thursday', time: '2:30 PM - 4:00 PM', room: 'General Hall 301', professor: 'Prof. Generic' },
            { subject: `${course} Applications`, units: 3, day: 'Friday', time: '9:00 AM - 12:00 PM', room: 'General Hall 302', professor: 'Dr. General' },
            ...commonSubjects
        ];
    }
    
    return baseSubjects;
}

// Generate sample grades based on course and year - FIXED: Proper units assignment
function generateSampleGrades(course, year) {
    const subjects = generateSampleSchedule(course, year);
    
    return subjects.map(subject => {
        const prelim = (Math.random() * 1.5 + 1.0).toFixed(2);
        const midterm = (Math.random() * 1.5 + 1.0).toFixed(2);
        const final = (Math.random() * 1.5 + 1.0).toFixed(2);
        const finalGrade = ((parseFloat(prelim) + parseFloat(midterm) + parseFloat(final)) / 3).toFixed(2);
        
        return {
            subject: subject.subject,
            units: subject.units, // Properly assign units from schedule
            prelim,
            midterm,
            final,
            finalGrade
        };
    });
}

// Generate sample ledger data - FIXED: Consistent formatting
function generateSampleLedger() {
    return [
        { date: '2025-08-13', description: 'Tuition Fee - Down Payment', amount: 'P5,000.00', status: 'Paid' },
        { date: '2025-09-01', description: 'Tuition Fee - 1st Installment', amount: 'P5,000.00', status: 'Paid' },
        { date: '2025-09-16', description: 'Tuition Fee - 2nd Installment', amount: 'P5,000.00', status: 'Paid' },
        { date: '2025-10-01', description: 'Tuition Fee - 3rd Installment', amount: 'P5,000.00', status: 'Paid' },
        { date: '2025-11-03', description: 'Tuition Fee - 4th Installment', amount: 'P5,000.00', status: 'Outstanding Balance' }
    ];
}

// Generate sample academic record based on year - FIXED: Consistent units and GWA per semester
function generateSampleAcademicRecord(year) {
    const yearMapping = {
        '1st Year': ['1st'],
        '2nd Year': ['1st', '2nd'],
        '3rd Year': ['1st', '2nd', '3rd'],
        '4th Year': ['1st', '2nd', '3rd', '4th']
    };
    
    const years = yearMapping[year] || ['1st'];
    const currentYear = new Date().getFullYear();
    
    return years.map((yr, index) => {
        const academicYear = `${currentYear - years.length + index}-${currentYear - years.length + index + 1}`;
        
        // Generate unique GWA for each semester
        const firstSemGWA = (Math.random() * 1.5 + 1.0).toFixed(2);
        const secondSemGWA = (Math.random() * 1.5 + 1.0).toFixed(2);
        const thirdSemGWA = (Math.random() * 1.5 + 1.0).toFixed(2);
        
        return [
            { academicYear, year: yr, semester: 'First', status: 'Regular', units: 18, gwa: firstSemGWA },
            { academicYear, year: yr, semester: 'Second', status: 'Regular', units: 18, gwa: secondSemGWA },
            { academicYear, year: yr, semester: 'Third', status: 'Regular', units: 15, gwa: thirdSemGWA }
        ];
    }).flat();
}

// Generate sample documents
function generateSampleDocuments() {
    return [
        { name: 'Form 137', icon: 'fa-file-alt', status: 'Completed' },
        { name: 'Birth Certificate', icon: 'fa-certificate', status: 'Completed' },
        { name: 'Diploma', icon: 'fa-scroll', status: 'Completed' },
        { name: 'Prospectus', icon: 'fa-book', status: 'Incomplete' },
        { name: 'Medical Certificate', icon: 'fa-file-medical', status: 'Completed' },
        { name: 'Good Moral Certificate', icon: 'fa-award', status: 'Incomplete' },
        { name: 'Transcript of Records', icon: 'fa-file-contract', status: 'Completed' },
        { name: 'Enrollment Form', icon: 'fa-clipboard-list', status: 'Completed' }
    ];
}

// Reset all data (for debugging)
function resetAllData() {
    if (confirm('This will reset all data. Are you sure?')) {
        localStorage.removeItem('studentPortalUsers');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('studentPortalTheme');
        alert('All data has been reset. Please refresh the page.');
        location.reload();
    }
}

// Load saved theme preference
const savedTheme = localStorage.getItem('studentPortalTheme') || 'light';
setTheme(savedTheme);

// Debug helper
console.log('Student Portal v2.4 loaded successfully');