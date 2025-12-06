// popup.js - Handle popup interactions
document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements for domains
  const domainInput = document.getElementById('domain-input');
  const addDomainButton = document.getElementById('add-domain');
  const domainList = document.getElementById('domain-list');
  
  // Get DOM elements for keywords
  const keywordInput = document.getElementById('keyword-input');
  const addKeywordButton = document.getElementById('add-keyword');
  const keywordList = document.getElementById('keyword-list');
  
  // Get DOM elements for description keywords
  const descKeywordInput = document.getElementById('desc-keyword-input');
  const addDescKeywordButton = document.getElementById('add-desc-keyword');
  const descKeywordList = document.getElementById('desc-keyword-list');

  // Load domains, keywords and description keywords from storage and display them
  loadDomains();
  loadKeywords();
  loadDescKeywords();

  // Add domain button click event
  addDomainButton.addEventListener('click', addDomain);

  // Add domain when Enter key is pressed in the input field
  domainInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addDomain();
    }
  });

  // Add keyword button click event
  addKeywordButton.addEventListener('click', addKeyword);

  // Add keyword when Enter key is pressed in the input field
  keywordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addKeyword();
    }
  });
  
  // Add description keyword button click event
  addDescKeywordButton.addEventListener('click', addDescKeyword);

  // Add description keyword when Enter key is pressed in the input field
  descKeywordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addDescKeyword();
    }
  });

  // Load domains from chrome storage
  function loadDomains() {
    chrome.storage.sync.get(['blockedDomains'], function(result) {
      const domains = result.blockedDomains || [];
      displayDomains(domains);
    });
  }

  // Display domains in the UI
  function displayDomains(domains) {
    domainList.innerHTML = '';
    domains.forEach(domain => {
      const li = document.createElement('li');
      li.className = 'domain-item';
      
      const span = document.createElement('span');
      span.className = 'domain-text';
      span.textContent = domain;
      
      const removeButton = document.createElement('button');
      removeButton.className = 'remove-domain';
      removeButton.textContent = 'Remove';
      removeButton.addEventListener('click', function() {
        removeDomain(domain);
      });
      
      li.appendChild(span);
      li.appendChild(removeButton);
      domainList.appendChild(li);
    });
  }

  // Add a new domain
  function addDomain() {
    const domain = domainInput.value.trim().toLowerCase();
    if (!domain) return;

    // Validate domain format (simple validation)
    if (!isValidDomain(domain)) {
      alert('Please enter a valid domain (e.g., csdn.net)');
      return;
    }

    chrome.storage.sync.get(['blockedDomains'], function(result) {
      const domains = result.blockedDomains || [];
      // Check if domain already exists
      if (domains.includes(domain)) {
        alert('Domain already exists in the list');
        return;
      }
      
      // Add new domain
      domains.push(domain);
      chrome.storage.sync.set({blockedDomains: domains}, function() {
        displayDomains(domains);
        domainInput.value = ''; // Clear input
      });
    });
  }

  // Remove a domain
  function removeDomain(domainToRemove) {
    chrome.storage.sync.get(['blockedDomains'], function(result) {
      const domains = result.blockedDomains || [];
      const updatedDomains = domains.filter(domain => domain !== domainToRemove);
      chrome.storage.sync.set({blockedDomains: updatedDomains}, function() {
        displayDomains(updatedDomains);
      });
    });
  }

  // Simple domain validation
  function isValidDomain(domain) {
    // Basic validation - check if it contains at least one dot and doesn't contain invalid characters
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z0-9]+([\-\.]{1}[a-zA-Z0-9]+)*$/;
    return domainRegex.test(domain);
  }

  // Load keywords from chrome storage
  function loadKeywords() {
    chrome.storage.sync.get(['blockedKeywords'], function(result) {
      const keywords = result.blockedKeywords || [];
      displayKeywords(keywords);
    });
  }

  // Display keywords in the UI
  function displayKeywords(keywords) {
    keywordList.innerHTML = '';
    keywords.forEach(keyword => {
      const li = document.createElement('li');
      li.className = 'keyword-item';
      
      const span = document.createElement('span');
      span.className = 'keyword-text';
      span.textContent = keyword;
      
      const removeButton = document.createElement('button');
      removeButton.className = 'remove-keyword';
      removeButton.textContent = 'Remove';
      removeButton.addEventListener('click', function() {
        removeKeyword(keyword);
      });
      
      li.appendChild(span);
      li.appendChild(removeButton);
      keywordList.appendChild(li);
    });
  }

  // Add a new keyword
  function addKeyword() {
    const keyword = keywordInput.value.trim();
    if (!keyword) return;

    chrome.storage.sync.get(['blockedKeywords'], function(result) {
      const keywords = result.blockedKeywords || [];
      // Check if keyword already exists
      if (keywords.includes(keyword)) {
        alert('Keyword already exists in the list');
        return;
      }
      
      // Add new keyword
      keywords.push(keyword);
      chrome.storage.sync.set({blockedKeywords: keywords}, function() {
        displayKeywords(keywords);
        keywordInput.value = ''; // Clear input
      });
    });
  }

  // Remove a keyword
  function removeKeyword(keywordToRemove) {
    chrome.storage.sync.get(['blockedKeywords'], function(result) {
      const keywords = result.blockedKeywords || [];
      const updatedKeywords = keywords.filter(keyword => keyword !== keywordToRemove);
      chrome.storage.sync.set({blockedKeywords: updatedKeywords}, function() {
        displayKeywords(updatedKeywords);
      });
    });
  }
  
  // Load description keywords from chrome storage
  function loadDescKeywords() {
    chrome.storage.sync.get(['blockedDescKeywords'], function(result) {
      const descKeywords = result.blockedDescKeywords || [];
      displayDescKeywords(descKeywords);
    });
  }

  // Display description keywords in the UI
  function displayDescKeywords(descKeywords) {
    descKeywordList.innerHTML = '';
    descKeywords.forEach(keyword => {
      const li = document.createElement('li');
      li.className = 'desc-keyword-item';
      
      const span = document.createElement('span');
      span.className = 'desc-keyword-text';
      span.textContent = keyword;
      
      const removeButton = document.createElement('button');
      removeButton.className = 'remove-desc-keyword';
      removeButton.textContent = 'Remove';
      removeButton.addEventListener('click', function() {
        removeDescKeyword(keyword);
      });
      
      li.appendChild(span);
      li.appendChild(removeButton);
      descKeywordList.appendChild(li);
    });
  }

  // Add a new description keyword
  function addDescKeyword() {
    const keyword = descKeywordInput.value.trim();
    if (!keyword) return;

    chrome.storage.sync.get(['blockedDescKeywords'], function(result) {
      const descKeywords = result.blockedDescKeywords || [];
      // Check if keyword already exists
      if (descKeywords.includes(keyword)) {
        alert('Description keyword already exists in the list');
        return;
      }
      
      // Add new description keyword
      descKeywords.push(keyword);
      chrome.storage.sync.set({blockedDescKeywords: descKeywords}, function() {
        displayDescKeywords(descKeywords);
        descKeywordInput.value = ''; // Clear input
      });
    });
  }

  // Remove a description keyword
  function removeDescKeyword(keywordToRemove) {
    chrome.storage.sync.get(['blockedDescKeywords'], function(result) {
      const descKeywords = result.blockedDescKeywords || [];
      const updatedDescKeywords = descKeywords.filter(keyword => keyword !== keywordToRemove);
      chrome.storage.sync.set({blockedDescKeywords: updatedDescKeywords}, function() {
        displayDescKeywords(updatedDescKeywords);
      });
    });
  }
});