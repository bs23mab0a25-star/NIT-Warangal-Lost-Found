// Initialize items from localStorage or empty array
let items = JSON.parse(localStorage.getItem('lostFoundItems')) || [];

const itemForm = document.getElementById('itemForm');
const itemsContainer = document.getElementById('itemsContainer');
const searchName = document.getElementById('searchName');
const filterCategory = document.getElementById('filterCategory');
const filterType = document.getElementById('filterType');

// Get filtered items
function getFilteredItems() {
  const nameQuery = searchName.value.toLowerCase();
  const categoryQuery = filterCategory.value;
  const typeQuery = filterType.value;

  return items.filter(item => {
    const matchesName = item.itemName.toLowerCase().includes(nameQuery);
    const matchesCategory = !categoryQuery || item.category === categoryQuery;
    const matchesType = !typeQuery || item.statusType === typeQuery;
    return matchesName && matchesCategory && matchesType;
  });
}

// Update category options
function updateCategoryOptions() {
  const categories = [...new Set(items.map(item => item.category))];
  filterCategory.innerHTML = '<option value="">All Categories</option>';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    filterCategory.appendChild(option);
  });
}

// Render items
function renderItems() {
  console.log('Rendering items, total items:', items.length);
  updateCategoryOptions();
  const filteredItems = getFilteredItems();
  console.log('Filtered items:', filteredItems.length);
  itemsContainer.innerHTML = '';

  filteredItems.forEach((item, index) => {
    const card = document.createElement('div');
    card.classList.add('item-card');

    const img = document.createElement('img');
    img.src = item.image || 'https://via.placeholder.com/150';
    img.alt = item.itemName;

    const details = document.createElement('div');
    details.classList.add('item-details');
    details.innerHTML = `
      <p><strong>Name:</strong> ${item.itemName}</p>
      <p><strong>Category:</strong> ${item.category}</p>
      <p><strong>Location:</strong> ${item.location}</p>
      <p><strong>Roll Number:</strong> ${item.rollNumber}</p>
      <p><strong>Contact:</strong> ${item.contactInfo}</p>
      <p><strong>Type:</strong> ${item.statusType}</p>
      <p><strong>Date:</strong> ${item.date}</p>
      <p class="claim-list"><strong>Claimed By:</strong> ${item.claimedBy.length ? item.claimedBy.join('<br>') : 'None'}</p>
    `;

    // Claim Button
    const claimBtn = document.createElement('button');
    claimBtn.classList.add('claim-btn');
    claimBtn.textContent = 'Claim Item';
    claimBtn.onclick = () => claimItem(index);

    // Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-btn');
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => deleteItem(index);

    card.appendChild(img);
    card.appendChild(details);
    card.appendChild(claimBtn);
    card.appendChild(deleteBtn);

    card.title = `Item: ${item.itemName}\nCategory: ${item.category}\nLocation: ${item.location}\nDate: ${item.date}\nContact: ${item.contactInfo}`;

    card.style.animationDelay = `${index * 0.1}s`;

    itemsContainer.appendChild(card);
  });
}

// Add new item
itemForm.addEventListener('submit', function(e) {
  e.preventDefault();

  const itemName = document.getElementById('itemName').value;
  const category = document.getElementById('category').value;
  const location = document.getElementById('location').value;
  const rollNumber = document.getElementById('rollNumber').value;
  const contactInfo = document.getElementById('contactInfo').value;
  const statusType = document.getElementById('statusType').value;
  const date = document.getElementById('date').value;
  const deletePassword = document.getElementById('deletePassword').value;
  const imageFile = document.getElementById('imageUpload').files[0];

  // Read image as Base64
  if (imageFile) {
    const reader = new FileReader();
    reader.onload = function() {
      saveItem(reader.result);
    };
    reader.readAsDataURL(imageFile);
  } else {
    saveItem('');
  }

  function saveItem(imageData) {
    console.log('Saving item:', itemName, category, statusType);
    const newItem = {
      itemName,
      category,
      location,
      rollNumber,
      contactInfo,
      statusType,
      date,
      deletePassword,
      image: imageData,
      claimedBy: []
    };
    items.push(newItem);
    localStorage.setItem('lostFoundItems', JSON.stringify(items));
    console.log('Items after save:', items);
    alert('Item submitted successfully!');
    renderItems();
    itemForm.reset();
  }
});

// Filter event listeners
searchName.addEventListener('input', renderItems);
filterCategory.addEventListener('change', renderItems);
filterType.addEventListener('change', renderItems);

// Claim item
function claimItem(index) {
  const claimerName = prompt('Enter your name to claim this item:');
  const claimerRoll = prompt('Enter your roll number:');
  const claimerContact = prompt('Enter your contact number:');
  if (claimerName && claimerRoll && claimerContact) {
    const claimInfo = `Name: ${claimerName}, Roll: ${claimerRoll}, Contact: ${claimerContact}`;
    if (!items[index].claimedBy.some(claim => claim.includes(claimerRoll))) {
      items[index].claimedBy.push(claimInfo);
      localStorage.setItem('lostFoundItems', JSON.stringify(items));
      renderItems();
    } else {
      alert('This roll number has already claimed this item.');
    }
  }
}

// Delete item (only original poster can delete)
function deleteItem(index) {
  let enteredValue;
  let fieldName;
  if (items[index].deletePassword) {
    enteredValue = prompt('Enter your delete password to confirm deletion:');
    fieldName = 'delete password';
  } else {
    enteredValue = prompt('Enter your roll number to confirm deletion:');
    fieldName = 'roll number';
  }
  const isValid = enteredValue && (items[index].deletePassword ? enteredValue === items[index].deletePassword : enteredValue === items[index].rollNumber);
  if (isValid) {
    const confirmDelete = confirm('Are you sure you want to delete this item? Only delete if it is claimed appropriately.');
    if (confirmDelete) {
      items.splice(index, 1);
      localStorage.setItem('lostFoundItems', JSON.stringify(items));
      renderItems();
    }
  } else {
    alert(`Incorrect ${fieldName}. Only the original poster can delete this item.`);
  }
}

// Initial render
renderItems();
