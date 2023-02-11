const EXPANDED = 'expanded';

document.querySelectorAll('.question').forEach((element, index) => {
    const title = element.querySelector('h2');
    const answer = element.querySelector('.answer');

    title.setAttribute('aria-controls', `question${index}`);
    title.setAttribute('aria-expanded', 'false');
    answer.setAttribute('id', `question${index}`);

    const onClick = function() {
        const currentlyExpanded = title.getAttribute('aria-expanded') === 'true';

        // If expanding, check if any other question is expanded
        if (!currentlyExpanded) {
            const expandedTitle = document.querySelector('h2[aria-expanded=true]');
            // If another question is expanded, close it
            if (expandedTitle) {
                expandedTitle.setAttribute('aria-expanded', false);
                expandedTitle.closest('.question').classList.toggle(EXPANDED);
            }
        }

        element.classList.toggle(EXPANDED);
        title.setAttribute('aria-expanded', currentlyExpanded ? 'false' : 'true');

        if (!currentlyExpanded) {
            gtag?.('event', 'expand_faq', {
                question: title.innerText
            });
        }
    }

    title.onclick = onClick;
    title.onkeyup = function(event) {
        if (event.key === 'Enter') {
            onClick();
        }
    }
});