"use strict";

class ScrubVideoComponent extends HTMLElement {
    static observer = null;
    static activeVideoComponent = null;
    static scrubVideos = new Set();
    static observedElements = new Set();
    static OVERSCRUB_AVOIDANCE_FACTOR = 0.99;


    constructor() {
        super();
        ScrubVideoComponent.maybeDoStaticInitialisation();
    }

    connectedCallback() {
        this.attachShadow({ mode: "open" });

        this.minWidth = this.getAttribute('min-width') || 0;
        if (this.minWidth) {
            if (window.innerWidth >= this.minWidth) {
                this.loadAndObserve();
            } else {
                this.style.display = 'none';
                this.isHidden = true
            }
        } else {
            this.loadAndObserve();
        }
        ScrubVideoComponent.scrubVideos.add(this);
    }

    loadAndObserve() {
        this.render();
        this.componentData = {};

        this.zoomDuration = parseFloat(getComputedStyle(this).getPropertyValue('--zoom-duration') || '0.2s');

        // Get the video element
        this.video = this.shadowRoot.querySelector("video");

        // Preload the video
        this.preloadVideo().then(() => {
            // Setup this scrub-video
            const videoContainer = this.shadowRoot.querySelector('.scrub-video-container');

            // Add a reference to this scrub-video component to the video container,
            // we'll need it later in the scroll event handler
            videoContainer.scrubVideoComponent = this;

            ScrubVideoComponent.observer.observe(videoContainer);
            ScrubVideoComponent.observedElements.add(this);

            // Update the positions of all scrub-videos
            ScrubVideoComponent.updateScrubVideos();
        });

    }

    disconnectedCallback() {
        // If you were going to remove elements, you should update the
        // ScrubVideoComponent.scrubVideos set
        // We're not going to do that here, that's left as an exercise
    }

    static maybeDoStaticInitialisation() {
        if (!ScrubVideoComponent.observer) {
            ScrubVideoComponent.observer = new IntersectionObserver(ScrubVideoComponent.intersectionObserverCallback, { threshold: 1 });
            document.addEventListener("scroll", ScrubVideoComponent.handleScrollEvent);
            window.addEventListener("resize", ScrubVideoComponent.updateScrubVideos);
        }
    }

    static intersectionObserverCallback(entries, observer) {
        entries.forEach(entry => {
            const isWithinViewport = entry.intersectionRatio === 1;
            // Add class 'in-view' to element if it is within the viewport
            entry.target.classList.add('animating');
            entry.target.classList.toggle('in-view', isWithinViewport);

            // Remove the animation class after we're done zooming in or out
            const delay = entry.target.scrubVideoComponent.zoomDuration * 1000;
            setTimeout(() => {
                entry.target.classList.remove('animating');
            }, delay);

            if (isWithinViewport) {
                ScrubVideoComponent.activeVideoComponent = entry.target.scrubVideoComponent;
                ScrubVideoComponent.handleScrollEvent();
            }
        });
    }

    static updateScrubVideos() {
        // Get new positions of scrub video components
        ScrubVideoComponent.scrubVideos.forEach((videoComponent, index) => {
            const clientRect = videoComponent.getBoundingClientRect();
            const { y, bottom } = clientRect;
            const videoComponentTopPosition = y + window.scrollY;
            const videoComponentBottomPosition = bottom - window.innerHeight + window.scrollY;

            if (videoComponent.minWidth && window.innerWidth < videoComponent.minWidth) {
                videoComponent.style.display = 'none';
                videoComponent.isHidden = true;
            } else if (videoComponent.isHidden && window.innerWidth >= videoComponent.minWidth) {
                videoComponent.style.display = 'block';
                videoComponent.isHidden = false;
                if (!ScrubVideoComponent.observedElements.has(videoComponent)) {
                    videoComponent.loadAndObserve();
                }
            }

            videoComponent.componentData = {
                lower: videoComponentTopPosition,
                upper: videoComponentBottomPosition,
                video: videoComponent.shadowRoot.querySelector('video')
            };
        });

    };

    static handleScrollEvent(event) {
        if (ScrubVideoComponent.activeVideoComponent) {
            const activeWrapperPosition = ScrubVideoComponent.activeVideoComponent.componentData;
            const { lower, upper, video } = activeWrapperPosition;

            // Calculate the scroll progress within the active video wrapper
            const progress = Math.max(Math.min((window.scrollY - lower) / (upper - lower), ScrubVideoComponent.OVERSCRUB_AVOIDANCE_FACTOR), 0);
            const seekTime = (progress * video.duration);

            // console.log(`${wrapperTopPosition} > ${window.scrollY} (${progress}) [${seekTime}] duration: ${video.duration} > ${wrapperBottomPosition}`);
            if (isFinite(seekTime) && !isNaN(video.duration)) {
                video.currentTime = seekTime;
            }
        }
    };

    preloadVideo() {
        return fetch(this.src)
            .then((response) => {
                return response.blob()
            })
            .then((response) => {
                let blobURL = URL.createObjectURL(response);
                this.video.setAttribute("src", blobURL);
                this.classList.add('video-loaded');
            });
    }

    render() {
        this.src = this.getAttribute('src');

        // Is there are Firefox=only src?
        let firefoxSrc = this.getAttribute('firefox-src');
        if (firefoxSrc) {
            // Is this Firefox?
            const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
            if (isFirefox) {
                this.src = firefoxSrc;
            }
        }


        this.shadowRoot.innerHTML = `
        <style>
            :host {
                display: block;
            }

            :host(.video-loaded) {
                height: calc(100vh * var(--scrub-pages, 6));
            }

            :host(.video-loaded) video {
                opacity: 1;
            }
            
            .scrub-video-container {
                position: sticky;
                top: 0px;
                height: 100vh;
                margin-left: var(--unzoomed-margin-left, 5rem);
                margin-right: var(--unzoomed-margin-right, 5rem);                
            }
            
            .scrub-video-container.animating {
                transition: all var(--zoom-duration, 0.2s);
            }

            .scrub-video-container.animating video {
                transition: all var(--zoom-duration, 0.2s), opacity var(--load-fade-duration, 0.2s);
            }

            .scrub-video-container.in-view {
                margin: 0;
            }

            .scrub-video-container.in-view video {
                top: 0;
                height: 100%;
            }

            video {
                position: absolute;
                top: var(--unzoomed-margin-top, 3rem);
                left: 0;
                width: 100%;
                height: calc(100% - var(--unzoomed-margin-top, 3rem) - var(--unzoomed-margin-bottom, 3rem));
                object-fit: cover;
                opacity: 0;
                transition: opacity var(--load-fade-duration, 0.2s);
            }
            
        </style>
        <div class='scrub-video-container'>
            <video src='${this.src}' muted  playsinline></video>
        </div>`;
    }

}

customElements.define("scrub-video", ScrubVideoComponent);