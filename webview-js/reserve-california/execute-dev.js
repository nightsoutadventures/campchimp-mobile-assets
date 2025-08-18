// DEVELOPMENT VERSION - This file is used for Xcode debug builds only
console.log('🔧 Using Reserve California execute-dev.js (Development Build)');

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

        // TEMPORARY: Send equipment info to iOS if not empty
        if (equipmentType && equipmentType.trim() !== '') {
            window.webkit.messageHandlers.dateSelector.postMessage({
                success: true,
                message: `Equipment filters detected: Type=${equipmentType}, Length=${equipmentLength || 'N/A'}`,
                equipmentInfo: { type: equipmentType, length: equipmentLength }
            });
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
