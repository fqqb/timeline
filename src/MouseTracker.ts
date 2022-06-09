import { ViewportMouseMoveEvent } from './events';
import { Timeline } from './Timeline';
import { TimeLocator } from './TimeLocator';


/**
 * Displays a vertical bar matching the time where the mouse is hovering.
 */
export class MouseTracker extends TimeLocator {

    private time?: number;

    private mouseMoveListener = (evt: ViewportMouseMoveEvent) => {
        if (evt.time !== this.time) {
            this.time = evt.time;
            this.reportMutation();
        }
    };
    private mouseOutListener = () => {
        this.time = undefined;
        this.reportMutation();
    };

    /**
     * @param timeline Timeline instance that this drawable is bound to.
     */
    constructor(timeline: Timeline) {
        super(timeline, () => this.time);
        this.lineColor = '#cccccc';
        this.knobColor = '#cccccc';
        this.lineDash = [4, 3];

        timeline.addViewportMouseMoveListener(this.mouseMoveListener);
        timeline.addViewportMouseOutListener(this.mouseOutListener);
    }

    /** @hidden */
    disconnectedCallback() {
        this.timeline.removeViewportMouseMoveListener(this.mouseMoveListener);
        this.timeline.removeViewportMouseOutListener(this.mouseOutListener);
    }
}
