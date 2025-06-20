    async function selectCampgroundDates(startDate, endDate) {
        try {
            // Initial step: Wait for page to be ready
            await new Promise((resolve, reject) => {
                const waitForInitialElement = () => {
                    const searchBox = document.querySelector('.hidden.lg\\:flex.items-center.shadow-teal-input-shadow') ||
                                    document.querySelector('div:has(> span.truncate)');

                    if (searchBox) {
                        console.log('Page is ready');
                        resolve();
                        return true;
                    }
                    return false;
                };

                // Try immediately
                if (!waitForInitialElement()) {
                    // If not found, set up a mutation observer
                    const observer = new MutationObserver((mutations, obs) => {
                        if (waitForInitialElement()) {
                            obs.disconnect();
                        }
                    });

                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });

                    // Set timeout
                    setTimeout(() => {
                        observer.disconnect();
                        reject(new Error('Page not ready after timeout'));
                    }, 5000);
                }
            });

            // Small delay after page is ready
            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 1: Click search box
            await new Promise((resolve, reject) => {
                const searchBox = document.querySelector('.hidden.lg\\:flex.items-center.shadow-teal-input-shadow') ||
                                document.querySelector('div:has(> span.truncate)');

                if (searchBox) {
                    searchBox.click();
                    console.log('Clicked search box');
                    resolve();
                } else {
                    reject(new Error('Search box not found'));
                }
            });

            // Step 2: Wait for and click date picker button
            await new Promise((resolve, reject) => {
                const findDateButton = () => {
                    const dateButton = Array.from(document.querySelectorAll('button.shadow-teal-input-shadow')).find(btn => {
                        const hasCalendarIcon = btn.querySelector('g[id="Icons/calendar/primary-calendar"]');
                        const hasDateText = btn.querySelector('span.ml-2')?.textContent.match(/[A-Za-z]+,\s+[A-Za-z]+\s+\d+\s+-\s+[A-Za-z]+,\s+[A-Za-z]+\s+\d+/);
                        return hasCalendarIcon && hasDateText;
                    });

                    if (dateButton) {
                        dateButton.click();
                        console.log('Clicked date picker button');
                        resolve();
                        return true;
                    }
                    return false;
                };

                if (!findDateButton()) {
                    const observer = new MutationObserver((mutations, obs) => {
                        if (findDateButton()) {
                            obs.disconnect();
                        }
                    });

                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });

                    setTimeout(() => {
                        observer.disconnect();
                        reject(new Error('Date picker button not found after timeout'));
                    }, 5000);
                }
            });

            // Add a small delay before step 3
            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 3: Click the third date picker using exact provided code
            await new Promise((resolve, reject) => {
                const pathSelector = '#body > reach-portal:nth-child(24) > div:nth-child(3) > div > div > div > div > div > div:nth-child(3) > div:nth-child(1) > div:nth-child(2) > div > div > button';

                // Try the exact path first
                const buttonByPath = document.querySelector(pathSelector);
                if (buttonByPath) {
                    console.log('Found button by path');
                    buttonByPath.click();
                    resolve();
                    return;
                }

                // Fallback: try to find the button within any reach-portal
                const portals = document.querySelectorAll('reach-portal');
                for (const portal of portals) {
                    const buttonInPortal = portal.querySelector('.react-datepicker__input-container button');
                    if (buttonInPortal) {
                        console.log('Found button in portal');
                        buttonInPortal.click();
                        resolve();
                        return;
                    }
                }

                console.log('Date picker button not found');
                reject(new Error('Date picker button not found'));
            });

            // Add a small delay before attempting date selection
            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 4: Select date range
            async function selectDateRange(startDate, endDate) {
                // Helper function to wait for an element
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

                try {
                    // Wait for calendar to be visible
                    await waitForElement('.react-datepicker__month-container');

                    // Helper function to find a date cell
                    function findDateCell(year, month, day) {
                        // Find the month container for our target date
                        const monthContainer = Array.from(document.querySelectorAll('.react-datepicker__month-container'))
                            .find(container => {
                                const headerText = container.querySelector('.react-datepicker__current-month').textContent;
                                const [monthName, yearText] = headerText.trim().split(' ');
                                return monthName === new Date(year, month - 1).toLocaleString('en-US', { month: 'long' }) &&
                                       parseInt(yearText) === year;
                            });

                        if (!monthContainer) {
                            console.log(`Month container not found for ${year}-${month}`);
                            return null;
                        }

                        // Find the specific day within that month
                        const dateCell = monthContainer.querySelector(
                            `.react-datepicker__day--0${String(day).padStart(2, '0')}:not(.react-datepicker__day--outside-month):not(.react-datepicker__day--disabled)`
                        );

                        if (!dateCell) {
                            console.log(`Date cell not found for ${year}-${month}-${day}`);
                            return null;
                        }

                        return dateCell;
                    }

                    // Parse dates
                    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
                    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);

                    // Find and click start date
                    const startCell = findDateCell(startYear, startMonth, startDay);
                    if (!startCell) {
                        throw new Error('Start date not available');
                    }
                    console.log('Clicking start date:', startDate);
                    startCell.click();

                    // Brief wait between clicks
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Find and click end date
                    const endCell = findDateCell(endYear, endMonth, endDay);
                    if (!endCell) {
                        throw new Error('End date not available');
                    }
                    console.log('Clicking end date:', endDate);
                    endCell.click();

                    return true;
                } catch (error) {
                    console.error('Error selecting dates:', error);
                    return false;
                }
            }

            const dateSelectionResult = await selectDateRange(startDate, endDate);
            if (!dateSelectionResult) {
                throw new Error('Date selection failed');
            }

            // Add a small delay before attempting to select camping type
            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 5: Select "Camping" from dropdown
            await new Promise((resolve, reject) => {
                const findAndClickDropdown = () => {
                    // First find and click the dropdown button
                    const dropdownButton = document.querySelector('button.ae-select');
                    if (dropdownButton) {
                        dropdownButton.click();
                        console.log('Clicked dropdown button');

                        // Wait briefly for dropdown to open
                        setTimeout(() => {
                            // Find and click the "Camping" option
                            const campingOption = Array.from(document.querySelectorAll('.dropdown-menu.ae-show a'))
                                .find(option => option.textContent.includes('Camping') &&
                                             !option.textContent.includes('Group') &&
                                             !option.textContent.includes('Hook Up'));

                            if (campingOption) {
                                campingOption.click();
                                console.log('Selected Camping option');
                                resolve();
                                return true;
                            } else {
                                reject(new Error('Camping option not found'));
                                return false;
                            }
                        }, 250);
                        return true;
                    }
                    return false;
                };

                if (!findAndClickDropdown()) {
                    const observer = new MutationObserver((mutations, obs) => {
                        if (findAndClickDropdown()) {
                            obs.disconnect();
                        }
                    });

                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });

                    setTimeout(() => {
                        observer.disconnect();
                        reject(new Error('Dropdown button not found after timeout'));
                    }, 5000);
                }
            });

            // Add a small delay before looking for Show Results button
            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 6: Click Show Results button
            await new Promise((resolve, reject) => {
                const findShowResultsButton = () => {
                    const button = Array.from(document.querySelectorAll('button.btn.btn-teal'))
                        .find(btn => btn.textContent.trim() === 'Show Results');

                    if (button) {
                        button.click();
                        // Add a small delay before resolving to allow the datepicker to cleanup
                        setTimeout(() => {
                            console.log('Clicked Show Results button');
                            resolve();
                        }, 250);
                        return true;
                    }
                    return false;
                };

                if (!findShowResultsButton()) {
                    const observer = new MutationObserver((mutations, obs) => {
                        if (findShowResultsButton()) {
                            obs.disconnect();
                        }
                    });

                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });

                    setTimeout(() => {
                        observer.disconnect();
                        reject(new Error('Show Results button not found after timeout'));
                    }, 5000);
                }
            });

            // // Add a small delay before looking for search results
            // await new Promise(resolve => setTimeout(resolve, 750));

            // // Step 7: Click first search result
            // await new Promise((resolve, reject) => {
            //     const findSearchResult = () => {
            //         const searchResult = document.querySelector('a.flex.shadow-teal-input-shadow.rounded-lg.bg-white');

            //         if (searchResult) {
            //             searchResult.click();
            //             console.log('Clicked first search result');
            //             resolve();
            //             return true;
            //         }
            //         return false;
            //     };

            //     if (!findSearchResult()) {
            //         const observer = new MutationObserver((mutations, obs) => {
            //             if (findSearchResult()) {
            //                 obs.disconnect();
            //             }
            //         });

            //         observer.observe(document.body, {
            //             childList: true,
            //             subtree: true
            //         });

            //         setTimeout(() => {
            //             observer.disconnect();
            //             reject(new Error('Search result not found after timeout'));
            //         }, 5000);
            //     }
            // });

            return true;
        } catch (error) {
            console.error('Error in selectCampgroundDates:', error);
            return false;
        }
    }