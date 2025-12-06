// popup.js - Handle popup interactions
document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const domainInput = document.getElementById('domain-input');
  const addDomainButton = document.getElementById('add-domain');
  const domainList = document.getElementById('domain-list');

  // Load domains from storage and display them
  loadDomains();

  // Add domain button click event
  addDomainButton.addEventListener('click', addDomain);

  // Add domain when Enter key is pressed in the input field
  domainInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addDomain();
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
});