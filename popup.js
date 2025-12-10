// popup.js - Handle popup interactions

document.addEventListener('DOMContentLoaded', function() {
  // Password protection elements
  const setPasswordContainer = document.getElementById('set-password-container');
  const unlockContainer = document.getElementById('unlock-container');
  const passwordEnabledContainer = document.getElementById('password-enabled-container');
  const passwordInput = document.getElementById('password-input');
  const confirmPasswordInput = document.getElementById('confirm-password-input');
  const setPasswordButton = document.getElementById('set-password');
  const unlockPasswordInput = document.getElementById('unlock-password-input');
  const unlockSettingsButton = document.getElementById('unlock-settings');
  const disablePasswordButton = document.getElementById('disable-password');
  
  // Main content element
  const mainContent = document.getElementById('main-content');
  const passwordSection = document.getElementById('password-section');
  
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
  
  // Get DOM elements for import/export
  const exportConfigButton = document.getElementById('export-config');
  const importConfigButton = document.getElementById('import-config');
  const importFileInput = document.getElementById('import-file');
  
  // Get DOM element for extension toggle
  const extensionToggle = document.getElementById('extension-toggle');

  // Check if password protection is enabled
  checkPasswordProtection();

  // Password protection functions
  function checkPasswordProtection() {
    chrome.storage.sync.get(['passwordProtectionEnabled', 'passwordHash'], function(result) {
      console.log("Checking password protection:", result);
      if (result.passwordProtectionEnabled && result.passwordHash) {
        // Password is set, show unlock screen
        console.log("Password is set, showing unlock screen");
        setPasswordContainer.style.display = 'none';
        passwordEnabledContainer.style.display = 'block';
        unlockContainer.style.display = 'block';
        mainContent.style.display = 'none';
      } else if (result.passwordProtectionEnabled && !result.passwordHash) {
        // Password protection enabled but no password set
        console.log("Password protection enabled but no password set");
        setPasswordContainer.style.display = 'block';
        passwordEnabledContainer.style.display = 'block';
        unlockContainer.style.display = 'none';
        mainContent.style.display = 'none';
      } else {
        // No password protection
        console.log("No password protection, showing main content");
        setPasswordContainer.style.display = 'block';
        passwordEnabledContainer.style.display = 'none';
        unlockContainer.style.display = 'none';
        mainContent.style.display = 'block';
        
        // Load domains, keywords and description keywords from storage and display them
        loadDomains();
        loadKeywords();
        loadDescKeywords();
        loadExtensionStatus();
      }
    });
  }

  // Set password button click event
  setPasswordButton.addEventListener('click', setPassword);
  
  // Unlock settings button click event
  unlockSettingsButton.addEventListener('click', unlockSettings);
  
  // Disable password button click event
  disablePasswordButton.addEventListener('click', disablePassword);
  
  // Add domain button click event
  addDomainButton.addEventListener('click', function() {
    if (isUnlocked()) {
      addDomain();
    }
  });

  // Add domain when Enter key is pressed in the input field
  domainInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && isUnlocked()) {
      addDomain();
    }
  });

  // Add keyword button click event
  addKeywordButton.addEventListener('click', function() {
    if (isUnlocked()) {
      addKeyword();
    }
  });

  // Add keyword when Enter key is pressed in the input field
  keywordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && isUnlocked()) {
      addKeyword();
    }
  });
  
  // Add description keyword button click event
  addDescKeywordButton.addEventListener('click', function() {
    if (isUnlocked()) {
      addDescKeyword();
    }
  });

  // Add description keyword when Enter key is pressed in the input field
  descKeywordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && isUnlocked()) {
      addDescKeyword();
    }
  });
  
  // Extension toggle change event
  extensionToggle.addEventListener('change', function() {
    if (isUnlocked()) {
      chrome.storage.sync.set({extensionEnabled: extensionToggle.checked});
    }
  });
  
  // Export configuration button click event
  exportConfigButton.addEventListener('click', function() {
    if (isUnlocked()) {
      exportConfiguration();
    }
  });
  
  // Import configuration button click event
  importConfigButton.addEventListener('click', function() {
    if (isUnlocked()) {
      importFileInput.click();
    }
  });
  
  // Import file change event
  importFileInput.addEventListener('change', function(event) {
    if (isUnlocked()) {
      importConfiguration(event);
    }
  });

  // Set password function
  function setPassword() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (!password) {
      alert('Please enter a password');
      return;
    }
    
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    // Hash the password before storing (simple approach for this extension)
    const passwordHash = btoa(password); // Base64 encoding (not secure but sufficient for local storage)
    
    chrome.storage.sync.set({
      passwordProtectionEnabled: true,
      passwordHash: passwordHash
    }, function() {
      passwordInput.value = '';
      confirmPasswordInput.value = '';
      console.log('Password set successfully'); // Debug log
      checkPasswordProtection();
      alert('Password protection enabled!');
    });
  }

  // Unlock settings function
  function unlockSettings() {
    const password = unlockPasswordInput.value;
    
    if (!password) {
      alert('Please enter your password');
      return;
    }
    
    chrome.storage.sync.get(['passwordHash'], function(result) {
      console.log('Checking password:', result); // Debug log
      if (result.passwordHash) {
        const enteredHash = btoa(password);
        if (enteredHash === result.passwordHash) {
          // Correct password
          console.log('Correct password entered'); // Debug log
          unlockContainer.style.display = 'none';
          mainContent.style.display = 'block';
          unlockPasswordInput.value = '';
          
          // Load domains, keywords and description keywords from storage and display them
          loadDomains();
          loadKeywords();
          loadDescKeywords();
          loadExtensionStatus();
        } else {
          alert('Incorrect password');
        }
      }
    });
  }

  // Disable password function
  function disablePassword() {
    chrome.storage.sync.remove(['passwordProtectionEnabled', 'passwordHash'], function() {
      console.log('Password protection disabled'); // Debug log
      checkPasswordProtection();
      alert('Password protection disabled!');
    });
  }

  // Check if settings are unlocked
  function isUnlocked() {
    return mainContent.style.display === 'block';
  }

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
  
  // Load extension status from storage
  function loadExtensionStatus() {
    chrome.storage.sync.get(['extensionEnabled'], function(result) {
      // Default to enabled if not set
      extensionToggle.checked = result.extensionEnabled !== false;
    });
  }
  
  // Export configuration to a JSON file
  function exportConfiguration() {
    chrome.storage.sync.get(['blockedDomains', 'blockedKeywords', 'blockedDescKeywords', 'extensionEnabled'], function(result) {
      const config = {
        blockedDomains: result.blockedDomains || [],
        blockedKeywords: result.blockedKeywords || [],
        blockedDescKeywords: result.blockedDescKeywords || [],
        extensionEnabled: result.extensionEnabled !== false
      };
      
      const dataStr = JSON.stringify(config, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = 'bettersearch-config.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    });
  }
  
  // Import configuration from a JSON file
  function importConfiguration(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const config = JSON.parse(e.target.result);
        
        // Validate the imported configuration
        if (typeof config !== 'object' || config === null) {
          throw new Error('Invalid configuration file');
        }
        
        // Extract the lists, defaulting to empty arrays if not present
        const blockedDomains = Array.isArray(config.blockedDomains) ? config.blockedDomains : [];
        const blockedKeywords = Array.isArray(config.blockedKeywords) ? config.blockedKeywords : [];
        const blockedDescKeywords = Array.isArray(config.blockedDescKeywords) ? config.blockedDescKeywords : [];
        const extensionEnabled = typeof config.extensionEnabled === 'boolean' ? config.extensionEnabled : true;
        
        // Save the imported configuration, completely replacing the existing data
        chrome.storage.sync.set({
          blockedDomains: blockedDomains,
          blockedKeywords: blockedKeywords,
          blockedDescKeywords: blockedDescKeywords,
          extensionEnabled: extensionEnabled
        }, function() {
          // Update the UI with the imported data
          displayDomains(blockedDomains);
          displayKeywords(blockedKeywords);
          displayDescKeywords(blockedDescKeywords);
          extensionToggle.checked = extensionEnabled;
          
          alert('Configuration imported successfully!');
        });
      } catch (error) {
        alert('Error importing configuration: ' + error.message);
      }
    };
    
    reader.readAsText(file);
    // Reset the file input to allow importing the same file again
    event.target.value = '';
  }
});