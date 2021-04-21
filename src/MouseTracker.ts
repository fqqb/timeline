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

    constructor(timeline: Timeline) {
        super(timeline, () => this.time);
        this.lineColor = '#ccc';
        this.knobColor = '#ccc';
        this.lineDash = [4, 3];

        timeline.addEventListener('viewportmousemove', this.mouseMoveListener);
        timeline.addEventListener('viewportmouseout', this.mouseOutListener);
    }

    disconnectedCallback() {
        this.timeline.removeEventListener('viewportmousemove', this.mouseMoveListener);
        this.timeline.removeEventListener('viewportmouseout', this.mouseOutListener);
    }
}
