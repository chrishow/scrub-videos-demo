document.addEventListener("DOMContentLoaded", function () {
    new ScrubVideoManager();
}
);

function ScrubVideoManager() {
    let that = this;

    // Get a list of all scrub videos
    this.scrubVideoWrappers = document.querySelectorAll('.scrub-video-wrapper');
    this.scrubVideoWrappersPositions = [];

    // Create the intersectionObserver
    const observer = new IntersectionObserver(this.intersectionObserverCallback, { threshold: 1 });
    observer.context = this;

    this.scrubVideoWrappers.forEach((wrapper, index) => {
        // Attach observer
        observer.observe(wrapper.querySelector('.scrub-video-container'));

        // Give numerical index
        wrapper.setAttribute('data-scrub-video-index', index);

        // Force load video
        const video = wrapper.querySelector('video');
        const src = video.getAttribute('src');
        fetch(src)
            .then((response) => response.blob())
            .then((response) => {
                let blobURL = URL.createObjectURL(response);
                video.setAttribute("src", blobURL);
                video.classList.add('loaded');
                console.log('Finished loading ' + src);
            });
    });

    this.updateWrapperPositions();

    document.addEventListener("scroll", (event) => { that.handleScrollEvent(event); });
    window.addEventListener("resize", () => { that.updateWrapperPositions(); });
}

ScrubVideoManager.prototype.intersectionObserverCallback = function (entries, observer) {
    // console.log(observer.context);

    entries.forEach(entry => {
        const videoElement = entry.target.getElementsByTagName('video')[0];

        const isWithinViewport = entry.intersectionRatio === 1;
        // Add class 'in-view' to element if
        // it is within the viewport
        entry.target.classList.toggle('in-view', isWithinViewport);

        if (isWithinViewport) {
            observer.context.activeVideoWrapper = entry.target.parentNode.getAttribute('data-scrub-video-index');
        } else {
            observer.context.activeVideoWrapper = null;
        }
    });
};

ScrubVideoManager.prototype.updateWrapperPositions = function () {
    // Reset current positions 
    this.scrubVideoWrappersPositions = [];

    // Get new positions of video wrappers
    this.scrubVideoWrappers.forEach((wrapper, index) => {
        const clientRect = wrapper.getBoundingClientRect();
        const lower = clientRect.y + window.scrollY;
        const upper = clientRect.bottom - window.innerHeight + window.scrollY;

        this.scrubVideoWrappersPositions[index] = {
            lower: lower,
            upper: upper,
            video: wrapper.getElementsByTagName('video')[0]
        };
    });

};


ScrubVideoManager.prototype.handleScrollEvent = function (event) {
    if (this.activeVideoWrapper) {
        const activeWrapperPosition = this.scrubVideoWrappersPositions[this.activeVideoWrapper];
        const lower = activeWrapperPosition.lower;
        const upper = activeWrapperPosition.upper;
        const video = activeWrapperPosition.video;
        const progress = Math.max(Math.min((window.scrollY - lower) / (upper - lower), 0.998), 0);
        const seekTime = (progress * video.duration);

        // console.log(`${lower} > ${window.scrollY} (${progress}) [${seekTime}]  > ${upper}`);

        video.currentTime = seekTime;

    }
};

