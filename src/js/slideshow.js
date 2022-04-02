const SELECTED_INDICATOR_CLASS = 'selected';

let index = 0;

const length = document.querySelectorAll('.slideshow .item').length;

document.querySelector('.slideshow .indicators button').classList.toggle(SELECTED_INDICATOR_CLASS);

const updateSlideshow = () => {
    document.querySelector('.slideshow .reel').style.transform = `translateX(${(100 / length) * -index}%)`;

    // Stop highlighting previous indicator
    document.querySelector(`.slideshow .indicators button.${SELECTED_INDICATOR_CLASS}`).classList.remove(SELECTED_INDICATOR_CLASS);

    // Start highlighting new indicator
    document.querySelectorAll('.slideshow .indicators button')[index].classList.add(SELECTED_INDICATOR_CLASS);
}

const setIndex = (newIndex) => {
    if (index !== newIndex) {
        index = newIndex;
        if (index >= length) {
            index = 0;
        }
        if (index < 0) {
            index = length - 1;
        }
        updateSlideshow();
    }
}

const setIndexOnClick = newIndex => {
    setIndex(newIndex);
    restartInterval();
}

let interval;

const restartInterval = () => {
    if (interval) {
        clearInterval(interval);
    }
    interval = setInterval(() => setIndex(index + 1), 15000);
}

restartInterval();

// Add onclick to buttons
document.getElementsByClassName('slideshow-forward')[0].onclick = () => setIndexOnClick(index + 1);

document.getElementsByClassName('slideshow-back')[0].onclick = () => setIndexOnClick(index - 1);

document.querySelectorAll('.slideshow .indicators button').forEach((button, index) => {
    button.onclick = () => setIndexOnClick(index);
})