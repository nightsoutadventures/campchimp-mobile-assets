(function() {
    // Create dates in local timezone
    const startDate = new Date('{{startDateString}}T12:00:00.000Z');
    const endDate = new Date('{{endDateString}}T12:00:00.000Z');

    console.log('JS Start Date:', startDate.toISOString());
    console.log('JS End Date:', endDate.toISOString());

    // Execute the date selection without returning the promise
    selectCampingDates('{{startDateString}}', '{{endDateString}}')
        .then(success => {
            window.webkit.messageHandlers.dateSelector.postMessage({
                success: success,
                message: success ? 'Dates selected successfully' : 'Failed to select dates',
                selectedDates: {
                    start: startDate.toISOString(),
                    end: endDate.toISOString()
                }
            });
        })
        .catch(error => {
            window.webkit.messageHandlers.dateSelector.postMessage({
                success: false,
                message: 'Error: ' + error.toString(),
                stack: error.stack,
                selectedDates: null
            });
        });
    
    // Return undefined instead of the promise
    return undefined;
})();