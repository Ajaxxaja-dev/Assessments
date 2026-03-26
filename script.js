const icons = {
    Equipment: "🪢",
    Snacks: "🍽️",
    Community: "🤝",
    Transport: "🚲",
    Dues: "💰",
    Other: "📝",
    General: "📊"
};
// Login Security Logic
function checkLogin() {
    const userField = document.getElementById('login-user').value;
    const passField = document.getElementById('login-pass').value;
    const errorMsg = document.getElementById('login-error');

    // Hardcoded credentials as requested
    if (userField === 'byctreasurer' && passField === 'aurora_2026') {
        document.getElementById('login-screen').style.display = 'none';
        sessionStorage.setItem('isLoggedIn', 'true');
    } else {
        errorMsg.style.display = 'block';
    }
}

// Auto-unlock if already logged in during this session
window.addEventListener('load', () => {
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        document.getElementById('login-screen').style.display = 'none';
    }
});
// 1. Setup Data and Variables
let transactions = JSON.parse(localStorage.getItem('my_budget_logs')) || [];
let currentType = 'deposit';
let editingId = null;

// 2. Open Modal (For New or Edit)
function openModal(type, id = null) {
    currentType = type;
    editingId = id;
    document.getElementById('input-modal').style.display = 'flex';
    
    if (id) {
        const item = transactions.find(t => t.id === id);
        document.getElementById('modal-title').innerText = "Edit Activity";
        document.getElementById('input-amount').value = item.amount;
        document.getElementById('input-desc').value = item.description;
        document.getElementById('input-category').value = item.category || "Other";
    } else {
        document.getElementById('modal-title').innerText = `Add ${type}`;
        document.getElementById('input-amount').value = '';
        document.getElementById('input-desc').value = '';
        document.getElementById('input-category').value = "General";
    }
}

// 3. Close Modal
function closeModal() {
    document.getElementById('input-modal').style.display = 'none';
}

// 4. Save Logic (Handles both New and Edits)
function processSubmit() {
    const amt = document.getElementById('input-amount').value;
    const desc = document.getElementById('input-desc').value;
    const category = document.getElementById('input-category').value;

    if (!amt || !desc) {
        alert("Please fill all fields");
        return;
    }

    if (editingId) {
    const index = transactions.findIndex(t => t.id === editingId);
    transactions[index].amount = parseFloat(amt);
    transactions[index].description = desc;
    transactions[index].category = category; // Add this
} else {
        // Create new item
        const newEntry = {
        id: Date.now(),
        type: currentType,
        amount: parseFloat(amt),
        description: desc,
        category: category, // Add this
        date: new Date().toLocaleDateString()
    };
    transactions.push(newEntry);
}
    
    saveAndRefresh();
    closeModal();
}

// 5. Save to Storage and Update Screen
function saveAndRefresh() {
    localStorage.setItem('my_budget_logs', JSON.stringify(transactions));
    updateUI();
}

// 6. Refresh the User Interface
function updateUI() {
    const balanceDisplay = document.getElementById('total-balance');
    const listDisplay = document.getElementById('transaction-list');
    
    // Calculate Balance
    const total = transactions.reduce((acc, item) => {
        return item.type === 'deposit' ? acc + item.amount : acc - item.amount;
    }, 0);

    balanceDisplay.innerText = `₱${total.toLocaleString()}`;

    // Clear and Redraw the List
    listDisplay.innerHTML = "";
    
    // We use slice().reverse() to show newest items at the top
    transactions.slice().reverse().forEach(item => {
        const li = document.createElement('li');
        li.className = "transaction-item";
        
        // When clicked, this list item triggers the Edit modal
        li.onclick = () => openModal(item.type, item.id);
        
        li.innerHTML = `
    <div style="display: flex; align-items: center;">
        <div class="cat-icon">${icons[item.category] || "📝"}</div>
        <div>
            <strong>${item.description}</strong><br>
            <small>${item.date} • ${item.category}</small>
        </div>
    </div>
    <span style="color: ${item.type === 'deposit' ? '#2ecc71' : '#e74c3c'}">
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

// Run immediately on load
updateUI();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker Registered!'))
            .catch(err => console.log('Service Worker Failed:', err));
    });
}
