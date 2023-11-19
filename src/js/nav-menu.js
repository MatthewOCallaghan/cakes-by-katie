/* -------------------------------------------------------------------------- */
/*                                 Mobile nav                                 */
/* -------------------------------------------------------------------------- */

const NAV_OPEN_CLASS = 'nav-open';

// Add onclick to nav toggler
document.querySelector('#nav-toggle').onclick = function() {
	document.body.classList.toggle(NAV_OPEN_CLASS);
};

// Close nav menu when link to anchor clicked
document.querySelectorAll('nav a').forEach(element => {
	element.onclick = () => {
		if (element.href.includes(window.location.pathname)) {
			document.body.classList.remove(NAV_OPEN_CLASS);
		}	
	}
});


/* -------------------------------------------------------------------------- */
/*                                 Desktop nav                                */
/* -------------------------------------------------------------------------- */

const SUBMENU_OPEN_HEADER_ATTRIBUTE = 'data-nav-submenu';

// In px
// Value is also hardcoded in global.scss
const MOBILE_NAV_MAX_WIDTH = 1100;

document.querySelectorAll('#main-links > li').forEach((li, index) => {
	const button = li.querySelector('button');
	if (button) {
		const submenuId = index + 1;
		const header = document.querySelector('header');
		button.onclick = () => {
			const submenuOpen = parseInt(header.getAttribute(SUBMENU_OPEN_HEADER_ATTRIBUTE));
			if (submenuOpen === submenuId) {
				header.removeAttribute(SUBMENU_OPEN_HEADER_ATTRIBUTE);
			} else {
				header.setAttribute(SUBMENU_OPEN_HEADER_ATTRIBUTE, submenuId);
			}
		}

		let timeout;
		li.onmouseover = () => {
			if (window.innerWidth > MOBILE_NAV_MAX_WIDTH) {
				clearTimeout(timeout);
				header.setAttribute(SUBMENU_OPEN_HEADER_ATTRIBUTE, submenuId);
			}
		}
		li.onmouseleave = () => {
			if (window.innerWidth > MOBILE_NAV_MAX_WIDTH) {
				timeout = setTimeout(() => {
					const submenuOpen = parseInt(header.getAttribute(SUBMENU_OPEN_HEADER_ATTRIBUTE));
					if (submenuOpen === submenuId) {
						header.removeAttribute(SUBMENU_OPEN_HEADER_ATTRIBUTE);
					}
				}, 50);
			}
		}
	}
});