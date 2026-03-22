// Kick Chat Filter - Content Script
// Runs on kick.com pages and filters chat messages

let filters = [];

// Load filters from storage
chrome.storage.sync.get(['filters'], (result) => {
  filters = result.filters || [];
});

// Listen for filter updates from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_FILTERS') {
    filters = message.filters;
    sendResponse({ ok: true });
  }
});

function shouldHide(el) {
  const text = el.textContent || '';
  const emoteNames = [...el.querySelectorAll('[data-emote-name]')].map(
    (e) => e.dataset.emoteName
  );

  return filters.some((filter) => {
    if (filter.isRegex) {
      try {
        const re = new RegExp(filter.value, 'i');
        return re.test(text) || emoteNames.some((name) => re.test(name));
      } catch {
        return false;
      }
    }
    const val = filter.value.toLowerCase();
    return (
      text.toLowerCase().includes(val) ||
      emoteNames.some((name) => name.toLowerCase() === val)
    );
  });
}

function filterElement(el) {
  if (el.nodeType !== Node.ELEMENT_NODE) return;
  el.style.display = shouldHide(el) ? 'none' : '';
}

function applyFilters() {
  const chatContainer = document.querySelector('.no-scrollbar.relative');
  if (!chatContainer) return;
  chatContainer.querySelectorAll(':scope > div').forEach(filterElement);
}

// Only process newly added nodes, not all messages on every mutation
const observer = new MutationObserver((records) => {
  for (const record of records) {
    record.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) filterElement(node);
    });
  }
});

function startObserving() {
  const chatContainer = document.querySelector('.no-scrollbar.relative');
  if (chatContainer) {
    observer.observe(chatContainer, { childList: true });
    applyFilters();
  } else {
    setTimeout(startObserving, 1000);
  }
}

startObserving();
