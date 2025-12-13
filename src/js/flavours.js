// Diets selected by filters
const selectedDiets = [];

// Filter checkboxes
const dietaryFilters = document.querySelectorAll('.dietary-filters input[type="checkbox"]');

// Flavours and their variants
const groupContainers = document.querySelectorAll('.flavour-group');
const groups = [...groupContainers].map(groupDiv => {
    
    const flavours = groupDiv.querySelectorAll('.flavour');
    return {
        element: groupDiv,
        flavours: [...flavours].map(flavours => ({
            element: flavours,
            variants: flavours.querySelectorAll('.variant')
        }))
    };
});

const GROUP_VALID_CLASS = 'group-valid';
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

        // Update groups/flavours/variants visibility
        groups.forEach(({ element: groupElement, flavours }) => {

            // Does this group have at least one valid flavour?
            let groupHasValidFlavours = false;

            flavours.forEach(({ element: flavourElement, variants }) => {

                // Is there at least one valid variant for this flavour?
                let flavourValid = false;

                variants.forEach(variant => {
                    const variantDiets = variant.dataset.diets.split(";");

                    let variantValid = true;
                    for (const diet of selectedDiets) {
                        if (!variantDiets.includes(diet)) {
                            // Variant does not meet selected diet
                            variantValid = false;
                            break;
                        }
                    }

                    if (variantValid) {
                        variant.classList.add(VARIANT_VALID_CLASS);

                        // Flavour contains at least one valid variant
                        flavourValid = true;
                    } else {
                        variant.classList.remove(VARIANT_VALID_CLASS); 
                    }
                });

                // Update class for flavour
                if (flavourValid) {
                    flavourElement.classList.add(FLAVOUR_VALID_CLASS);

                    // Group contains at least one valid flavour
                    groupHasValidFlavours = true;
                } else {
                    flavourElement.classList.remove(FLAVOUR_VALID_CLASS);
                }
            });

            // Update class for group
            if (groupHasValidFlavours) {
                groupElement.classList.add(GROUP_VALID_CLASS);
            } else {
                groupElement.classList.remove(GROUP_VALID_CLASS);
            }
        });
    };
});