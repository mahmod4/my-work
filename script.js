// Google Sheets URL - Multiple formats to try
const SHEET_ID = '2PACX-1vSBPWA9pJJXbng-aWyBlaNS7ItsdkOGF6WRp54BfJeIrrB1xl6UCIxYvL6hwaYs0w_2caCfnkVu4eQU';
const CSV_URLS = [
    `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?output=csv`,
    `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?gid=0&single=true&output=csv`,
    `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/export?format=csv&gid=0`
];

// Cache settings (1 minute = 60000 milliseconds)
const CACHE_DURATION = 60000;
const CACHE_KEY = 'craftsmen_data_cache';
const CACHE_TIMESTAMP_KEY = 'craftsmen_data_timestamp';

let allData = [];
let filteredData = [];
let uniqueValues = {};
let currentSort = 'default';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
const searchStats = document.getElementById('searchStats');
const filtersContainer = document.getElementById('filtersContainer');
const resultsGrid = document.getElementById('resultsGrid');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');
const noResults = document.getElementById('noResults');
const sortBtn = document.getElementById('sortBtn');
const sortDropdown = document.getElementById('sortDropdown');
const shareBtn = document.getElementById('shareBtn');
const contactUsBtn = document.getElementById('contactUsBtn');
const contactModal = document.getElementById('contactModal');
const joinModal = document.getElementById('joinModal');
const messageModal = document.getElementById('messageModal');
const joinAsCraftsmanBtn = document.getElementById('joinAsCraftsmanBtn');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const joinForm = document.getElementById('joinForm');
const messageForm = document.getElementById('messageForm');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    setupModals();
});

// Setup event listeners
function setupEventListeners() {
    searchInput.addEventListener('input', handleSearch);
    clearBtn.addEventListener('click', clearSearch);
    
    // Sort button
    if (sortBtn) {
        sortBtn.addEventListener('click', toggleSortDropdown);
    }
    
    // Sort options
    if (sortDropdown) {
        sortDropdown.querySelectorAll('.sort-option').forEach(option => {
            option.addEventListener('click', () => {
                const sortType = option.dataset.sort;
                applySort(sortType);
                sortDropdown.style.display = 'none';
            });
        });
    }
    
    // Share button
    if (shareBtn) {
        shareBtn.addEventListener('click', shareResults);
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (sortDropdown && !sortBtn.contains(e.target) && !sortDropdown.contains(e.target)) {
            sortDropdown.style.display = 'none';
        }
    });
    
    // Debounce search for better performance
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(handleSearch, 300);
    });
}

// Setup modals
function setupModals() {
    // Contact modal
    if (contactUsBtn) {
        contactUsBtn.addEventListener('click', () => {
            contactModal.style.display = 'flex';
        });
    }
    
    if (document.getElementById('closeContactModal')) {
        document.getElementById('closeContactModal').addEventListener('click', () => {
            contactModal.style.display = 'none';
        });
    }
    
    // Join as craftsman
    if (joinAsCraftsmanBtn) {
        joinAsCraftsmanBtn.addEventListener('click', () => {
            contactModal.style.display = 'none';
            joinModal.style.display = 'flex';
        });
    }
    
    if (document.getElementById('closeJoinModal')) {
        document.getElementById('closeJoinModal').addEventListener('click', () => {
            joinModal.style.display = 'none';
        });
    }
    
    // Send message
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', () => {
            contactModal.style.display = 'none';
            messageModal.style.display = 'flex';
        });
    }
    
    if (document.getElementById('closeMessageModal')) {
        document.getElementById('closeMessageModal').addEventListener('click', () => {
            messageModal.style.display = 'none';
        });
    }
    
    // Close modals when clicking outside
    [contactModal, joinModal, messageModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    });
    
    // Form submissions
    if (joinForm) {
        joinForm.addEventListener('submit', handleJoinFormSubmit);
    }
    
    if (messageForm) {
        messageForm.addEventListener('submit', handleMessageFormSubmit);
    }
}

// Check if cache is valid
function isCacheValid() {
    try {
        const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
        if (!timestamp) return false;
        
        const cacheAge = Date.now() - parseInt(timestamp);
        return cacheAge < CACHE_DURATION;
    } catch (e) {
        return false;
    }
}

// Get data from cache
function getCachedData() {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (e) {
        console.error('Error reading cache:', e);
    }
    return null;
}

// Save data to cache
function saveToCache(data) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (e) {
        console.error('Error saving cache:', e);
    }
}

// Load data from Google Sheets
async function loadData() {
    try {
        loadingIndicator.style.display = 'block';
        errorMessage.style.display = 'none';
        
        // Check cache first
        if (isCacheValid()) {
            const cachedData = getCachedData();
            if (cachedData) {
                allData = cachedData;
                extractUniqueValues();
                filteredData = allData;
                displayResults();
                createFilters();
                updateStats();
                loadingIndicator.style.display = 'none';
                console.log('Data loaded from cache');
                return;
            }
        }
        
        let csvText = null;
        let lastError = null;
        
        // Try multiple URL formats
        for (const url of CSV_URLS) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    csvText = await response.text();
                    if (csvText && csvText.trim().length > 0) {
                        break; // Success, exit loop
                    }
                }
            } catch (err) {
                lastError = err;
                continue; // Try next URL
            }
        }
        
        if (!csvText) {
            throw new Error('فشل في تحميل البيانات من Google Sheets. تأكد من أن الجدول منشور للعامة.');
        }
        
        allData = parseCSV(csvText);
        
        if (allData.length === 0) {
            throw new Error('لا توجد بيانات في الجدول');
        }
        
        // Save to cache
        saveToCache(allData);
        
        // Extract unique values for filters
        extractUniqueValues();
        
        // Display all data initially
        filteredData = allData;
        displayResults();
        createFilters();
        updateStats();
        
        loadingIndicator.style.display = 'none';
    } catch (error) {
        console.error('Error loading data:', error);
        loadingIndicator.style.display = 'none';
        errorMessage.innerHTML = `
            <strong>خطأ في تحميل البيانات</strong><br>
            ${error.message}<br>
            <small style="margin-top: 10px; display: block;">
                تأكد من أن ملف Google Sheets منشور للعامة (File → Share → Publish to web)
            </small>
        `;
        errorMessage.style.display = 'block';
    }
}

// Parse CSV text to array of objects
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    // Parse header
    const headers = parseCSVLine(lines[0]);
    
    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === 0 || values.every(v => !v.trim())) continue;
        
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        data.push(row);
    }
    
    return data;
}

// Parse a single CSV line handling quoted fields
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    
    return result;
}

// Extract unique values for filter chips
function extractUniqueValues() {
    if (allData.length === 0) return;
    
    // Get all column names
    const columns = Object.keys(allData[0]);
    
    uniqueValues = {};
    columns.forEach(column => {
        const values = new Set();
        allData.forEach(row => {
            const value = row[column];
            if (value && value.trim()) {
                values.add(value.trim());
            }
        });
        if (values.size > 0 && values.size <= 20) { // Only show filters for columns with reasonable number of unique values
            uniqueValues[column] = Array.from(values).sort();
        }
    });
}

// Create filter chips
function createFilters() {
    filtersContainer.innerHTML = '';
    
    Object.keys(uniqueValues).forEach(column => {
        const values = uniqueValues[column];
        values.forEach(value => {
            const chip = document.createElement('div');
            chip.className = 'filter-chip';
            chip.textContent = value;
            chip.dataset.column = column;
            chip.dataset.value = value;
            chip.addEventListener('click', () => toggleFilter(column, value, chip));
            filtersContainer.appendChild(chip);
        });
    });
}

// Toggle filter
function toggleFilter(column, value, chipElement) {
    chipElement.classList.toggle('active');
    handleSearch();
}

// Get active filters
function getActiveFilters() {
    const activeFilters = {};
    document.querySelectorAll('.filter-chip.active').forEach(chip => {
        const column = chip.dataset.column;
        const value = chip.dataset.value;
        if (!activeFilters[column]) {
            activeFilters[column] = [];
        }
        activeFilters[column].push(value);
    });
    return activeFilters;
}

// Handle search
function handleSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const activeFilters = getActiveFilters();
    
    // Show/hide clear button
    clearBtn.style.display = searchTerm ? 'block' : 'none';
    
    // Filter data
    filteredData = allData.filter(row => {
        // Text search - search in all fields
        let matchesSearch = true;
        if (searchTerm) {
            matchesSearch = Object.values(row).some(value => 
                value && value.toString().toLowerCase().includes(searchTerm)
            );
        }
        
        // Filter chips
        let matchesFilters = true;
        Object.keys(activeFilters).forEach(column => {
            const filterValues = activeFilters[column];
            const rowValue = row[column] ? row[column].trim() : '';
            if (!filterValues.includes(rowValue)) {
                matchesFilters = false;
            }
        });
        
        return matchesSearch && matchesFilters;
    });
    
    displayResults();
    updateStats();
}

// Clear search
function clearSearch() {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    
    // Clear active filters
    document.querySelectorAll('.filter-chip.active').forEach(chip => {
        chip.classList.remove('active');
    });
    
    filteredData = allData;
    displayResults();
    updateStats();
}

// Display results
function displayResults() {
    resultsGrid.innerHTML = '';
    
    if (filteredData.length === 0) {
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    filteredData.forEach((row, index) => {
        const card = createResultCard(row, searchTerm);
        card.style.animationDelay = `${index * 0.05}s`;
        resultsGrid.appendChild(card);
    });
}

// Create result card
function createResultCard(row, searchTerm = '') {
    const card = document.createElement('div');
    card.className = 'result-card';
    
    // Get first column as title (usually name)
    const columns = Object.keys(row);
    const titleColumn = columns[0];
    const title = row[titleColumn] || 'بدون عنوان';
    
    // Highlight search term in title
    const highlightedTitle = highlightText(title, searchTerm);
    
    // Find phone and whatsapp numbers
    const phone = findFieldValue(row, ['هاتف', 'تلفون', 'phone', 'رقم الهاتف']);
    const whatsapp = findFieldValue(row, ['واتساب', 'whatsapp', 'رقم الواتساب']);
    
    // Create contact buttons
    let contactButtons = '';
    if (whatsapp) {
        const whatsappNumber = cleanPhoneNumber(whatsapp);
        contactButtons += `<a href="https://wa.me/${whatsappNumber}" target="_blank" class="contact-btn whatsapp">
            <i class="fab fa-whatsapp"></i> واتساب
        </a>`;
    }
    if (phone) {
        const phoneNumber = cleanPhoneNumber(phone);
        contactButtons += `<a href="tel:${phoneNumber}" class="contact-btn phone">
            <i class="fas fa-phone"></i> اتصال
        </a>`;
    }
    
    card.innerHTML = `
        <div class="card-header">
            <div class="card-icon">
                <i class="fas fa-user-tie"></i>
            </div>
            <div class="card-title">${highlightedTitle}</div>
        </div>
        <div class="card-content">
            ${createCardFields(row, searchTerm)}
        </div>
        ${contactButtons ? `<div class="card-actions">${contactButtons}</div>` : ''}
    `;
    
    return card;
}

// Find field value by multiple possible column names
function findFieldValue(row, possibleNames) {
    const columns = Object.keys(row);
    for (const name of possibleNames) {
        const found = columns.find(col => col.toLowerCase().includes(name.toLowerCase()));
        if (found && row[found] && row[found].trim()) {
            return row[found].trim();
        }
    }
    return null;
}

// Clean phone number (remove spaces, dashes, etc.)
function cleanPhoneNumber(phone) {
    return phone.replace(/[\s\-\(\)\+]/g, '');
}

// Create card fields
function createCardFields(row, searchTerm) {
    const columns = Object.keys(row);
    let html = '';
    
    // Skip first column (title) and show others
    columns.slice(1).forEach(column => {
        const value = row[column];
        if (value && value.trim()) {
            const icon = getIconForColumn(column);
            const highlightedValue = highlightText(value, searchTerm);
            html += `
                <div class="card-field">
                    <i class="${icon}"></i>
                    <span class="card-field-label">${column}:</span>
                    <span class="card-field-value">${highlightedValue}</span>
                </div>
            `;
        }
    });
    
    return html || '<p style="color: var(--text-secondary);">لا توجد معلومات إضافية</p>';
}

// Get icon for column
function getIconForColumn(column) {
    const columnLower = column.toLowerCase();
    
    if (columnLower.includes('هاتف') || columnLower.includes('تلفون') || columnLower.includes('phone')) {
        return 'fas fa-phone';
    } else if (columnLower.includes('عنوان') || columnLower.includes('موقع') || columnLower.includes('address') || columnLower.includes('location')) {
        return 'fas fa-map-marker-alt';
    } else if (columnLower.includes('بريد') || columnLower.includes('email')) {
        return 'fas fa-envelope';
    } else if (columnLower.includes('مهنة') || columnLower.includes('تخصص') || columnLower.includes('profession')) {
        return 'fas fa-briefcase';
    } else if (columnLower.includes('خدمة') || columnLower.includes('service')) {
        return 'fas fa-tools';
    } else {
        return 'fas fa-info-circle';
    }
}

// Highlight search term in text
function highlightText(text, searchTerm) {
    if (!searchTerm) return escapeHtml(text);
    
    const escapedText = escapeHtml(text);
    const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
    return escapedText.replace(regex, '<span class="highlight">$1</span>');
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Escape regex special characters
function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Update search stats
function updateStats() {
    const total = allData.length;
    const showing = filteredData.length;
    
    if (showing === total) {
        searchStats.textContent = `إجمالي النتائج: ${total}`;
    } else {
        searchStats.textContent = `عرض ${showing} من ${total} نتيجة`;
    }
}

// Toggle sort dropdown
function toggleSortDropdown() {
    if (sortDropdown) {
        const isVisible = sortDropdown.style.display === 'block';
        sortDropdown.style.display = isVisible ? 'none' : 'block';
    }
}

// Apply sort
function applySort(sortType) {
    currentSort = sortType;
    
    if (sortType === 'default') {
        filteredData = [...allData];
    } else {
        const columns = Object.keys(allData[0]);
        const titleColumn = columns[0];
        
        filteredData = [...filteredData].sort((a, b) => {
            const aValue = (a[titleColumn] || '').toString();
            const bValue = (b[titleColumn] || '').toString();
            
            if (sortType === 'name-asc') {
                return aValue.localeCompare(bValue, 'ar');
            } else if (sortType === 'name-desc') {
                return bValue.localeCompare(aValue, 'ar');
            }
            return 0;
        });
    }
    
    displayResults();
    updateStats();
}

// Share results
function shareResults() {
    const searchTerm = searchInput.value.trim();
    const resultCount = filteredData.length;
    const totalCount = allData.length;
    
    let shareText = `🔍 نتائج البحث عن الحرفيين\n\n`;
    
    if (searchTerm) {
        shareText += `البحث: "${searchTerm}"\n`;
    }
    
    shareText += `عدد النتائج: ${resultCount} من ${totalCount}\n\n`;
    shareText += `رابط الموقع: ${window.location.href}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'نتائج البحث عن الحرفيين',
            text: shareText,
            url: window.location.href
        }).catch(err => {
            console.log('Error sharing:', err);
            copyToClipboard(shareText);
        });
    } else {
        copyToClipboard(shareText);
    }
}

// Copy to clipboard
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        alert('تم نسخ النتائج إلى الحافظة!');
    } catch (err) {
        console.error('Failed to copy:', err);
        prompt('انسخ النص التالي:', text);
    }
    
    document.body.removeChild(textarea);
}

// Handle join form submit
function handleJoinFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('craftsmanName').value,
        phone: document.getElementById('craftsmanPhone').value,
        profession: document.getElementById('craftsmanProfession').value,
        location: document.getElementById('craftsmanLocation').value,
        whatsapp: document.getElementById('craftsmanWhatsapp').value,
        email: document.getElementById('craftsmanEmail').value,
        description: document.getElementById('craftsmanDescription').value
    };
    
    // Here you would typically send this to a server
    // For now, we'll just show a success message
    console.log('Form data:', formData);
    
    // Create WhatsApp message
    const whatsappMessage = `مرحباً، أريد الانضمام كحرفي:\n\n` +
        `الاسم: ${formData.name}\n` +
        `الهاتف: ${formData.phone}\n` +
        `المهنة: ${formData.profession}\n` +
        `الموقع: ${formData.location}\n` +
        (formData.whatsapp ? `الواتساب: ${formData.whatsapp}\n` : '') +
        (formData.email ? `البريد: ${formData.email}\n` : '') +
        (formData.description ? `الوصف: ${formData.description}` : '');
    
    // You can replace this with your WhatsApp number
    const adminWhatsapp = '201234567890'; // Replace with actual admin WhatsApp number
    const whatsappUrl = `https://wa.me/${adminWhatsapp}?text=${encodeURIComponent(whatsappMessage)}`;
    
    window.open(whatsappUrl, '_blank');
    
    alert('شكراً لك! سيتم التواصل معك قريباً.');
    joinForm.reset();
    joinModal.style.display = 'none';
}

// Handle message form submit
function handleMessageFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('senderName').value,
        phone: document.getElementById('senderPhone').value,
        email: document.getElementById('senderEmail').value,
        message: document.getElementById('messageText').value
    };
    
    // Here you would typically send this to a server
    // For now, we'll just show a success message
    console.log('Message data:', formData);
    
    // Create WhatsApp message
    const whatsappMessage = `رسالة جديدة:\n\n` +
        `الاسم: ${formData.name}\n` +
        `رقم التلفون: ${formData.phone}\n` +
        (formData.email ? `البريد الإلكتروني: ${formData.email}\n\n` : '\n') +
        `الرسالة:\n${formData.message}`;
    
    // You can replace this with your WhatsApp number
    const adminWhatsapp = '201234567890'; // Replace with actual admin WhatsApp number
    const whatsappUrl = `https://wa.me/${adminWhatsapp}?text=${encodeURIComponent(whatsappMessage)}`;
    
    window.open(whatsappUrl, '_blank');
    
    alert('شكراً لك! تم إرسال رسالتك.');
    messageForm.reset();
    messageModal.style.display = 'none';
}

