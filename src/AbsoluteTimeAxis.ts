import { HourScale as HourScale } from './HourScale';
import { Line } from './Line';
import { Timenav } from './Timenav';

export const HOUR_SCALE = new HourScale();
export const NULL_SCALE = new class implements Scale {
    draw() { }
};

/**
 * An axis that interprets time as milliseconds since January 01, 1970, 00:00:00 UTC. Same as JavaScript Date.
 */
export class AbsoluteTimeAxis extends Line<void> {

    private _fullHeight = false;
    private _utc = false;
    private _scale?: Scale;

    drawContent(ctx: CanvasRenderingContext2D) {
        if (this.scale) {
            this.scale.draw(ctx, this.timenav, this.y, this);
        } else {
            const scale = this.determineScale();
            scale.draw(ctx, this.timenav, this.y, this);
        }
    }

    get fullHeight() { return this._fullHeight; }
    set fullHeight(fullHeight: boolean) {
        this._fullHeight = fullHeight;
        this.reportMutation();
    }

    /**
     * If true, the assigned scale should format time as UTC, otherwise according to
     * the local timezone.
     *
     * Note that other timezones are only possible by implementing a custom Scale.
     */
    get utc() { return this._utc; }
    set utc(utc: boolean) {
        this._utc = utc;
        this.reportMutation();
    }

    /**
     * The scale for this axis. Scales render ticks and labels.
     *
     * If undefined, an automatic scale will be determined based
     * on the visible time range.
     */
    get scale() { return this._scale; }
    set scale(scale: Scale | undefined) {
        this._scale = scale;
        this.reportMutation();
    }

    private determineScale(): Scale {
        return HOUR_SCALE;
    }
}

export interface Scale {

    draw(ctx: CanvasRenderingContext2D, timenav: Timenav, y: number, axis: AbsoluteTimeAxis): void;
}
