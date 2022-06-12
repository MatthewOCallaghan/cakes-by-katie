const NAV_OPEN_CLASS = 'nav-open';

// Add onclick to nav toggler
document.querySelector('#nav-toggle').onclick = function() {
	document.body.classList.toggle(NAV_OPEN_CLASS);
};

// Close nav menu when link to anchor clicked
document.querySelectorAll('nav a').forEach(element => {
	element.onclick = () => {
		if (element.href.includes(window.location.pathname)) {
			console.log('close')
			document.body.classList.remove(NAV_OPEN_CLASS);
		}	
	}
});