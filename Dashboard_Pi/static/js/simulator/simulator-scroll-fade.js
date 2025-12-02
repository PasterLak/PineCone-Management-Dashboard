// Manages adaptive fade effect for horizontally scrollable simulator bulk actions
document.addEventListener('DOMContentLoaded', () => {
    const simControls = document.querySelector('.sim-controls');
    if (simControls) {
        new ScrollFade(simControls, {
            direction: 'horizontal',
            maxFadeSize: 40,
            fadeGrowthDistance: 300
        });
    }
});
