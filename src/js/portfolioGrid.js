// Manages the grid of portfolio images

const pageContainer = document.querySelector('.portfolio-grid-container');

const gridContainer = document.getElementsByClassName('portfolio-grid')[0];

const items = document.getElementsByClassName('grid-item');

// Filters
// Filters are multi-choice with values separated by commas
const ATTRIBUTE_FILTERS_PRODUCT = 'data-filters-product';
const ATTRIBUTE_FILTERS_OCCASION = 'data-filters-occasion';
const getFilteredProducts = () => pageContainer.getAttribute(ATTRIBUTE_FILTERS_PRODUCT)?.split(',') ?? [];
const getFilteredOccasions = () => pageContainer.getAttribute(ATTRIBUTE_FILTERS_OCCASION)?.split(',') ?? [];

// Gap between images in px
const GUTTER = 5;

// We only render <picture> elements within item buttons when they are close to being visible
// This is so we don't load all images are once
// This function creates the <picture> element within a button
const createPictureForItem = item => {
    // Only create <picture> element if we haven't already done so
    // For example, this function can be called repeatedly for the same item when the screen is resized
    if (!item.querySelector('picture')) {
        createPictureElement(item, JSON.parse(item.getAttribute('data-images').split(';')[0]).src, item.getAttribute('data-name'), '230px');
        
        // Add `image-loaded` class to item when its image loads
        // CSS will then fade it in
        const onLoad = () => {
            item.classList.add('image-loaded');
        }
        const image = item.querySelector('img');
        if (image.complete) {
            onLoad();
        } else {
            image.addEventListener('load', onLoad);
        }
    }
}

// Next item index (out of filtered items) that hasn't had an image created yet
// Remember items will be rendered in order vertically as they get added in turn to the shortest column
let nextItemToLoadImage = 0;
// Function to check if any more images need to be created from screen height and scroll position
const createItemImagesIfWithinScroll = () => {

    // Only filtered items are visible
    const filteredItems = Array.from(items).filter(item => item.classList.contains('filtered'));

    if (nextItemToLoadImage < filteredItems.length) {
        // Items with `top` values less than this boundary should have images
        const boundary = window.scrollY + window.innerHeight * 2;

        for (const item of filteredItems.slice(nextItemToLoadImage)) {
            const top = parseInt(item.style.top);
            if (top < boundary) {
                createPictureForItem(item);
                nextItemToLoadImage++;
            } else {
                break;
            }
        }
    }
}

// Function to position grid items
// Uses absolute positioning to create masonry layout
const initialiseGrid = () => {
    // Available width
    const containerWidth = gridContainer.clientWidth;
    
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

    // Reset variable
    nextItemToLoadImage = 0;

    // Filter values
    const filteredProducts = getFilteredProducts();
    const filteredOccasions = getFilteredOccasions();

    // Iterate over each item
    for (let index = 0; index < items.length; index++) {
        const item = items[index];

        const product = item.getAttribute('data-product');
        const occasions = item.getAttribute('data-occasions')?.split(',');
        if (
            (filteredProducts.length > 0 && !filteredProducts.includes(product)) ||
            (filteredOccasions.length > 0 && !filteredOccasions.some(occasion => occasions.includes(occasion)))
        ) {
            // Filters are being used and this item does not match
            item.classList.remove('filtered');
            item.querySelector('picture')?.remove();
            continue;
        }

        // To get this far, the item must match the filters
        item.classList.add('filtered');

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
        const top = columnHeights[columnIndex];
        item.style.top = `${top}px`;
        item.style.left = `${columnIndex * (itemWidth + GUTTER)}px`;

        // Add to relevant element in array of column heights
        columnHeights[columnIndex] += itemHeight + GUTTER;
    }

    // Set container height to equal the largest column
    gridContainer.style.height = `${Math.max(...columnHeights)}px`;

    // Create initial images
    createItemImagesIfWithinScroll();
}

// Position items initially
initialiseGrid();

// Add `grid-initialised` class when the layout has been worked out
// CSS will not show the grid until it is ready
gridContainer.classList.add('grid-initialised');

// Create further images as needed when user scrolls
window.addEventListener('scroll', createItemImagesIfWithinScroll);

// Recalculate grid whenever window changes size
window.addEventListener('resize', initialiseGrid);

// Product filter button handlers
const productFilterButtons = document.querySelectorAll('#portfolio-filters button');
productFilterButtons.forEach(button => {
    button.onclick = function() {

        const product = button.getAttribute('data-product');

        // Logic supports multiple selected products in attribute (separated by commas), but UI only allows one at a time for now
        if (product) {
            pageContainer.setAttribute(ATTRIBUTE_FILTERS_PRODUCT, product);
        } else {
            // "All cakes" button
            pageContainer.removeAttribute(ATTRIBUTE_FILTERS_PRODUCT);
        }

        initialiseGrid();
    };
});

// Logic has been implemented to support occasion filters, but UI does not currently have any buttons for this
// const anniversaryFilterButton = document.querySelector('#portfolio-filters button#portfolio-filter-occasion');
// anniversaryFilterButton.onclick = function() {
    
//     const OCCASION = 'anniversary';
//     const currentFilteredOccasions = getFilteredOccasions();

//     let newFilteredOccasions;
//     if (currentFilteredOccasions.includes(OCCASION)) {
//         newFilteredOccasions = currentFilteredOccasions.filter(occasion => occasion !== OCCASION);
//     } else {
//         newFilteredOccasions = [...currentFilteredOccasions, OCCASION];
//     }

//     if (newFilteredOccasions.length > 0) {
//         pageContainer.setAttribute(ATTRIBUTE_FILTERS_OCCASION, newFilteredOccasions.join(','));
//     } else {
//         pageContainer.removeAttribute(ATTRIBUTE_FILTERS_OCCASION);
//     }

//     initialiseGrid();
// }