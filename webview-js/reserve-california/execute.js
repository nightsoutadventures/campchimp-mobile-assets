(function() {
    try {
        const startDate = '{{startDateString}}';
        const endDate = '{{endDateString}}';

        console.log('JS Start Date:', startDate);
        console.log('JS End Date:', endDate);

        // Execute the date selection without returning the promise
        selectCampgroundDates(startDate, endDate)
            .then(success => {
                window.webkit.messageHandlers.dateSelector.postMessage({
                    success: success,
                    message: success ? 'Dates selected successfully' : 'Failed to select dates',
                    selectedDates: { start: startDate, end: endDate }
                });
            })
            .catch(error => {
                console.error('Error:', error);
                window.webkit.messageHandlers.dateSelector.postMessage({
                    success: false,
                    message: 'Error: ' + error.toString(),
                    stack: error.stack,
                    selectedDates: null
                });
            });
    } catch (error) {
        console.error('Error:', error);
        window.webkit.messageHandlers.dateSelector.postMessage({
            success: false,
            message: 'Error: ' + error.toString(),
            stack: error.stack,
            selectedDates: null
        });
    }
    
    // Return undefined instead of the promise
    return undefined;
})();
