// content.js - Content script to hide search results based on blocked domains list

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
  
    // Function to hide search results containing blocked domains or keywords
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
        console.log('[BetterSearch] Starting to check search results. Blocked domains:', blockedDomains, 'Blocked title keywords:', blockedKeywords, 'Blocked description keywords:', blockedDescKeywords);
        
        // Handle traditional search results (li.b_algo, li.b_ad, li.b_ans)
        handleTraditionalResults(blockedDomains, blockedKeywords, blockedDescKeywords);
        
        // Handle new carousel/slider search results
        handleCarouselResults(blockedDomains, blockedKeywords, blockedDescKeywords);
      });
    }

    // Function to handle traditional search results
    function handleTraditionalResults(blockedDomains, blockedKeywords, blockedDescKeywords) {
      // Select b_algo, b_ad, and b_ans elements
      const algoResults = Array.from(document.querySelectorAll('li.b_algo'));
      const adResults = Array.from(document.querySelectorAll('li.b_ad'));
      const ansResults = Array.from(document.querySelectorAll('li.b_ans'));
      
      // Combine all results into one array
      const searchResults = [...algoResults, ...adResults, ...ansResults];
      
      console.log(`[BetterSearch] Found ${algoResults.length} b_algo, ${adResults.length} b_ad, and ${ansResults.length} b_ans results (Total: ${searchResults.length})`);
      
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
        
        // Find title elements (h2) within each search result
        const titleElement = result.querySelector('h2 a');
        
        // Find description elements with class b_lineclamp2 within each search result
        const descElement = result.querySelector('.b_lineclamp2');
        
        if (citeElement || titleElement || descElement) {
          let shouldBlock = false;
          let blockReason = '';
          
          // Check if the cite text contains any of the blocked domains (case insensitive)
          if (citeElement) {
            console.log(`[BetterSearch] Checking traditional result ${index} cite: ${citeElement.textContent}`);
            for (const domain of blockedDomains) {
              if (citeElement.textContent.toLowerCase().includes(domain.toLowerCase())) {
                shouldBlock = true;
                blockReason = `Domain: ${domain}`;
                break;
              }
            }
          }
          
          // Check if the title text contains any of the blocked keywords (case insensitive)
          if (!shouldBlock && titleElement) {
            console.log(`[BetterSearch] Checking traditional result ${index} title: ${titleElement.textContent}`);
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
            console.log(`[BetterSearch] Checking traditional result ${index} description: ${descElement.textContent}`);
            for (const keyword of blockedDescKeywords) {
              if (descElement.textContent.toLowerCase().includes(keyword.toLowerCase())) {
                shouldBlock = true;
                blockReason = `Description keyword: ${keyword}`;
                break;
              }
            }
          }
          
          if (shouldBlock) {
            console.log(`[BetterSearch] Hiding traditional result ${index}`);
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
          console.log(`[BetterSearch] No cite, title or description element found in traditional result ${index}`);
        }
      });
      
      console.log(`[BetterSearch] Finished checking traditional results. Hidden ${hiddenCount} results.`);
      
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
    }

    // Function to handle carousel/slider search results
    function handleCarouselResults(blockedDomains, blockedKeywords, blockedDescKeywords) {
      // Find all slide elements in carousels
      const slideElements = document.querySelectorAll('.b_slidebar .slide');
      console.log(`[BetterSearch] Found ${slideElements.length} carousel slide elements`);
      
      // Update hasSearchResults flag
      if (slideElements.length > 0) {
        hasSearchResults = true;
      }
      
      let hiddenCount = 0;
      const newBlockedItems = [];
      
      slideElements.forEach((slide, index) => {
        // Skip if already hidden
        if (slide.style.display === 'none') {
          return;
        }
        
        // Find cite elements within each slide
        const citeElements = slide.querySelectorAll('cite');
        
        // Find title elements within each slide
        const titleElements = slide.querySelectorAll('h2 a, .b_heroTitle a, .acf_t_c_title');
        
        // Find description elements within each slide
        const descElements = slide.querySelectorAll('.b_paractl, .b_gwaText a, .acf_t_c_body');
        
        let shouldBlock = false;
        let blockReason = '';
        
        // Check if any cite text contains blocked domains (case insensitive)
        if (citeElements.length > 0) {
          citeElements.forEach((citeElement, citeIndex) => {
            console.log(`[BetterSearch] Checking carousel result ${index} cite ${citeIndex}: ${citeElement.textContent}`);
            for (const domain of blockedDomains) {
              if (citeElement.textContent.toLowerCase().includes(domain.toLowerCase())) {
                shouldBlock = true;
                blockReason = `Domain: ${domain}`;
                break;
              }
            }
          });
        }
        
        // Check if any title text contains blocked keywords (case insensitive)
        if (!shouldBlock && titleElements.length > 0) {
          titleElements.forEach((titleElement, titleIndex) => {
            console.log(`[BetterSearch] Checking carousel result ${index} title ${titleIndex}: ${titleElement.textContent}`);
            for (const keyword of blockedKeywords) {
              if (titleElement.textContent.toLowerCase().includes(keyword.toLowerCase())) {
                shouldBlock = true;
                blockReason = `Title keyword: ${keyword}`;
                break;
              }
            }
          });
        }
        
        // Check if any description text contains blocked keywords (case insensitive)
        if (!shouldBlock && descElements.length > 0) {
          descElements.forEach((descElement, descIndex) => {
            console.log(`[BetterSearch] Checking carousel result ${index} description ${descIndex}: ${descElement.textContent}`);
            for (const keyword of blockedDescKeywords) {
              if (descElement.textContent.toLowerCase().includes(keyword.toLowerCase())) {
                shouldBlock = true;
                blockReason = `Description keyword: ${keyword}`;
                break;
              }
            }
          });
        }
        
        if (shouldBlock) {
          console.log(`[BetterSearch] Hiding carousel result ${index}`);
          // Hide the entire slide
          slide.style.display = 'none';
          hiddenCount++;
          // Collect information about hidden items
          if (titleElements.length > 0) {
            newBlockedItems.push({
              title: titleElements[0].textContent,
              reason: blockReason
            });
          } else if (citeElements.length > 0) {
            newBlockedItems.push({
              title: citeElements[0].textContent,
              reason: blockReason
            });
          }
        }
      });
      
      console.log(`[BetterSearch] Finished checking carousel results. Hidden ${hiddenCount} results.`);
      
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