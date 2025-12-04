// Diets selected by filters
const selectedDiets = [];

// Filter checkboxes
const dietaryFilters = document.querySelectorAll('.dietary-filters input[type="checkbox"]');

// Flavours and their variants
const flavours = document.querySelectorAll('.flavour-row');
const variantsPerFlavour = [...flavours].map(flavour => ({ flavour, variants: flavour.querySelectorAll('.variant') }));

const FLAVOUR_VALID_CLASS = 'flavour-valid';
const VARIANT_VALID_CLASS = 'variant-valid';

// Event listeners for dietary filters which update visible flavours and variants
dietaryFilters.forEach(filter => {
    filter.onchange = () => {

        // Update `selectedDiets` array
        if (filter.checked && !selectedDiets.includes(filter.value)) {
            // Diet has just been selected
            selectedDiets.push(filter.value);
        } else if (!filter.checked && selectedDiets.includes(filter.value)) {
            // Diet has just been deselected
            const index = selectedDiets.indexOf(filter.value);
            selectedDiets.splice(index, 1);
        }

        // Update flavours and variants visibility
        variantsPerFlavour.forEach(({ flavour, variants }) => {

            // Is there at least one valid variant for this flavour?
            let flavourValid = false;

            variants.forEach(variant => {
                const variantDiets = variant.dataset.diets.split(";");

                let isValid = true;
                for (const diet of selectedDiets) {
                    if (!variantDiets.includes(diet)) {
                        // Variant does not meet selected diet
                        isValid = false;
                        break;
                    }
                }

                if (isValid) {
                    variant.classList.add(VARIANT_VALID_CLASS);

                    // Flavour contains at least one valid variant
                    flavourValid = true;
                } else {
                    variant.classList.remove(VARIANT_VALID_CLASS); 
                }
            });

            // Update class for flavour
            if (flavourValid) {
                flavour.classList.add(FLAVOUR_VALID_CLASS);
            } else {
                flavour.classList.remove(FLAVOUR_VALID_CLASS);
            }
        });
    };
});