import { TimeLocator } from './TimeLocator';
import { Timenav } from './Timenav';


export class MouseTracker extends TimeLocator {

    private time?: number;

    constructor(timenav: Timenav) {
        super(timenav, () => this.time);
        this.lineColor = '#ccc';
        this.knobColor = '#ccc';
        this.lineDash = [4, 3];

        timenav.addEventListener('viewportmousemove', evt => {
            if (evt.time !== this.time) {
                this.time = evt.time;
                this.reportMutation();
            }
        });
        timenav.addEventListener('viewportmouseout', () => {
            this.time = undefined;
            this.reportMutation();
        });
    }
}
