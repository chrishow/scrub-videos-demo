"use strict";

class ScrubVideoComponent extends HTMLElement {
    static observer = null;
    static activeVideoWrapper = null;
    static scrubVideoWrappers = new Set();
    static observedElements = new Set();
    static OVERSCRUB_AVOIDANCE_FACTOR = 0.99;

    constructor() {
        super();
        ScrubVideoComponent.maybeDoStaticInitialisation();
    }

    connectedCallback() {
        this.attachShadow({ mode: "open" });
        this.render();

        // Get the video element
        this.video = this.shadowRoot.querySelector("video");

        // Preload the video
        this.preloadVideo().then(() => {
            // Setup this scrub-video
            ScrubVideoComponent.observer.observe(this.shadowRoot.querySelector('.scrub-video-container'));
            ScrubVideoComponent.scrubVideoWrappers.add(this.shadowRoot.querySelector('.scrub-video-wrapper'));

            // Update the positions of all scrub-videos
            ScrubVideoComponent.updateWrappers();
        });

    }

    disconnectedCallback() {
        // If you were going to remove elements, you should update the
        // ScrubVideoComponent.scrubVideoWrappers set
        // We're not going to do that here, that's left as an exercise
    }

    attributeChangedCallback(name, oldValue, newValue) {
        // We're not supporting attribute changes in this component
    }


    static maybeDoStaticInitialisation() {
        if (!ScrubVideoComponent.observer) {
            ScrubVideoComponent.observer = new IntersectionObserver(ScrubVideoComponent.intersectionObserverCallback, { threshold: 1 });
            document.addEventListener("scroll", ScrubVideoComponent.handleScrollEvent);
            window.addEventListener("resize", ScrubVideoComponent.updateWrappers);
        }
    }

    static intersectionObserverCallback(entries, observer) {
        // console.log('Intersection observer callback', entries, observer);
        entries.forEach(entry => {
            const videoElement = entry.target.querySelector('video')[0];

            const isWithinViewport = entry.intersectionRatio === 1;
            // Add class 'in-view' to element if it is within the viewport
            entry.target.classList.toggle('in-view', isWithinViewport);

            if (isWithinViewport) {
                ScrubVideoComponent.activeVideoWrapper = entry.target.parentNode;
                // console.log('ScrubVideoComponent.activeVideoWrapper', ScrubVideoComponent.activeVideoWrapper);
                ScrubVideoComponent.handleScrollEvent();
            }
        });
    }

    static updateWrappers() {
        // Get new positions of video wrappers
        ScrubVideoComponent.scrubVideoWrappers.forEach((wrapper, index) => {
            const clientRect = wrapper.getBoundingClientRect();
            const { y, bottom } = clientRect; // Destructure for readability
            const wrapperTopPosition = y + window.scrollY;
            const wrapperBottomPosition = bottom - window.innerHeight + window.scrollY;

            wrapper.componentData = {
                lower: wrapperTopPosition,
                upper: wrapperBottomPosition,
                video: wrapper.getElementsByTagName('video')[0]
            };
        });

    };

    static handleScrollEvent(event) {
        if (ScrubVideoComponent.activeVideoWrapper) {
            const activeWrapperPosition = ScrubVideoComponent.activeVideoWrapper.componentData;
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
                this.video.classList.add('loaded');
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

            .scrub-video-wrapper {
                height: calc(100vh * var(--scrub-pages, 6));                
            }

            .scrub-video-container {
                position: sticky;
                top: 0px;
                height: 100vh;
                margin-left: var(--initial-margin-left, 5rem);
                margin-right: var(--initial-margin-right, 5rem);
                transition: all var(--zoom-duration, 0.2s);
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
                top: var(--initial-margin-top, 3rem);
                left: 0;
                width: 100%;
                height: calc(100% - var(--initial-margin-top, 3rem) - var(--initial-margin-bottom, 3rem));
                object-fit: cover;
                opacity: 0;
                transition: all var(--zoom-duration, 0.2s), opacity var(--load-fade-duration, 0.2s);
            }
            
            video.loaded {
                opacity: 1;
            }

        </style>
        <div class='scrub-video-wrapper'>
            <div class='scrub-video-container'>
                <video src='${this.src}' muted  playsinline></video>
            </div>
        </div>`;
    }

}

customElements.define("scrub-video", ScrubVideoComponent);