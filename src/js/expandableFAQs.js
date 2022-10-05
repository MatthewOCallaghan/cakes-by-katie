const EXPANDED = 'expanded';

document.querySelectorAll('.question').forEach((element, index) => {
    const title = element.querySelector('h2');
    const answer = element.querySelector('.answer');

    title.setAttribute('aria-controls', `question${index}`);
    title.setAttribute('aria-expanded', 'false');
    answer.setAttribute('id', `question${index}`);

    const onClick = function() {
        element.classList.toggle(EXPANDED);
        title.setAttribute('aria-expanded', title.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
    }

    title.onclick = onClick;
    title.onkeyup = function(event) {
        if (event.key === 'Enter') {
            onClick();
        }
    }
});