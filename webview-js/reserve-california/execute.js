(async function() {
                try {
                    const startDate = '{{startDateString}}';
                    const endDate = '{{endDateString}}';

                    console.log('JS Start Date:', startDate);
                    console.log('JS End Date:', endDate);

                    const success = await selectCampgroundDates(startDate, endDate);
                    debugger;
                    window.webkit.messageHandlers.dateSelector.postMessage({
                        success: success,
                        message: success ? 'Dates selected successfully' : 'Failed to select dates',
                        selectedDates: { start: startDate, end: endDate }
                    });
                } catch (error) {
                    console.error('Error:', error);
                    debugger;
                    window.webkit.messageHandlers.dateSelector.postMessage({
                        success: false,
                        message: 'Error: ' + error.toString(),
                        selectedDates: null
                    });
                }
            })();
