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

    // Helper function to set vehicle length
    function setVehicleLength(value) {
        const field = document.getElementById('vehicle-length');
        
        if (!field) {
            console.error('Vehicle length field not found');
            return false;
        }
        
        // Focus on the field (simulates clicking)
        field.focus();
        
        // Clear existing value and set new value
        field.value = '';
        field.value = value;
        
        // Trigger events that frameworks might be listening for
        field.dispatchEvent(new Event('focus', { bubbles: true }));
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        field.dispatchEvent(new Event('blur', { bubbles: true }));
        
        return true;
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

        // Step 7: Handle equipment filters if specified
        if (equipmentType && equipmentType.trim() !== '') {
            console.log('Equipment filters specified, applying equipment filters');

            // Small delay before equipment filter selection
            await new Promise(resolve => setTimeout(resolve, 500));

            // Click the Filter/Sort button
            const filterButton = document.querySelector('button.filters-button[aria-label="Filter / Sort"]') ||
                document.querySelector('button.sarsa-button-tertiary[aria-label="Filter / Sort"]') ||
                document.querySelector('button:has(.rec-icon-filter-list)') ||
                Array.from(document.querySelectorAll('button')).find(btn =>
                    btn.textContent.includes('Filter') || btn.textContent.includes('Sort')
                );

            if (filterButton) {
                console.log('Clicking Filter/Sort button');
                filterButton.click();

                // Wait for filter panel to open
                await new Promise(resolve => setTimeout(resolve, 500));

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

                                                // Set vehicle length if specified
                        if (equipmentLength && equipmentLength.trim() !== '') {
                            const lengthValue = parseInt(equipmentLength);
                            if (!isNaN(lengthValue)) {
                                console.log(`Setting vehicle length to: ${lengthValue}`);
                                const success = setVehicleLength(lengthValue.toString());
                                if (!success) {
                                    console.log('Failed to set vehicle length');
                                }
                            }
                        }
                    } else {
                        console.log('RMT checkbox not found');
                    }
                }

                // Small delay after equipment filter selection
                await new Promise(resolve => setTimeout(resolve, 250));
            } else {
                console.log('Filter/Sort button not found');
            }
        } else {
            console.log('No equipment filters specified, skipping equipment filter selection');
        }

                // Step 8: Click View Results button (if equipment filters were applied)
        if (equipmentType && equipmentType.trim() !== '') {
            // Use a more compatible selector approach
            const viewResultsButton = Array.from(document.querySelectorAll('button.sarsa-button-primary')).find(btn => {
                const text = btn.textContent.toLowerCase();
                return text.includes('view') && text.includes('results');
            }) ||
            Array.from(document.querySelectorAll('button')).find(btn => {
                const text = btn.textContent.toLowerCase();
                return text.includes('view') && text.includes('results');
            });
            
            if (viewResultsButton) {
                console.log('Clicking View Results button');
                viewResultsButton.click();
            } else {
                console.log('View Results button not found');
            }
        }

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