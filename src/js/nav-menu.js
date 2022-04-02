// Add onclick to nav toggler
document.getElementById('nav-toggle').onclick = function() {
	document.body.classList.toggle('nav-open');
	document.getElementsByTagName('nav')[0].classList.toggle('expand');
    document.getElementById('nav-toggle').classList.toggle('nav-open');
};