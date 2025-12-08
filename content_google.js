// content_google.js - Content script to hide Google search results based on blocked domains, titles and descriptions

(function() {
    'use strict';
    
    // Store reference to the notification element
    let notificationContainer = null;
    // Store blocked items for display
    let blockedItems = [];
    // Track if we've found any search results
    let hasSearchResults = false;
    // Track previous blocked count to avoid unnecessary updates
    let previousBlockedCount = 0;
  
    // Function to hide search results containing blocked domains, titles or descriptions
    function hideBlockedResults() {
      // Get extension status and blocked items from storage
      chrome.storage.sync.get(['extensionEnabled', 'blockedDomains', 'blockedKeywords', 'blockedDescKeywords'], function(result) {
        // Check if extension is enabled
        if (result.extensionEnabled === false) {
          hideNotification();
          console.log('[BetterSearch] Extension is disabled');
          return;
        }
        
        const blockedDomains = result.blockedDomains || [];
        const blockedKeywords = result.blockedKeywords || [];
        const blockedDescKeywords = result.blockedDescKeywords || [];
        console.log('[BetterSearch] Starting to check Google search results. Blocked domains:', blockedDomains, 'Blocked title keywords:', blockedKeywords, 'Blocked description keywords:', blockedDescKeywords);
        
        // Find all search result items with data-rpos attribute
        const searchResults = document.querySelectorAll('div[data-rpos]');
        console.log(`[BetterSearch] Found ${searchResults.length} Google search results`);
        
        // Update hasSearchResults flag
        if (searchResults.length > 0) {
          hasSearchResults = true;
        }
        
        let hiddenCount = 0;
        const newBlockedItems = [];
        searchResults.forEach((result, index) => {
          // Skip if already hidden
          if (result.style.display === 'none') {
            return;
          }
          
          // Find cite elements within each search result
          const citeElement = result.querySelector('cite');
          
          // Find title elements (h3) within each search result
          const titleElement = result.querySelector('h3');
          
          // Find description elements with -webkit-line-clamp style
          const descElement = result.querySelector('[style*="-webkit-line-clamp"]');
          
          if (citeElement || titleElement || descElement) {
            let shouldBlock = false;
            let blockReason = '';
            
            // Check if the cite text contains any of the blocked domains (case insensitive)
            if (citeElement) {
              console.log(`[BetterSearch] Checking Google result ${index} cite: ${citeElement.textContent}`);
              for (const domain of blockedDomains) {
                if (domain === '*.bing.com') {
                  // Special handling for the wildcard domain *.bing.com
                  const citeText = citeElement.textContent.toLowerCase();
                  try {
                    // Try to create a URL to easily extract the hostname
                    const url = new URL('http://' + citeText.replace(/^https?:\/\//, ''));
                    const hostname = url.hostname;
                    // Check if it's a subdomain of bing.com
                    if (hostname.endsWith('.bing.com') || hostname === 'bing.com') {
                      shouldBlock = true;
                      blockReason = 'Domain: *.bing.com';
                      break;
                    }
                  } catch (e) {
                    // If URL parsing fails, fall back to simple string matching
                    if (citeText.includes('.bing.com')) {
                      shouldBlock = true;
                      blockReason = 'Domain: *.bing.com';
                      break;
                    }
                  }
                } else {
                  // Regular domain matching (case insensitive)
                  if (citeElement.textContent.toLowerCase().includes(domain.toLowerCase())) {
                    shouldBlock = true;
                    blockReason = `Domain: ${domain}`;
                    break;
                  }
                }
              }
            }
            
            // Check if the title text contains any of the blocked keywords (case insensitive)
            if (!shouldBlock && titleElement) {
              console.log(`[BetterSearch] Checking Google result ${index} title: ${titleElement.textContent}`);
              for (const keyword of blockedKeywords) {
                if (titleElement.textContent.toLowerCase().includes(keyword.toLowerCase())) {
                  shouldBlock = true;
                  blockReason = `Title keyword: ${keyword}`;
                  break;
                }
              }
            }
            
            // Check if the description text contains any of the blocked keywords (case insensitive)
            if (!shouldBlock && descElement) {
              console.log(`[BetterSearch] Checking Google result ${index} description: ${descElement.textContent}`);
              for (const keyword of blockedDescKeywords) {
                if (descElement.textContent.toLowerCase().includes(keyword.toLowerCase())) {
                  shouldBlock = true;
                  blockReason = `Description keyword: ${keyword}`;
                  break;
                }
              }
            }
            
            if (shouldBlock) {
              console.log(`[BetterSearch] Hiding Google result ${index}`);
              // Hide the entire search result
              result.style.display = 'none';
              hiddenCount++;
              // Collect information about hidden items
              if (titleElement) {
                newBlockedItems.push({
                  title: titleElement.textContent,
                  reason: blockReason
                });
              } else if (citeElement) {
                newBlockedItems.push({
                  title: citeElement.textContent,
                  reason: blockReason
                });
              }
            }
          } else {
            console.log(`[BetterSearch] No cite, title or description element found in Google result ${index}`);
          }
        });
        
        console.log(`[BetterSearch] Finished checking Google results. Hidden ${hiddenCount} results.`);
        
        // Update blocked items list only if we have new items
        if (newBlockedItems.length > 0) {
          blockedItems = blockedItems.concat(newBlockedItems);
          // Show/update notification
          if (hasSearchResults) {
            updateNotification(blockedItems.length);
          }
        } else if (hasSearchResults && previousBlockedCount === 0) {
          // Show initial notification if we have search results but no blocked items
          updateNotification(0);
        }
        
        // Update previous blocked count
        previousBlockedCount = blockedItems.length;
      });
    }
    
    // Function to update or create the notification
    function updateNotification(blockedCount) {
      // Preserve scroll position if notification already exists
      let scrollTop = 0;
      if (notificationContainer && notificationContainer.querySelector('div:nth-child(2)')) {
        const contentArea = notificationContainer.querySelector('div:nth-child(2)');
        scrollTop = contentArea.scrollTop;
      }
      
      // Create notification container if it doesn't exist
      if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'bettersearch-notification';
        notificationContainer.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 300px;
          max-height: 400px;
          background: #fff;
          border: 1px solid #ccc;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
        `;
        document.body.appendChild(notificationContainer);
      }
      
      // Clear previous content
      notificationContainer.innerHTML = '';
      
      // Create header
      const header = document.createElement('div');
      header.style.cssText = `
        padding: 12px 16px;
        background: #0078d4;
        color: white;
        font-weight: bold;
        border-radius: 8px 8px 0 0;
      `;
      
      if (blockedCount > 0) {
        header.textContent = `BetterSearch - Blocked ${blockedCount} Result${blockedCount > 1 ? 's' : ''}`;
      } else {
        header.textContent = 'BetterSearch - Active';
      }
      
      notificationContainer.appendChild(header);
      
      // Create content area
      const content = document.createElement('div');
      content.style.cssText = `
        padding: 12px 16px;
        max-height: 300px;
        overflow-y: auto;
      `;
      
      // Restore scroll position after content is added
      setTimeout(() => {
        if (content && scrollTop > 0) {
          content.scrollTop = scrollTop;
        }
      }, 0);
      
      if (blockedCount > 0) {
        // Add blocked items to content
        blockedItems.slice(-5).forEach(item => { // Show last 5 items
          const itemDiv = document.createElement('div');
          itemDiv.style.cssText = `
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
          `;
          
          const title = document.createElement('div');
          title.style.cssText = `
            font-weight: 500;
            font-size: 14px;
            margin-bottom: 4px;
            word-break: break-word;
          `;
          title.textContent = item.title;
          
          const reason = document.createElement('div');
          reason.style.cssText = `
            font-size: 12px;
            color: #666;
          `;
          reason.textContent = item.reason;
          
          itemDiv.appendChild(title);
          itemDiv.appendChild(reason);
          content.appendChild(itemDiv);
        });
        
        // Add "and X more" if there are more items
        if (blockedItems.length > 5) {
          const moreDiv = document.createElement('div');
          moreDiv.style.cssText = `
            font-size: 12px;
            color: #666;
            text-align: center;
            padding: 8px 0;
          `;
          moreDiv.textContent = `and ${blockedItems.length - 5} more`;
          content.appendChild(moreDiv);
        }
      } else {
        // Add message when no results are blocked
        const message = document.createElement('div');
        message.style.cssText = `
          font-size: 14px;
          color: #333;
        `;
        message.textContent = 'Extension is working but no results matched your filters.';
        content.appendChild(message);
      }
      
      notificationContainer.appendChild(content);
    }
    
    // Function to hide the notification
    function hideNotification() {
      if (notificationContainer && notificationContainer.parentNode) {
        notificationContainer.parentNode.removeChild(notificationContainer);
        notificationContainer = null;
      }
      // Reset state
      blockedItems = [];
      hasSearchResults = false;
      previousBlockedCount = 0;
    }
  
    // Run the function when page loads
    window.addEventListener('load', function() {
      hideNotification(); // Clear any previous state
      hideBlockedResults();
    });
    
    // Also run it periodically in case of dynamic content loading
    setInterval(hideBlockedResults, 1000);
  })();