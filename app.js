import { CONFIG } from './config.js';

class ScheduleConverter {
    constructor() {
        this.classes = [];
        this.initElements();
        this.bindEvents();
    }

    initElements() {
        // Form elements
        this.classForm = document.getElementById('class-form');
        this.className = document.getElementById('class-name');
        this.classLocation = document.getElementById('class-location');
        this.classDays = document.getElementsByName('class-days');
        this.startTime = document.getElementById('start-time');
        this.endTime = document.getElementById('end-time');
        this.startDate = document.getElementById('start-date');
        this.endDate = document.getElementById('end-date');
        
        // Display elements
        this.classesList = document.getElementById('classes-list');
        this.noClassesMessage = document.getElementById('no-classes-message');
        
        // Export buttons
        this.exportIcsBtn = document.getElementById('export-ics');
        this.exportCsvBtn = document.getElementById('export-csv');
        
        // Modal elements
        this.helpModal = document.getElementById('help-modal');
        this.helpLink = document.getElementById('help-link');
        this.closeModal = document.querySelector('.close');
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabPanes = document.querySelectorAll('.tab-pane');
        
        // Set default dates
        const today = new Date();
        this.startDate.valueAsDate = today;
        
        const endDefaultDate = new Date();
        endDefaultDate.setMonth(today.getMonth() + CONFIG.defaultSemesterLength);
        this.endDate.valueAsDate = endDefaultDate;
    }

    bindEvents() {
        // Form submission
        this.classForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addClass();
        });
        
        // Export buttons
        this.exportIcsBtn.addEventListener('click', () => this.exportIcs());
        this.exportCsvBtn.addEventListener('click', () => this.exportCsv());
        
        // Modal events
        this.helpLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.helpModal.style.display = 'block';
        });
        
        this.closeModal.addEventListener('click', () => {
            this.helpModal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === this.helpModal) {
                this.helpModal.style.display = 'none';
            }
        });
        
        // Tab functionality
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const tabId = btn.getAttribute('data-tab');
                this.tabPanes.forEach(pane => {
                    pane.classList.remove('active');
                    if (pane.id === tabId) {
                        pane.classList.add('active');
                    }
                });
            });
        });
    }

    addClass() {
        // Validate required fields
        if (!this.className.value || !this.startTime.value || !this.endTime.value || !this.startDate.value || !this.endDate.value) {
            alert('Please fill in all required fields');
            return;
        }
        
        // Get selected days
        const selectedDays = [];
        this.classDays.forEach(day => {
            if (day.checked) {
                selectedDays.push(day.value);
            }
        });
        
        if (selectedDays.length === 0) {
            alert('Please select at least one day for the class');
            return;
        }
        
        // Create class object
        const classObj = {
            id: Date.now(),
            name: this.className.value,
            location: this.classLocation.value,
            days: selectedDays,
            startTime: this.startTime.value,
            endTime: this.endTime.value,
            startDate: this.startDate.value,
            endDate: this.endDate.value
        };
        
        // Add to classes array
        this.classes.push(classObj);
        
        // Update display
        this.updateClassesDisplay();
        
        // Reset form
        this.classForm.reset();
        
        // Re-set default dates after form reset
        const today = new Date();
        this.startDate.valueAsDate = today;
        
        const endDefaultDate = new Date();
        endDefaultDate.setMonth(today.getMonth() + CONFIG.defaultSemesterLength);
        this.endDate.valueAsDate = endDefaultDate;
        
        // Enable export buttons
        this.exportIcsBtn.disabled = false;
        this.exportCsvBtn.disabled = false;
    }

    updateClassesDisplay() {
        if (this.classes.length === 0) {
            this.noClassesMessage.style.display = 'block';
            return;
        }
        
        this.noClassesMessage.style.display = 'none';
        this.classesList.innerHTML = '';
        
        this.classes.forEach(classObj => {
            const classCard = document.createElement('div');
            classCard.className = 'class-card';
            
            const dayNames = {
                'MO': 'Monday',
                'TU': 'Tuesday',
                'WE': 'Wednesday',
                'TH': 'Thursday',
                'FR': 'Friday',
                'SA': 'Saturday',
                'SU': 'Sunday'
            };
            
            const formattedDays = classObj.days.map(day => dayNames[day]).join(', ');
            
            classCard.innerHTML = `
                <h4>${classObj.name}</h4>
                <p><strong>Location:</strong> ${classObj.location || 'N/A'}</p>
                <p><strong>Days:</strong> ${formattedDays}</p>
                <p><strong>Time:</strong> ${this.formatTime(classObj.startTime)} - ${this.formatTime(classObj.endTime)}</p>
                <p><strong>Dates:</strong> ${this.formatDate(classObj.startDate)} - ${this.formatDate(classObj.endDate)}</p>
                <button class="remove-class" data-id="${classObj.id}">×</button>
            `;
            
            classCard.querySelector('.remove-class').addEventListener('click', () => {
                this.removeClass(classObj.id);
            });
            
            this.classesList.appendChild(classCard);
        });
    }

    removeClass(id) {
        this.classes = this.classes.filter(classObj => classObj.id !== id);
        this.updateClassesDisplay();
        
        if (this.classes.length === 0) {
            this.exportIcsBtn.disabled = true;
            this.exportCsvBtn.disabled = true;
        }
    }

    exportIcs() {
        const events = [];
        
        this.classes.forEach(classObj => {
            const startDate = new Date(classObj.startDate);
            const endDate = new Date(classObj.endDate);
            
            // For each day of the week that this class occurs
            classObj.days.forEach(day => {
                // Find the first occurrence of this day after start date
                let currentDate = new Date(startDate);
                const dayMap = { 'MO': 1, 'TU': 2, 'WE': 3, 'TH': 4, 'FR': 5, 'SA': 6, 'SU': 0 };
                
                while (currentDate <= endDate) {
                    if (currentDate.getDay() === dayMap[day]) {
                        const [startHour, startMin] = classObj.startTime.split(':').map(Number);
                        const [endHour, endMin] = classObj.endTime.split(':').map(Number);
                        
                        const eventString = [
                            'BEGIN:VEVENT',
                            'CLASS:PUBLIC',
                            `DESCRIPTION:${CONFIG.includeDescriptionInEvents ? `Class: ${classObj.name}` : ''}`,
                            `DTSTART:${this.formatDateTimeForIcs(currentDate, startHour, startMin)}`,
                            `DTEND:${this.formatDateTimeForIcs(currentDate, endHour, endMin)}`,
                            `LOCATION:${classObj.location || ''}`,
                            'SEQUENCE:0',
                            'STATUS:CONFIRMED',
                            `SUMMARY:${classObj.name}`,
                            'TRANSP:OPAQUE',
                            'END:VEVENT'
                        ].join('\r\n');
                        
                        events.push(eventString);
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            });
        });
        
        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Class Schedule Converter//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            ...events,
            'END:VCALENDAR'
        ].join('\r\n');
        
        this.downloadFile(icsContent, 'class-schedule.ics', 'text/calendar');
    }

    formatDateTimeForIcs(date, hours, minutes) {
        return `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}T${hours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}00`;
    }

    exportCsv() {
        const header = ['Subject', 'Start Date', 'Start Time', 'End Date', 'End Time', 'All Day Event', 'Description', 'Location', 'Private'];
        const rows = [header];
        
        this.classes.forEach(classObj => {
            const startDate = new Date(classObj.startDate);
            const endDate = new Date(classObj.endDate);
            
            classObj.days.forEach(day => {
                // Find the first occurrence of this day after start date
                let currentDate = new Date(startDate);
                const dayMap = { 'MO': 1, 'TU': 2, 'WE': 3, 'TH': 4, 'FR': 5, 'SA': 6, 'SU': 0 };
                
                while (currentDate <= endDate) {
                    if (currentDate.getDay() === dayMap[day]) {
                        const formattedDate = `${currentDate.getMonth() + 1}/${currentDate.getDate()}/${currentDate.getFullYear()}`;
                        
                        rows.push([
                            classObj.name,                                          // Subject
                            formattedDate,                                         // Start Date
                            this.formatTimeForCsv(classObj.startTime),             // Start Time
                            formattedDate,                                         // End Date
                            this.formatTimeForCsv(classObj.endTime),               // End Time
                            'FALSE',                                               // All Day Event
                            CONFIG.includeDescriptionInEvents ? `Class: ${classObj.name}` : '',  // Description
                            classObj.location,                                     // Location
                            'FALSE'                                                // Private
                        ]);
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            });
        });
        
        // Convert rows to CSV
        const csvContent = rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
        this.downloadFile(csvContent, 'class-schedule.csv', 'text/csv');
    }

    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
    }

    formatTime(time) {
        if (!time) return '';
        
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        
        return `${formattedHour}:${minutes} ${ampm}`;
    }

    formatTimeForCsv(time) {
        if (!time) return '';
        
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        
        return `${formattedHour}:${minutes}:00 ${ampm}`;
    }

    formatDate(dateStr) {
        if (!dateStr) return '';
        
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ScheduleConverter();
});