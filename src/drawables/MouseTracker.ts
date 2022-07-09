import { Timeline, ViewportMouseMoveEvent } from '../Timeline';
import { TimeLocator } from './TimeLocator';


/**
 * Displays a vertical bar matching the time where the mouse is hovering.
 */
export class MouseTracker extends TimeLocator {

    private mouseMoveListener = (evt: ViewportMouseMoveEvent) => {
        if (evt.time !== this.time) {
            this.time = evt.time;
            this.reportMutation();
        }
    };
    private mouseLeaveListener = () => {
        this.time = undefined;
        this.reportMutation();
    };

    /**
     * @param timeline Timeline instance that this drawable is bound to.
     */
    constructor(timeline: Timeline) {
        super(timeline);
        this.lineColor = '#cccccc';
        this.knobColor = '#cccccc';
        this.lineDash = [4, 3];

        timeline.addViewportMouseMoveListener(this.mouseMoveListener);
        timeline.addViewportMouseLeaveListener(this.mouseLeaveListener);
    }

    disconnectedCallback() {
        this.timeline.removeViewportMouseMoveListener(this.mouseMoveListener);
        this.timeline.removeViewportMouseLeaveListener(this.mouseLeaveListener);
    }
}
