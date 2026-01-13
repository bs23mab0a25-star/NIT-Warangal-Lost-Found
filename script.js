import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// TODO: Replace with your Supabase project configuration
// 1. Go to https://supabase.com/dashboard
// 2. Create a project -> Settings -> API -> Copy URL and Anon Key
const supabaseUrl = 'https://oeoggbtcqitbdftewdxp.supabase.co';
const supabaseKey = 'sb_publishable_tOP7aneVy0mXUWbBLVwUIw_voEE__K5';
const supabase = createClient(supabaseUrl, supabaseKey);

let items = [];

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

// Fetch items from Supabase
async function fetchItems() {
  const { data, error } = await supabase
    .from('lostfound_items')
    .select('*');

  if (error) {
    console.error('Error fetching items:', error);
    return;
  }

  items = data;
  renderItems();
}

// Listen for real-time updates
supabase
  .channel('lostfound_items')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'lostfound_items' }, () => {
    fetchItems();
  })
  .subscribe();

// Initial fetch
fetchItems();

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
    claimBtn.onclick = () => claimItem(item.id);

    // Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-btn');
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => deleteItem(item.id);

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
itemForm.addEventListener('submit', async function(e) {
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

  let imageUrl = '';

  // Upload image to Supabase Storage
  if (imageFile) {
    const fileName = `${Date.now()}_${imageFile.name.replace(/\s/g, '_')}`;
    const { data, error } = await supabase.storage
      .from('shashi')
      .upload(fileName, imageFile);

    if (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('shashi')
      .getPublicUrl(fileName);
    
    imageUrl = publicUrlData.publicUrl;
  }

  await saveItem(imageUrl);

  async function saveItem(imageUrl) {
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
      image: imageUrl,
      claimedBy: []
    };
    
    try {
      const { error } = await supabase
        .from('lostfound_items')
        .insert([newItem]);

      if (error) throw error;

      alert('Item submitted successfully!');
      itemForm.reset();
    } catch (e) {
      console.error("Error adding document: ", e);
      alert("Error submitting item. See console for details.");
    }
  }
});

// Filter event listeners
searchName.addEventListener('input', renderItems);
filterCategory.addEventListener('change', renderItems);
filterType.addEventListener('change', renderItems);

// Claim item
async function claimItem(itemId) {
  const item = items.find(i => i.id === itemId);
  const claimerName = prompt('Enter your name to claim this item:');
  const claimerRoll = prompt('Enter your roll number:');
  const claimerContact = prompt('Enter your contact number:');
  if (claimerName && claimerRoll && claimerContact) {
    const claimInfo = `Name: ${claimerName}, Roll: ${claimerRoll}, Contact: ${claimerContact}`;
    if (!item.claimedBy.some(claim => claim.includes(claimerRoll))) {
      const { error } = await supabase
        .from('lostfound_items')
        .update({ claimedBy: [...item.claimedBy, claimInfo] })
        .eq('id', itemId);

      if (error) alert('Error claiming item');
    } else {
      alert('This roll number has already claimed this item.');
    }
  }
}

// Delete item (only original poster can delete)
async function deleteItem(itemId) {
  const item = items.find(i => i.id === itemId);
  let enteredValue;
  let fieldName;
  if (item.deletePassword) {
    enteredValue = prompt('Enter your delete password to confirm deletion:');
    fieldName = 'delete password';
  } else {
    enteredValue = prompt('Enter your roll number to confirm deletion:');
    fieldName = 'roll number';
  }
  const isValid = enteredValue && (item.deletePassword ? enteredValue === item.deletePassword : enteredValue === item.rollNumber);
  if (isValid) {
    const confirmDelete = confirm('Are you sure you want to delete this item? Only delete if it is claimed appropriately.');
    if (confirmDelete) {
      const { error } = await supabase
        .from('lostfound_items')
        .delete()
        .eq('id', itemId);

      if (error) alert('Error deleting item');
    }
  } else {
    alert(`Incorrect ${fieldName}. Only the original poster can delete this item.`);
  }
}

// Initial render
// renderItems(); // Removed because onSnapshot handles the initial render
