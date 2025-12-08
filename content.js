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
      searchResults.forEach((result, index) => {
        // Find cite elements within each search result
        const citeElement = result.querySelector('cite');
        
        // Find title elements (h2) within each search result
        const titleElement = result.querySelector('h2 a');
        
        // Find description elements with class b_lineclamp2 within each search result
        const descElement = result.querySelector('.b_lineclamp2');
        
        if (citeElement || titleElement || descElement) {
          let shouldBlock = false;
          
          // Check if the cite text contains any of the blocked domains
          if (citeElement) {
            console.log(`[BetterSearch] Checking traditional result ${index} cite: ${citeElement.textContent}`);
            shouldBlock = blockedDomains.some(domain => 
              citeElement.textContent.includes(domain)
            );
          }
          
          // Check if the title text contains any of the blocked keywords
          if (!shouldBlock && titleElement) {
            console.log(`[BetterSearch] Checking traditional result ${index} title: ${titleElement.textContent}`);
            shouldBlock = blockedKeywords.some(keyword => 
              titleElement.textContent.includes(keyword)
            );
          }
          
          // Check if the description text contains any of the blocked keywords
          if (!shouldBlock && descElement) {
            console.log(`[BetterSearch] Checking traditional result ${index} description: ${descElement.textContent}`);
            shouldBlock = blockedDescKeywords.some(keyword => 
              descElement.textContent.includes(keyword)
            );
          }
          
          if (shouldBlock) {
            console.log(`[BetterSearch] Hiding traditional result ${index}`);
            // Hide the entire search result
            result.style.display = 'none';
            hiddenCount++;
          }
        } else {
          console.log(`[BetterSearch] No cite, title or description element found in traditional result ${index}`);
        }
      });
      
      console.log(`[BetterSearch] Finished checking traditional results. Hidden ${hiddenCount} results.`);
    }

    // Function to handle carousel/slider search results
    function handleCarouselResults(blockedDomains, blockedKeywords, blockedDescKeywords) {
      // Find all slide elements in carousels
      const slideElements = document.querySelectorAll('.b_slidebar .slide');
      console.log(`[BetterSearch] Found ${slideElements.length} carousel slide elements`);
      
      let hiddenCount = 0;
      slideElements.forEach((slide, index) => {
        // Find cite elements within each slide
        const citeElements = slide.querySelectorAll('cite');
        
        // Find title elements within each slide
        const titleElements = slide.querySelectorAll('h2 a, .b_heroTitle a, .acf_t_c_title');
        
        // Find description elements within each slide
        const descElements = slide.querySelectorAll('.b_paractl, .b_gwaText a, .acf_t_c_body');
        
        let shouldBlock = false;
        
        // Check if any cite text contains blocked domains
        if (citeElements.length > 0) {
          citeElements.forEach((citeElement, citeIndex) => {
            console.log(`[BetterSearch] Checking carousel result ${index} cite ${citeIndex}: ${citeElement.textContent}`);
            if (blockedDomains.some(domain => citeElement.textContent.includes(domain))) {
              shouldBlock = true;
            }
          });
        }
        
        // Check if any title text contains blocked keywords
        if (!shouldBlock && titleElements.length > 0) {
          titleElements.forEach((titleElement, titleIndex) => {
            console.log(`[BetterSearch] Checking carousel result ${index} title ${titleIndex}: ${titleElement.textContent}`);
            if (blockedKeywords.some(keyword => titleElement.textContent.includes(keyword))) {
              shouldBlock = true;
            }
          });
        }
        
        // Check if any description text contains blocked keywords
        if (!shouldBlock && descElements.length > 0) {
          descElements.forEach((descElement, descIndex) => {
            console.log(`[BetterSearch] Checking carousel result ${index} description ${descIndex}: ${descElement.textContent}`);
            if (blockedDescKeywords.some(keyword => descElement.textContent.includes(keyword))) {
              shouldBlock = true;
            }
          });
        }
        
        if (shouldBlock) {
          console.log(`[BetterSearch] Hiding carousel result ${index}`);
          // Hide the entire slide
          slide.style.display = 'none';
          hiddenCount++;
        }
      });
      
      console.log(`[BetterSearch] Finished checking carousel results. Hidden ${hiddenCount} results.`);
    }
  
    // Run the function when page loads
    window.addEventListener('load', hideBlockedResults);
    
    // Also run it periodically in case of dynamic content loading
    setInterval(hideBlockedResults, 1000);
  })();