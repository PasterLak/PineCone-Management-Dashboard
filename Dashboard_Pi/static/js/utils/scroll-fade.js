// Universal scroll fade utility
class ScrollFade {
    constructor(container, options = {}) {
        this.container = container;
        this.direction = options.direction || 'vertical'; // 'horizontal' or 'vertical'
        this.maxFadeSize = options.maxFadeSize || 40;
        this.fadeGrowthDistance = options.fadeGrowthDistance || 300;
        
        this.init();
    }

    init() {
        if (!this.container) return;
        
        this.updateFades();
        this.container.addEventListener('scroll', () => this.updateFades());
        
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => this.updateFades());
            this.resizeObserver.observe(this.container);
        } else {
            window.addEventListener('resize', () => this.updateFades());
        }
    }

    updateFades() {
        if (!this.container) return;

        if (this.direction === 'horizontal') {
            this._updateHorizontalFades();
        } else {
            this._updateVerticalFades();
        }
    }

    _updateHorizontalFades() {
        const { scrollLeft, scrollWidth, clientWidth } = this.container;
        const maxScroll = scrollWidth - clientWidth;
        const hasScroll = maxScroll > 1;
        
        if (!hasScroll) {
            this.container.classList.remove('has-scroll-fade');
            return;
        }
        
        this.container.classList.add('has-scroll-fade');
        
        const leftGrowthProgress = Math.min(scrollLeft / this.fadeGrowthDistance, 1);
        const leftFadeSize = this.maxFadeSize * leftGrowthProgress;
        
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

    _updateVerticalFades() {
        const { scrollTop, scrollHeight, clientHeight } = this.container;
        const maxScroll = scrollHeight - clientHeight;
        const hasScroll = maxScroll > 1;
        
        if (!hasScroll) {
            this.container.classList.remove('has-scroll-fade');
            return;
        }
        
        this.container.classList.add('has-scroll-fade');
        
        const topGrowthProgress = Math.min(scrollTop / this.fadeGrowthDistance, 1);
        const topFadeSize = this.maxFadeSize * topGrowthProgress;
        
        const distanceFromBottom = maxScroll - scrollTop;
        const bottomGrowthProgress = Math.min(distanceFromBottom / this.fadeGrowthDistance, 1);
        const bottomFadeSize = this.maxFadeSize * bottomGrowthProgress;
        
        const topFadePercent = topFadeSize > 0 ? (topFadeSize / clientHeight) * 100 : 0;
        const bottomFadePercent = bottomFadeSize > 0 ? 100 - (bottomFadeSize / clientHeight) * 100 : 100;
        
        const fadeStartTop = scrollTop > 1 ? `${topFadePercent}%` : '0%';
        const fadeEndBottom = scrollTop < maxScroll - 1 ? `${bottomFadePercent}%` : '100%';
        
        this.container.style.setProperty('--fade-start-top', fadeStartTop);
        this.container.style.setProperty('--fade-end-bottom', fadeEndBottom);
    }

    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }
}
