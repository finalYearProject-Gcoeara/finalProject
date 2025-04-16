(function() {
    const thumbnails = document.querySelectorAll('img._0DkuPH');
    let index = 0;

    function hoverNextThumbnail() {
        if (index >= thumbnails.length) {
            clearInterval(hoverInterval);
            console.log('Completed hovering over all thumbnails.');
            return;
        }

        const thumbnail = thumbnails[index];
        const event = new MouseEvent('mouseover', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        thumbnail.dispatchEvent(event);
        console.log(`Hovered over thumbnail ${index + 1}`);
        index++;
    }

    const hoverInterval = setInterval(hoverNextThumbnail, 1000);
})();
