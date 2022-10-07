const EXPANDED = 'expanded';

document.querySelectorAll('.question').forEach((element, index) => {
    const title = element.querySelector('h2');
    const answer = element.querySelector('.answer');

    title.setAttribute('aria-controls', `question${index}`);
    title.setAttribute('aria-expanded', 'false');
    answer.setAttribute('id', `question${index}`);

    const onClick = function() {
        const currentlyExpanded = title.getAttribute('aria-expanded') === 'true';
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