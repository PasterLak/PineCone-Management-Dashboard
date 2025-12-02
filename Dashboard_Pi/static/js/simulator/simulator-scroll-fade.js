// Manages adaptive fade effect for horizontally scrollable simulator bulk actions
class SimulatorScrollFade {
    constructor() {
        this.container = null;
        this.maxFadeSize = 40; // Maximum fade size in pixels
        this.fadeGrowthDistance = 300; // Distance to scroll to reach max fade
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.container = document.querySelector('.sim-controls');
            if (!this.container) return;

            this.updateFades();
            
            this.container.addEventListener('scroll', () => this.updateFades());
            window.addEventListener('resize', () => this.updateFades());
        });
    }

    updateFades() {
        if (!this.container) return;

        const { scrollLeft, scrollWidth, clientWidth } = this.container;
        
        const maxScroll = scrollWidth - clientWidth;
        const hasScroll = maxScroll > 1;
        
        if (!hasScroll) {
            this.container.style.setProperty('--fade-start-left', '0%');
            this.container.style.setProperty('--fade-end-right', '100%');
            return;
        }
        
        // LEFT FADE
        const leftGrowthProgress = Math.min(scrollLeft / this.fadeGrowthDistance, 1);
        const leftFadeSize = this.maxFadeSize * leftGrowthProgress;
        
        // RIGHT FADE
        const distanceFromEnd = maxScroll - scrollLeft;
        const rightGrowthProgress = Math.min(distanceFromEnd / this.fadeGrowthDistance, 1);
        const rightFadeSize = this.maxFadeSize * rightGrowthProgress;
        
        const leftFadePercent = leftFadeSize > 0 ? (leftFadeSize / clientWidth) * 100 : 0;
        const rightFadePercent = rightFadeSize > 0 ? 100 - (rightFadeSize / clientWidth) * 100 : 100;
        
        const fadeStartLeft = scrollLeft > 1 ? `${leftFadePercent}%` : '0%';
        const fadeEndRight = scrollLeft < maxScroll - 1 ? `${rightFadePercent}%` : '100%';
        
        this.container.style.setProperty('--fade-start-left', fadeStartLeft);
        this.container.style.setProperty('--fade-end-right', fadeEndRight);
    }
}

new SimulatorScrollFade();
