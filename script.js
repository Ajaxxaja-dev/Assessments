// 1. Setup Icons (Matching the 'value' in your HTML <select>)
const icons = {
    Equipment: "🪢",
    Snacks: "🍽️",
    Community: "🤝",
    Transport: "🚲",
    Other: "📝",
    General: "📊"
};

// 2. Setup Data and Variables
let transactions = JSON.parse(localStorage.getItem('my_budget_logs')) || [];
let currentType = 'deposit';
let editingId = null;

// 3. Login Security Logic
function checkLogin() {
    const userField = document.getElementById('login-user').value;
    const passField = document.getElementById('login-pass').value;
    const errorMsg = document.getElementById('login-error');

    if (userField === 'byctreasurer' && passField === 'aurora_2026') {
        document.getElementById('login-screen').style.display = 'none';
        sessionStorage.setItem('isLoggedIn', 'true');
    } else {
        errorMsg.style.display = 'block';
    }
}

// 4. Modal Logic (Open/Close)
function openModal(type, id = null) {
    currentType = type;
    editingId = id;
    
    const modal = document.getElementById('input-modal');
    const catField = document.getElementById('input-category');
    
    modal.style.display = 'flex';
    
    // Logic to hide category for Deposits
    if (type === 'deposit') {
        catField.classList.add('hidden'); 
        catField.value = "General"; // Default to General for deposits
    } else {
        catField.classList.remove('hidden');
    }

    if (id) {
        const item = transactions.find(t => t.id === id);
        document.getElementById('modal-title').innerText = "Edit Activity";
        document.getElementById('input-amount').value = item.amount;
        document.getElementById('input-desc').value = item.description;
        catField.value = item.category || "General";
    } else {
        document.getElementById('modal-title').innerText = `Add ${type.toUpperCase()}`;
        document.getElementById('input-amount').value = '';
        document.getElementById('input-desc').value = '';
    }
}

function closeModal() {
    document.getElementById('input-modal').style.display = 'none';
}

// 5. Save Logic
function processSubmit() {
    const amt = document.getElementById('input-amount').value;
    const desc = document.getElementById('input-desc').value;
    const category = (currentType === 'deposit') ? "General" : document.getElementById('input-category').value;

    if (!amt || !desc) {
        alert("Please fill all fields");
        return;
    }

    if (editingId) {
        const index = transactions.findIndex(t => t.id === editingId);
        transactions[index].amount = parseFloat(amt);
        transactions[index].description = desc;
        transactions[index].category = category;
    } else {
        const newEntry = {
            id: Date.now(),
            type: currentType,
            amount: parseFloat(amt),
            description: desc,
            category: category,
            date: new Date().toLocaleDateString()
        };
        transactions.push(newEntry);
    }
    
    saveAndRefresh();
    closeModal();
}

function saveAndRefresh() {
    localStorage.setItem('my_budget_logs', JSON.stringify(transactions));
    updateUI();
}

// 6. Refresh the User Interface
function updateUI() {
    const balanceDisplay = document.getElementById('total-balance');
    const listDisplay = document.getElementById('transaction-list');
    
    if (!balanceDisplay || !listDisplay) return;

    const total = transactions.reduce((acc, item) => {
        return item.type === 'deposit' ? acc + item.amount : acc - item.amount;
    }, 0);

    balanceDisplay.innerText = `₱${total.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    listDisplay.innerHTML = "";
    
    transactions.slice().reverse().forEach(item => {
        const li = document.createElement('li');
        li.className = "transaction-item";
        li.onclick = () => openModal(item.type, item.id);
        
        li.innerHTML = `
            <div style="display: flex; align-items: center;">
                <div class="cat-icon" style="margin-right: 12px; font-size: 1.5rem;">
                    ${icons[item.category] || "📝"}
                </div>
                <div>
                    <strong>${item.description}</strong><br>
                    <small>${item.date} • ${item.category}</small>
                </div>
            </div>
            <span style="color: ${item.type === 'deposit' ? '#2ecc71' : '#e74c3c'}; font-weight: bold;">
                ${item.type === 'deposit' ? '+' : '-'} ₱${item.amount.toLocaleString()}
            </span>
        `;
        listDisplay.appendChild(li);
    });
}

// 7. Reset Function
function confirmReset() {
    if (confirm("Are you sure? This will delete all history.")) {
        transactions = [];
        saveAndRefresh();
    }
}

// 8. App Initialization & Service Worker
window.addEventListener('load', () => {
    // Check login status
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) loginScreen.style.display = 'none';
    }

    // Draw UI
    updateUI();

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker Registered!'))
            .catch(err => console.log('Service Worker Failed:', err));
    }
});

function exportToCSV() {
    if (transactions.length === 0) {
        alert("No data to export yet!");
        return;
    }

    // 1. Create the Header Row
    let csvContent = "Date,Description,Category,Type,Amount\n";

    // 2. Add the Data Rows
    transactions.forEach(item => {
        const row = [
            item.date,
            `"${item.description}"`, // Quotes handle commas in descriptions
            item.category || "General",
            item.type.toUpperCase(),
            item.amount
        ].join(",");
        csvContent += row + "\n";
    });

    // 3. Create a Downloadable Blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // 4. Trigger the Download
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    // Naming the file with the current date
    const fileName = `BYC_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`;
    link.setAttribute("download", fileName);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
