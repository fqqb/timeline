import { ViewportMouseMoveEvent } from './events';
import { TimeLocator } from './TimeLocator';
import { Timenav } from './Timenav';


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

    constructor(timenav: Timenav) {
        super(timenav, () => this.time);
        this.lineColor = '#ccc';
        this.knobColor = '#ccc';
        this.lineDash = [4, 3];

        timenav.addEventListener('viewportmousemove', this.mouseMoveListener);
        timenav.addEventListener('viewportmouseout', this.mouseOutListener);
    }

    disconnectedCallback() {
        this.timenav.removeEventListener('viewportmousemove', this.mouseMoveListener);
        this.timenav.removeEventListener('viewportmouseout', this.mouseOutListener);
    }
}
