document.addEventListener("DOMContentLoaded", function () {

    // This is just for the demo, not needed in production
    (() => {

        function formatBytes(bytes, decimals) {
            if (bytes == 0) return '0 Bytes';
            var k = 1024,
                dm = decimals || 2,
                sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
                i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        }

        const fileSizeObserver = new MutationObserver((mutationList) => {
            mutationList.forEach((mutation) => {
                switch (mutation.type) {
                    case "attributes":
                        switch (mutation.attributeName) {
                            case "contentlength":
                                console.log(mutation.target.getAttribute("contentLength"));
                                // Update file size
                                mutation.target.parentElement.parentElement.previousElementSibling.querySelector("span.size").textContent = formatBytes(mutation.target.getAttribute("contentLength"));
                                break;
                            default:
                                console.log(mutation);
                                break;
                        }
                        break;
                }
            });
        });

        document.querySelectorAll("video").forEach((video) => {
            fileSizeObserver.observe(video, {
                attributes: true,
                attributeFilter: ["contentlength"],
            });
        });


    })();


    new ScrubVideoManager();
});




function ScrubVideoManager() {
    let that = this;

    this.OVERSCRUB_AVOIDANCE_FACTOR = 0.99;

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
            .then((response) => {
                video.setAttribute("contentlength", response.headers.get("content-length"));
                return response.blob()
            })
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
        const progress = Math.max(Math.min((window.scrollY - lower) / (upper - lower), this.OVERSCRUB_AVOIDANCE_FACTOR), 0);
        const seekTime = (progress * video.duration);

        // console.log(`${lower} > ${window.scrollY} (${progress}) [${seekTime}]  > ${upper}`);

        video.currentTime = seekTime;

    }
};

