// Manages the grid of portfolio images

const container = document.getElementsByClassName('portfolio-grid')[0];

const items = document.getElementsByClassName('grid-item');

// Add `image-loaded` class to each item when its image loads
// CSS will then fade it in
for (const item of items) {
    const onLoad = () => {
        item.classList.add('image-loaded');
    }
    const image = item.getElementsByTagName('img')[0];
    if (image.complete) {
        onLoad();
    } else {
        image.addEventListener('load', onLoad);
    }
}

// Gap between images in px
const GUTTER = 5;

// Function to position grid items
// Uses absolute positioning to create masonry layout
const positionItems = () => {
    // Available width
    const containerWidth = container.clientWidth;
    
    // Number of columns
    // Minimum of 3
    // Aims for each column to be ~200px wide
    const columns = Math.max(3, Math.round(containerWidth / 200));

    // Calculate item width
    // Item width = (Container width - total gutter width) / number of columns
    //            = (Container width - (number of gutters * gutter width)) / number of columns
    const itemWidth = (containerWidth - ((columns - 1) * GUTTER)) / columns;

    // Width CSS to apply to each item
    const itemWidthCSS = `calc((100% - (${columns - 1} * ${GUTTER}px)) / ${columns})`;

    // Array of column heights
    // This gets added to by iteration below
    const columnHeights = new Array(columns).fill(0);

    // Iterate over each item
    for (let index = 0; index < items.length; index++) {
        const item = items[index];

        // Set item width
        item.style.width = itemWidthCSS;

        // Index of the column to add this item to
        // Choose whichever column is currently smallest
        const columnIndex = columnHeights.indexOf(Math.min(...columnHeights));

        // Each item already has an aspect ratio applied based on its image
        // Use this to calculate its height (height = width / aspect ratio)
        const itemHeight = itemWidth / parseFloat(item.style.aspectRatio);

        // Add top and left values to position item
        // Column height in array already includes top gutter
        item.style.top = `${columnHeights[columnIndex]}px`;
        item.style.left = `${columnIndex * (itemWidth + GUTTER)}px`;

        // Add to relevant element in array of column heights
        columnHeights[columnIndex] += itemHeight + GUTTER;
    }

    // Set container height to equal the largest column
    container.style.height = `${Math.max(...columnHeights)}px`;
}

// Position items initially
positionItems();

// Add `grid-initialised` class when the layout has been worked out
// CSS will not show the grid until it is ready
container.classList.add('grid-initialised');

// Recalculate grid whenever window changes size
window.addEventListener('resize', positionItems);