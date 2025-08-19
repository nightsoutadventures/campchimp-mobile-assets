// DEVELOPMENT VERSION - This file is used for Xcode debug builds only
console.log('🔧 Using Rec.gov date-selection-dev.js (Development Build)');

async function selectCampingDates(startDate, endDate, equipmentType = '', equipmentLength = '') {

    // Helper function to wait for an element with timeout
    function waitForElement(selector, timeout = 2000) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }

            const observer = new MutationObserver(mutations => {
                if (document.querySelector(selector)) {
                    observer.disconnect();
                    resolve(document.querySelector(selector));
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Timeout waiting for ${selector}`));
            }, timeout);
        });
    }

    // Helper function to click back button and return to campground detail page
    async function clickBackButton() {
        const backButton = document.querySelector('button[aria-label="Back"]') ||
            document.querySelector('.rec-icon-chevron-left').closest('button');
        if (backButton) {
            console.log('Clicking back button to return to campground detail page');
            backButton.click();
            return true;
        }
        console.log('Back button not found');
        return false;
    }

    // Helper function to clear vehicle length to 0
    async function clearVehicleLength() {
        // Wait for vehicle length field to be present
        console.log('🔍 Waiting for vehicle length field to be available...');
        let vehicleLengthField = null;
        let attempts = 0;
        const maxAttempts = 20; // 2 seconds total (20 * 100ms)
        
        while (!vehicleLengthField && attempts < maxAttempts) {
            vehicleLengthField = document.getElementById('vehicle-length');
            if (!vehicleLengthField) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
        }
        
        if (!vehicleLengthField) {
            console.log('Vehicle length field not found for clearing after waiting');
            console.log('🔍 Available input fields:', Array.from(document.querySelectorAll('input')).map(i => ({
                id: i.id,
                name: i.name,
                type: i.type,
                value: i.value,
                placeholder: i.placeholder
            })));
            return false;
        }
        
        console.log('✅ Vehicle length field found for clearing');
        
        // Find the decrement button
        const decrementButton = document.querySelector('button[aria-label="Remove feet"]') ||
                              document.querySelector('button:has(.rec-icon-remove-circle-outline)') ||
                              Array.from(document.querySelectorAll('button')).find(btn => 
                                  btn.querySelector('.rec-icon-remove-circle-outline')
                              );
        
        if (!decrementButton) {
            console.log('Decrement button not found for clearing vehicle length');
            console.log('🔍 Available buttons:', Array.from(document.querySelectorAll('button')).map(btn => ({
                'aria-label': btn.getAttribute('aria-label'),
                'class': btn.className,
                'disabled': btn.disabled,
                'text': btn.textContent?.trim()
            })));
            return false;
        }
        
        console.log('✅ Decrement button found for clearing vehicle length');
        
        // Check if button is already disabled (value is already 0)
        if (decrementButton.disabled) {
            console.log('Decrement button already disabled, vehicle length is 0');
            return true;
        }
        
        console.log('Clearing vehicle length to 0 using decrement button disabled state');
        
        // Keep clicking decrement button until it becomes disabled
        let clickCount = 0;
        const maxClicks = 50; // Safety limit to prevent infinite loop
        
        while (!decrementButton.disabled && clickCount < maxClicks) {
            console.log(`Click ${clickCount + 1} - Button disabled: ${decrementButton.disabled}`);
            decrementButton.click();
            await new Promise(resolve => setTimeout(resolve, 25));
            clickCount++;
        }
        
        if (decrementButton.disabled) {
            console.log(`✅ Vehicle length cleared to 0 after ${clickCount} clicks`);
            return true;
        } else {
            console.log(`❌ Failed to clear vehicle length after ${maxClicks} clicks`);
            return false;
        }
    }

    // Helper function to set vehicle length using +/- buttons
    async function setVehicleLength(value) {
        console.log('🚀 setVehicleLength function called with value:', value);
        
        // Find the vehicle length field to get current value
        const field = document.getElementById('vehicle-length');
        if (!field) {
            console.error('Vehicle length field not found');
            return false;
        }
        
        const currentValue = parseInt(field.value) || 0;
        const targetValue = parseInt(value);
        
        console.log(`Current vehicle length: ${currentValue}, Target: ${targetValue}`);
        
        if (currentValue === targetValue) {
            console.log('✅ Vehicle length already set to target value');
            return true;
        }
        
        // Find the increment and decrement buttons
        const incrementButton = document.querySelector('button[aria-label="Add feet"]') ||
                               document.querySelector('button:has(.rec-icon-add-circle-outline)') ||
                               Array.from(document.querySelectorAll('button')).find(btn => 
                                   btn.querySelector('.rec-icon-add-circle-outline')
                               );
        
        const decrementButton = document.querySelector('button[aria-label="Remove feet"]') ||
                               document.querySelector('button:has(.rec-icon-remove-circle-outline)') ||
                               Array.from(document.querySelectorAll('button')).find(btn => 
                                   btn.querySelector('.rec-icon-remove-circle-outline')
                               );
        
        if (!incrementButton || !decrementButton) {
            console.error('Increment/decrement buttons not found');
            console.log('Available buttons:', Array.from(document.querySelectorAll('button')).map(btn => ({
                'aria-label': btn.getAttribute('aria-label'),
                'class': btn.className,
                'disabled': btn.disabled
            })));
            return false;
        }
        
        console.log('✅ Found increment and decrement buttons');
        
        try {
            // Calculate how many clicks we need
            const clicksNeeded = targetValue - currentValue;
            const buttonToClick = clicksNeeded > 0 ? incrementButton : decrementButton;
            const clickCount = Math.abs(clicksNeeded);
            
            console.log(`Need to click ${buttonToClick.getAttribute('aria-label')} button ${clickCount} times`);
            
            // Click the appropriate button the required number of times
            for (let i = 0; i < clickCount; i++) {
                console.log(`Click ${i + 1}/${clickCount}`);
                
                // Check if button is disabled
                if (buttonToClick.disabled) {
                    console.log('⚠️ Button is disabled, stopping');
                    break;
                }
                
                buttonToClick.click();
                await new Promise(resolve => setTimeout(resolve, 25)); // Fast delay between clicks
                
                // Verify the value changed
                const newValue = parseInt(field.value) || 0;
                console.log(`After click ${i + 1}, field value is: ${newValue}`);
                
                // If we've reached the target, stop
                if (newValue === targetValue) {
                    console.log('✅ Reached target value, stopping clicks');
                    break;
                }
            }
            
            // Final verification
            const finalValue = parseInt(field.value) || 0;
            console.log(`Final vehicle length: ${finalValue}, Target: ${targetValue}`);
            
            return finalValue === targetValue;
            
        } catch (error) {
            console.error('Error setting vehicle length with buttons:', error);
            return false;
        }
    }

    try {
        // Find and click the calendar button (super defensive approach)
        const calendarButton = await Promise.race([
            new Promise(resolve => {
                // Primary: Look for any button containing the calendar icon
                let button = document.querySelector('button .rec-icon-calendar')?.closest('button') ||
                    document.querySelector('button svg.rec-icon-calendar')?.closest('button');
                if (button) {
                    console.log('Found calendar button by icon');
                    resolve(button);
                    return;
                }

                // Fallback 1: Look in overlay menu for icon
                button = document.querySelector('.overlay-menu button .rec-icon-calendar')?.closest('button');
                if (button) {
                    console.log('Found calendar button by icon in overlay menu');
                    resolve(button);
                    return;
                }

                // Fallback 2: Look for specific text patterns
                button = Array.from(document.querySelectorAll('button')).find(btn => {
                    const text = btn.textContent.trim();
                    return text.includes('Set Date') ||
                        text.includes('Set Dates') ||
                        text.includes('Enter Date') ||
                        text.includes('Enter Dates') ||
                        // Date range patterns: "Aug 8 - Aug 11" or "Aug 26 - Aug 28" (case insensitive)
                        /[A-Za-z]{3}\s+\d{1,2}\s+-\s+[A-Za-z]{3}\s+\d{1,2}/i.test(text) ||
                        // Generic fallback: any button with "Date" or "Dates"
                        text.includes('Date');
                });
                if (button) {
                    console.log('Found calendar button by text pattern:', button.textContent.trim());
                    resolve(button);
                    return;
                }

                // Fallback 3: Look in overlay menu for text patterns
                button = Array.from(document.querySelectorAll('.overlay-menu button')).find(btn => {
                    const text = btn.textContent.trim();
                    return text.includes('Date');
                });
                if (button) {
                    console.log('Found calendar button by text in overlay menu:', button.textContent.trim());
                    resolve(button);
                }
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Calendar button not found')), 2000))
        ]);

        console.log(`Clicking calendar button: "${calendarButton.textContent.trim()}"`);
        calendarButton.click();

        // Wait for calendar to appear and be interactive
        const calendar = await waitForElement('.calendar-grid .heading');
        console.log('Calendar found');

        // Helper function to get current month and year
        function getCurrentMonthYear() {
            const headerText = document.querySelector('.calendar-grid .heading').textContent.trim();
            const [month, year] = headerText.split(' ');
            return { month, year: parseInt(year) };
        }

        // Helper function to click navigation button and wait for month change
        async function navigateMonth(direction) {
            const currentMonth = getCurrentMonthYear().month;
            const buttonSelector = direction === 'forward'
                ? 'button[aria-label="Next"]'
                : 'button[aria-label="Previous"]';

            const button = document.querySelector(buttonSelector);
            if (!button) return false;

            button.click();

            // Wait for month to change
            return new Promise((resolve, reject) => {
                let attempts = 0;
                const checkMonthChange = setInterval(() => {
                    attempts++;
                    const newMonth = getCurrentMonthYear().month;
                    if (newMonth !== currentMonth) {
                        clearInterval(checkMonthChange);
                        resolve(true);
                    }
                    if (attempts > 10) {
                        clearInterval(checkMonthChange);
                        reject(new Error('Month navigation failed'));
                    }
                }, 50);
            });
        }

        // Navigate to correct month
        const targetDate = new Date(startDate + 'T12:00:00Z');
        while (true) {
            const current = getCurrentMonthYear();
            const currentDate = new Date(`${current.month} 1, ${current.year} 12:00:00`);

            if (currentDate.getMonth() === targetDate.getMonth() &&
                currentDate.getFullYear() === targetDate.getFullYear()) {
                break;
            }

            const goForward = targetDate > currentDate;
            await navigateMonth(goForward ? 'forward' : 'back');
        }

        // Helper function to click a specific date
        async function clickDate(date) {
            const day = date.getDate();
            console.log(`Attempting to click date: ${date.toISOString()}, day: ${day}`);

            // Wait for date cells to be available after month navigation
            await new Promise(resolve => setTimeout(resolve, 50));

            const availableCells = Array.from(
                document.querySelectorAll('.calendar-cell:not(.is-unavailable):not(.is-disabled)')
            );

            const targetCell = availableCells.find(cell => {
                const cellDay = parseInt(cell.textContent.trim());
                const matches = cellDay === day;
                console.log(`Checking cell: ${cellDay}, matches: ${matches}`);
                return matches;
            });

            if (targetCell) {
                console.log(`Found and clicking cell for date: ${date.toISOString()}`);
                targetCell.click();
                return true;
            }

            console.log(`Could not find clickable cell for date: ${date.toISOString()}`);
            return false;
        }

        // Select start and end dates
        const start = new Date(startDate + 'T12:00:00Z');
        const end = new Date(endDate + 'T12:00:00Z');

        // Click start date
        if (!await clickDate(start)) {
            console.log('Could not select start date - dates may be disabled');
            await clickBackButton();
            return false;
        }

        // Check if end date is in a different month
        const startMonth = start.getMonth();
        const startYear = start.getFullYear();
        const endMonth = end.getMonth();
        const endYear = end.getFullYear();

        const isMultiMonth = (startYear !== endYear) || (startMonth !== endMonth);

        if (isMultiMonth) {
            console.log('Multi-month date range detected - navigating to end month');

            // Navigate to the end month
            while (true) {
                const current = getCurrentMonthYear();
                const currentDate = new Date(`${current.month} 1, ${current.year} 12:00:00`);

                if (currentDate.getMonth() === endMonth &&
                    currentDate.getFullYear() === endYear) {
                    break;
                }

                const goForward = end > currentDate;
                await navigateMonth(goForward ? 'forward' : 'back');
            }

            console.log('Navigated to end month for multi-month selection');
        }

        // Click end date (either in same month or after navigation to end month)
        if (!await clickDate(end)) {
            console.log('Could not select end date - dates may be disabled');
            await clickBackButton();
            return false;
        }

        // EDGE CASE 1: Check if calendar is still visible after date selection
        // Wait 250ms then check if back button is still present (indicating calendar is still open)
        await new Promise(resolve => setTimeout(resolve, 250));

        const backButton = document.querySelector('button[aria-label="Back"]') ||
            document.querySelector('.rec-icon-chevron-left')?.closest('button');

        if (backButton) {
            console.log('Calendar still visible after date selection - handling edge case 1');

            // Click the start date again to ensure it's selected
            if (await clickDate(start)) {
                console.log('Re-clicked start date');
            }

            // Click back button to return to campground detail page
            await clickBackButton();
        } else {
            console.log('Calendar auto-dismissed successfully');
        }

                            console.log('Date selection completed successfully');
                    
                    // Step 7: Handle filter clearing and equipment filters based on whether we have filters to apply
                    if (equipmentType && equipmentType.trim() !== '') {
                        // We have equipment filters to apply - open filter panel once and handle everything
                        console.log('Equipment filters specified, opening filter panel to clear existing and set new filters');
                        
                        // Click the Filter / Sort button to open the filter panel
                        const filterButton = document.querySelector('button[data-component="Button"].filters-button') ||
                                           document.querySelector('button[aria-label="Filter / Sort"]') ||
                                           Array.from(document.querySelectorAll('button')).find(btn => {
                                               const text = btn.textContent.toLowerCase();
                                               return text.includes('filter') && text.includes('sort');
                                           });
                        
                        if (filterButton) {
                            console.log('Clicking Filter / Sort button to open filter panel');
                            filterButton.click();
                            await new Promise(resolve => setTimeout(resolve, 500));
                            
                            // Step 7a: Clear existing filters first
                            const clearAllButton = Array.from(document.querySelectorAll('button')).find(btn => {
                                const text = btn.textContent.toLowerCase();
                                return text.includes('clear') && text.includes('filter');
                            });
                            
                            if (clearAllButton) {
                                console.log('Clicking Clear All Filters button');
                                clearAllButton.click();
                                await new Promise(resolve => setTimeout(resolve, 250));
                            } else {
                                console.log('Clear All Filters button not found - no existing filters to clear');
                            }
                            
                            // Step 7b: Apply new equipment filters
                            console.log('Applying new equipment filters');
                            
                            // Add bottom padding to ensure filter buttons are visible above WebView footer
                            console.log('📱 Adding bottom padding to filter container for WebView compatibility');
                            const filterContainer = document.querySelector('.filter-container') ||
                                                  document.querySelector('[data-component="FilterContainer"]') ||
                                                  document.querySelector('.sarsa-filter-container') ||
                                                  document.querySelector('.filter-panel') ||
                                                  document.body;
                            
                            if (filterContainer) {
                                // Add CSS to ensure bottom buttons are visible
                                const style = document.createElement('style');
                                style.textContent = `
                                    .filter-container, [data-component="FilterContainer"], .sarsa-filter-container, .filter-panel {
                                        padding-bottom: 120px !important;
                                        margin-bottom: 120px !important;
                                    }
                                    /* Target the bottom action buttons specifically */
                                    .filter-actions, .filter-buttons, .sarsa-button-group {
                                        margin-bottom: 120px !important;
                                        padding-bottom: 20px !important;
                                    }
                                    /* Ensure the page can scroll to show bottom buttons */
                                    body {
                                        min-height: calc(100vh + 120px) !important;
                                    }
                                `;
                                document.head.appendChild(style);
                                console.log('✅ Added bottom padding CSS for WebView compatibility');
                            } else {
                                console.log('⚠️ Filter container not found, applying padding to body');
                                const style = document.createElement('style');
                                style.textContent = `
                                    body {
                                        padding-bottom: 120px !important;
                                        min-height: calc(100vh + 120px) !important;
                                    }
                                `;
                                document.head.appendChild(style);
                            }
                            
                            // Handle different equipment types
                            if (equipmentType.toLowerCase() === 'tent') {
                                // Click tent checkbox
                                const tentCheckbox = document.querySelector('input[type="checkbox"]#tent') ||
                                                   document.querySelector('input[type="checkbox"][value="tent"]') ||
                                                   document.querySelector('input[type="checkbox"][data-rectagaction*="tent"]');
                                
                                if (tentCheckbox) {
                                    console.log('Clicking tent checkbox');
                                    tentCheckbox.click();
                                } else {
                                    console.log('Tent checkbox not found');
                                }
                                
                            } else if (equipmentType.toLowerCase() === 'rv' || equipmentType.toLowerCase() === 'trailer') {
                                // Click RMT checkbox
                                const rmtCheckbox = document.querySelector('input[type="checkbox"]#rmt') ||
                                                  document.querySelector('input[type="checkbox"][value="rmt"]') ||
                                                  document.querySelector('input[type="checkbox"][data-rectagaction*="rmt"]');
                                
                                if (rmtCheckbox) {
                                    console.log('Clicking RMT checkbox');
                                    rmtCheckbox.click();
                                    
                                    // Small delay after checkbox click
                                    await new Promise(resolve => setTimeout(resolve, 250));
                                    
                                    // Wait for the vehicle length field to be fully initialized
                                    console.log('⏳ Waiting for vehicle length field to be ready...');
                                    await new Promise(resolve => setTimeout(resolve, 500));
                                    
                                    // Set vehicle length if specified
                                    if (equipmentLength && equipmentLength.trim() !== '') {
                                        const lengthValue = parseInt(equipmentLength);
                                        if (!isNaN(lengthValue)) {
                                            console.log('=== VEHICLE LENGTH SETTING START ===');
                                            console.log(`Attempting to set vehicle length to: ${lengthValue}`);
                                            console.log(`Equipment length parameter: "${equipmentLength}"`);
                                            console.log(`Parsed length value: ${lengthValue}`);
                                            
                                            console.log('🔧 About to call setVehicleLength function...');
                                            try {
                                                const success = await setVehicleLength(lengthValue.toString());
                                                console.log('🔧 setVehicleLength function completed, success:', success);
                                                
                                                if (success) {
                                                    console.log('✅ Vehicle length setting completed successfully');
                                                } else {
                                                    console.log('❌ Vehicle length setting failed');
                                                }
                                            } catch (error) {
                                                console.error('❌ Error calling setVehicleLength:', error);
                                            }
                                            console.log('=== VEHICLE LENGTH SETTING END ===');
                                        } else {
                                            console.log('❌ Invalid equipment length value:', equipmentLength);
                                        }
                                    } else {
                                        console.log('ℹ️ No equipment length specified, skipping vehicle length setting');
                                    }
                                } else {
                                    console.log('RMT checkbox not found');
                                }
                            }

                            // Small delay after equipment filter selection
                            await new Promise(resolve => setTimeout(resolve, 250));
                            
                            // Step 7c: Apply filters and close panel
                            const viewResultsButton = Array.from(document.querySelectorAll('button.sarsa-button-primary')).find(btn => {
                                const text = btn.textContent.toLowerCase();
                                return text.includes('view') && text.includes('results');
                            }) ||
                            Array.from(document.querySelectorAll('button')).find(btn => {
                                const text = btn.textContent.toLowerCase();
                                return text.includes('view') && text.includes('results');
                            });
                            
                            if (viewResultsButton) {
                                console.log('Clicking View Results button to apply equipment filters');
                                viewResultsButton.click();
                            } else {
                                console.log('View Results button not found - filter panel may be stuck open');
                            }
                        } else {
                            console.log('Filter/Sort button not found');
                        }
                    } else {
                        // No equipment filters - just clear any existing filters
                        console.log('No equipment filters specified, clearing any existing filters');
                        
                        // Click the Filter / Sort button to open the filter panel
                        const filterButton = document.querySelector('button[data-component="Button"].filters-button') ||
                                           document.querySelector('button[aria-label="Filter / Sort"]') ||
                                           Array.from(document.querySelectorAll('button')).find(btn => {
                                               const text = btn.textContent.toLowerCase();
                                               return text.includes('filter') && text.includes('sort');
                                           });
                        
                        if (filterButton) {
                            console.log('Clicking Filter / Sort button to open filter panel');
                            filterButton.click();
                            await new Promise(resolve => setTimeout(resolve, 500));
                            
                            // Look for the "Clear All Filters" button
                            const clearAllButton = Array.from(document.querySelectorAll('button')).find(btn => {
                                const text = btn.textContent.toLowerCase();
                                return text.includes('clear') && text.includes('filter');
                            });
                            
                            if (clearAllButton) {
                                console.log('Clicking Clear All Filters button');
                                clearAllButton.click();
                                await new Promise(resolve => setTimeout(resolve, 250));
                            } else {
                                console.log('Clear All Filters button not found - no existing filters to clear');
                            }
                            
                            // Click View Results button to apply any changes and close filter panel
                            const viewResultsButton = Array.from(document.querySelectorAll('button.sarsa-button-primary')).find(btn => {
                                const text = btn.textContent.toLowerCase();
                                return text.includes('view') && text.includes('results');
                            }) ||
                            Array.from(document.querySelectorAll('button')).find(btn => {
                                const text = btn.textContent.toLowerCase();
                                return text.includes('view') && text.includes('results');
                            });
                            
                            if (viewResultsButton) {
                                console.log('Clicking View Results button after clearing filters');
                                viewResultsButton.click();
                                await new Promise(resolve => setTimeout(resolve, 500));
                            } else {
                                console.log('View Results button not found - filter panel may be stuck open');
                            }
                        } else {
                            console.log('Filter / Sort button not found');
                        }
                    }

        // Final step: Scroll to top of page for better user experience
        // add a small delay before scrolling to top
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('Scrolling to top of page');
        window.scrollTo(0,0);
        
        return true;

    } catch (error) {
        console.error('Error selecting dates:', error);

        // EDGE CASE 2: If there was an error, try to click back button to return to detail page
        try {
            await clickBackButton();
        } catch (backError) {
            console.error('Error clicking back button:', backError);
        }

        return false;
    }
}