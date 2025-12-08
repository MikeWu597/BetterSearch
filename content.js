// content.js - Content script to hide search results based on blocked domains list

(function() {
    'use strict';
  
    // Function to hide search results containing blocked domains or keywords
    function hideBlockedResults() {
      // Get blocked domains, title keywords and description keywords from storage
      chrome.storage.sync.get(['blockedDomains', 'blockedKeywords', 'blockedDescKeywords'], function(result) {
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
      
      let hiddenCount = 0;
      const hiddenItems = [];
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
              hiddenItems.push({
                title: titleElement.textContent,
                reason: blockReason
              });
            } else if (citeElement) {
              hiddenItems.push({
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
      
      // Show notification if any results were hidden
      if (hiddenCount > 0) {
        showNotification(hiddenCount, hiddenItems);
      }
    }

    // Function to handle carousel/slider search results
    function handleCarouselResults(blockedDomains, blockedKeywords, blockedDescKeywords) {
      // Find all slide elements in carousels
      const slideElements = document.querySelectorAll('.b_slidebar .slide');
      console.log(`[BetterSearch] Found ${slideElements.length} carousel slide elements`);
      
      let hiddenCount = 0;
      const hiddenItems = [];
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
            hiddenItems.push({
              title: titleElements[0].textContent,
              reason: blockReason
            });
          } else if (citeElements.length > 0) {
            hiddenItems.push({
              title: citeElements[0].textContent,
              reason: blockReason
            });
          }
        }
      });
      
      console.log(`[BetterSearch] Finished checking carousel results. Hidden ${hiddenCount} results.`);
      
      // Show notification if any results were hidden
      if (hiddenCount > 0) {
        showNotification(hiddenCount, hiddenItems);
      }
    }
    
    // Function to show notification popup
    function showNotification(count, items) {
      // Create notification container
      let notificationContainer = document.getElementById('bettersearch-notification');
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
      header.textContent = `BetterSearch - Blocked ${count} Result${count > 1 ? 's' : ''}`;
      notificationContainer.appendChild(header);
      
      // Create content area
      const content = document.createElement('div');
      content.style.cssText = `
        padding: 12px 16px;
        max-height: 300px;
        overflow-y: auto;
      `;
      
      // Add hidden items to content
      items.slice(0, 5).forEach(item => {
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
      if (items.length > 5) {
        const moreDiv = document.createElement('div');
        moreDiv.style.cssText = `
          font-size: 12px;
          color: #666;
          text-align: center;
          padding: 8px 0;
        `;
        moreDiv.textContent = `and ${items.length - 5} more`;
        content.appendChild(moreDiv);
      }
      
      notificationContainer.appendChild(content);
      
      // Create close button
      const closeBtn = document.createElement('div');
      closeBtn.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        width: 20px;
        height: 20px;
        cursor: pointer;
        font-weight: bold;
        color: white;
        text-align: center;
      `;
      closeBtn.innerHTML = '&times;';
      closeBtn.onclick = () => {
        notificationContainer.remove();
      };
      header.appendChild(closeBtn);
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        if (notificationContainer.parentNode) {
          notificationContainer.remove();
        }
      }, 5000);
    }
  
    // Run the function when page loads
    window.addEventListener('load', hideBlockedResults);
    
    // Also run it periodically in case of dynamic content loading
    setInterval(hideBlockedResults, 1000);
  })();