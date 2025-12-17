// Diets selected by filters
const selectedDiets = [];

// Filter checkboxes
const dietaryFilterSelector = '.dietary-filters input[type="checkbox"]';
const dietaryFilters = document.querySelectorAll(dietaryFilterSelector);

// Flavour count text
const flavoursCountText = document.getElementById('flavours-count-text');

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

// Allergen text
const allCakesContainText = document.getElementById('allergen-all-cakes-contain');
const nutsText = document.getElementById('allergen-nuts');
const soyaText = document.getElementById('allergen-soya');

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

        // Track flavour count for text
        let validFlavourCount = 0;
        
        // Track flavours with nuts/soya for allergen text
        let flavoursWithNuts = [];
        let flavoursWithSoya = [];

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

                        if (!flavourValid) {
                            // This is first valid variant for this flavour
                            flavourValid = true;

                            if (!variantDiets.includes('nut-free')) {
                                // Flavour contains nuts
                                flavoursWithNuts.push(flavourElement.getElementsByTagName('h3')[0].textContent);
                            }
                            if (!variantDiets.includes('soya-free')) {
                                // Flavour contains soya
                                flavoursWithSoya.push(flavourElement.getElementsByTagName('h3')[0].textContent);
                            }
                        }                        
                    } else {
                        variant.classList.remove(VARIANT_VALID_CLASS); 
                    }
                });

                // Update class for flavour
                if (flavourValid) {
                    flavourElement.classList.add(FLAVOUR_VALID_CLASS);

                    // Group contains at least one valid flavour
                    groupHasValidFlavours = true;
                    validFlavourCount++;
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


        // Update flavours count text
        const selectedDietsLabels = selectedDiets.map(diet => `<span>${document.querySelector(`${dietaryFilterSelector}[value="${diet}"]`).nextElementSibling.textContent}</span>`);
        const selectedDietsString = selectedDiets.length > 0 ? ` which ${validFlavourCount === 1 ? 'is' : 'are'} ${joinTextList(selectedDietsLabels)}` : '';
        flavoursCountText.innerHTML = validFlavourCount === 0 ? `There are no flavours ${selectedDietsString}.` : `Showing ${validFlavourCount} flavour${validFlavourCount !== 1 ? 's' : ''}${selectedDietsString}...`;


        // Update allergen text

        // "All cakes contain: ..." text
        let allCakesContainAllergens = [];
        if (!selectedDiets.includes('gluten-free')) {
            allCakesContainAllergens = allCakesContainAllergens.concat(['Gluten']);
        }
        if (!selectedDiets.includes('eggless')) {
            allCakesContainAllergens = allCakesContainAllergens.concat(['Eggs']);
        }
        if (!selectedDiets.includes('dairy-free')) {
            allCakesContainAllergens = allCakesContainAllergens.concat(['Dairy']);
        }
        if (allCakesContainAllergens.length > 0) {
            allCakesContainText.classList.add('text-valid');
            allCakesContainText.innerHTML = `All cakes contain: ${joinTextList(allCakesContainAllergens)}.`;
        } else {
            allCakesContainText.classList.remove('text-valid');
        }

        // Update "Nuts" text
        if (flavoursWithNuts.length > 0) {
            nutsText.classList.add('text-valid');
            nutsText.innerHTML = `The following flavours contain Nuts: ${joinTextList(flavoursWithNuts)}.`;
        } else {
            nutsText.classList.remove('text-valid');
        }

        // Update "Soya" text
        if (flavoursWithSoya.length > 0) {
            soyaText.classList.add('text-valid');
            soyaText.innerHTML = `The following flavours contain Soya: ${joinTextList(flavoursWithSoya)}.`;
        } else {
            soyaText.classList.remove('text-valid');
        }
    };
});

// Join list with commas and "and"
const joinTextList = (items) => {
    return items.length > 2 ? `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}` : items.join(' and ');
}