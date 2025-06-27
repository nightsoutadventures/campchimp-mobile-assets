    async function selectCampingDates(startDate, endDate) {
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

        try {
            // Find and click the enter dates button
            const calendarButton = await Promise.race([
                new Promise(resolve => {
                    const button = Array.from(document.querySelectorAll('button')).find(btn =>
                        btn.querySelector('.rec-icon-calendar') &&
                        (btn.textContent.trim().includes('Enter Dates') ||
                         /[A-Z][a-z]{2}\s+\d{1,2}-\d{1,2}/.test(btn.textContent.trim()))
                    );
                    if (button) resolve(button);
                }),
                new Promise(resolve => {
                    const button = Array.from(document.querySelectorAll('.overlay-menu button')).find(btn =>
                        btn.querySelector('.rec-icon-calendar')
                    );
                    if (button) resolve(button);
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Enter Dates button not found')), 2000))
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
            if (!await clickDate(start)) {
                console.log('Could not select start date - dates may be disabled');
                await clickBackButton();
                return false;
            }

            const end = new Date(endDate + 'T12:00:00Z');
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
