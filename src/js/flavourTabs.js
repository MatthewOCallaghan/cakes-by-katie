const flavoursMenu = document.querySelector('.flavours-menu');

const variants = ['standard', 'gluten-free', 'dairy-free', 'vegan']

variants.forEach(selectedVariant => {
    document.querySelector(`#${selectedVariant}-button`).onclick = () => {
        variants.forEach(variant => {
            if (variant === selectedVariant) {
                flavoursMenu.classList.add(variant);
            } else {
                flavoursMenu.classList.remove(variant);
            }
        });
    }
});