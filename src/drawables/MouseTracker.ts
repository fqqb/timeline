import { Graphics } from '../graphics/Graphics';
import { Path } from '../graphics/Path';
import { Point } from '../graphics/Point';
import { Timeline } from '../Timeline';
import { ViewportMouseMoveEvent } from '../ViewportMouseMoveEvent';
import { LinePlot } from './line-plot/LinePlot';
import { TimeLocator } from './TimeLocator';


/**
 * Displays a vertical bar matching the time where the mouse is hovering.
 */
export class MouseTracker extends TimeLocator {

    private _trackX: boolean = true;
    private _trackY: boolean = false;

    private hoveredY?: number;

    private mouseMoveListener = (evt: ViewportMouseMoveEvent) => {
        if (evt.time !== this.time) {
            this.time = evt.time;
            this.reportMutation();
        }
        const newY = (evt.band instanceof LinePlot) ? evt.y : undefined;
        if (newY !== this.hoveredY) {
            this.hoveredY = newY;
            this.reportMutation();
        }
    };
    private mouseLeaveListener = () => {
        if (this.time !== undefined) {
            this.time = undefined;
            this.reportMutation();
        }
        if (this.hoveredY !== undefined) {
            this.hoveredY = undefined;
            this.reportMutation();
        }
    };

    /**
     * @param timeline Timeline instance that this drawable is bound to.
     */
    constructor(timeline: Timeline) {
        super(timeline);
        this.lineColor = '#cccccc';
        this.knobColor = '#cccccc';
        this.knobRadius = 0;
        this.lineWidth = 2;
        this.lineDash = [6, 2];

        timeline.addViewportMouseMoveListener(this.mouseMoveListener);
        timeline.addViewportMouseLeaveListener(this.mouseLeaveListener);
    }

    override drawOverlay(g: Graphics): void {
        if (this.trackX) {
            super.drawOverlay(g);
        }
        if (this.trackY && this.hoveredY !== undefined) {
            const y = Math.round(this.hoveredY);
            const left: Point = { x: 0, y };
            const right: Point = { x: g.width, y };
            g.strokePath({
                color: this.lineColor,
                lineWidth: this.lineWidth,
                dash: this.lineDash,
                path: new Path(left.x, left.y + 0.5).lineTo(right.x, right.y + 0.5),
            });
        }
    }

    /**
     * Whether to track position on the X-axis (time)
     */
    get trackX() { return this._trackX; }
    set trackX(trackX: boolean) {
        this._trackX = trackX;
    }

    /**
     * Whether to track position on the Y-axis
     */
    get trackY() { return this._trackY; }
    set trackY(trackY: boolean) {
        this._trackY = trackY;
    }

    disconnectedCallback() {
        this.timeline.removeViewportMouseMoveListener(this.mouseMoveListener);
        this.timeline.removeViewportMouseLeaveListener(this.mouseLeaveListener);
    }
}
