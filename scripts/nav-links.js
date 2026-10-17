const nav = document.getElementById('nav-links');
const moreBtn = document.getElementById('more');
const moreMenu = document.getElementById('more-menu');
const closeMenuBtn = document.getElementById('close-menu-btn');

moreBtn.addEventListener('click', () => {
    nav.style.display = 'none';
    moreMenu.style.display = 'flex';
});

closeMenuBtn.addEventListener('click', () => {
    nav.style.display = 'flex';
    moreMenu.style.display = 'none';
});