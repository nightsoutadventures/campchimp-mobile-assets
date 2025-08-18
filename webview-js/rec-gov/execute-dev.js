(function() {
    // Create dates in local timezone
    const startDate = new Date('{{startDateString}}T12:00:00.000Z');
    const endDate = new Date('{{endDateString}}T12:00:00.000Z');
    const equipmentType = '{{equipmentType}}';
    const equipmentLength = '{{equipmentLength}}';

    console.log('JS Start Date:', startDate.toISOString());
    console.log('JS End Date:', endDate.toISOString());
    console.log('JS Equipment Type:', equipmentType);
    console.log('JS Equipment Length:', equipmentLength);

    // Execute the date selection without returning the promise
    selectCampingDates('{{startDateString}}', '{{endDateString}}', equipmentType, equipmentLength)
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