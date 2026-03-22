const input = document.getElementById('filter-input');
const isRegexCheckbox = document.getElementById('is-regex');
const addBtn = document.getElementById('add-btn');
const filterList = document.getElementById('filter-list');

let filters = [];

function saveAndBroadcast() {
  chrome.storage.sync.set({ filters });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'UPDATE_FILTERS', filters });
    }
  });
}

function render() {
  filterList.innerHTML = '';
  filters.forEach((filter, i) => {
    const li = document.createElement('li');

    const label = document.createElement('span');
    label.className = 'filter-label';
    label.textContent = filter.value;

    if (filter.isRegex) {
      const badge = document.createElement('span');
      badge.className = 'filter-badge';
      badge.textContent = 'regex';
      label.appendChild(badge);
    }

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      filters.splice(i, 1);
      saveAndBroadcast();
      render();
    });

    li.appendChild(label);
    li.appendChild(removeBtn);
    filterList.appendChild(li);
  });
}

addBtn.addEventListener('click', () => {
  const value = input.value.trim();
  if (!value) return;
  filters.push({ value, isRegex: isRegexCheckbox.checked });
  input.value = '';
  isRegexCheckbox.checked = false;
  saveAndBroadcast();
  render();
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addBtn.click();
});

// Load saved filters on open
chrome.storage.sync.get(['filters'], (result) => {
  filters = result.filters || [];
  render();
});
