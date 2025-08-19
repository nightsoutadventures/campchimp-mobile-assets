console.log('Using Reserve California execute.js');

(function() {
    try {
        const startDate = '{{startDateString}}';
        const endDate = '{{endDateString}}';
        const equipmentType = '{{equipmentType}}';
        const equipmentLength = '{{equipmentLength}}';

        console.log('JS Start Date:', startDate);
        console.log('JS End Date:', endDate);
        console.log('JS Equipment Type:', equipmentType);
        console.log('JS Equipment Length:', equipmentLength);
        console.log('JS Equipment Type length:', equipmentType?.length);
        console.log('JS Equipment Type trimmed:', equipmentType?.trim());

        if (equipmentType && equipmentType.trim() !== '') {
            console.log('JS: Equipment filters detected:', { equipmentType, equipmentLength });
        }

        // Execute the date selection without returning the promise
        selectCampgroundDates(startDate, endDate, equipmentType, equipmentLength)
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
