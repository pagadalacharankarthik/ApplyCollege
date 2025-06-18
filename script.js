// Show counseling popup after 5 seconds
setTimeout(() => {
    document.getElementById('counselingPopup').style.display = 'block';
}, 5000);

// Close popup functionality
document.querySelector('.close-btn').addEventListener('click', () => {
    document.getElementById('counselingPopup').style.display = 'none';
});

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});