import { Graphics, Path } from './Graphics';
import { Line } from './Line';

const ONE_HOUR = 60 * 60 * 1000;
const HALF_HOUR = ONE_HOUR / 2;
const QUARTER_HOUR = ONE_HOUR / 4;

type ScaleKind = 'auto' | 'hour';

/**
 * An axis that interprets time as milliseconds since January 01, 1970, 00:00:00 UTC. Same as JavaScript Date.
 */
export class AbsoluteTimeAxis extends Line<void> {

    private _fullHeight = false;
    private _timezone?: string;
    private _scale: ScaleKind = 'auto';

    private hourScale = new HourScale();

    drawLineContent(g: Graphics) {
        this.determineScale().drawLineContent(g, this);
    }

    drawOverlay(g: Graphics) {
        this.determineScale().drawOverlay(g, this);
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
     * @deprecated use 'timezone' attribute
     */
    get utc() {
        console.warn('Do not use AbsoluteTimeAxis.utc boolean attribute. Instead switch to AbsoluteTimeAxis.timezone string attribute.');
        return this._timezone === 'UTC';
    }
    set utc(utc: boolean) {
        console.warn('Do not use AbsoluteTimeAxis.utc boolean attribute. Instead switch to AbsoluteTimeAxis.timezone string attribute.');
        this._timezone = utc ? 'UTC' : undefined;
        this.reportMutation();
    }

    /**
     * Set the timezone by which to format scale labels. If undefined, the local timezone is used.
     */
    get timezone() { return this._timezone; }
    set timezone(timezone: string | undefined) {
        this._timezone = timezone;
        this.reportMutation();
    }

    /**
     * The scale for this axis. Scales render ticks and labels.
     *
     * If undefined, an automatic scale will be determined based
     * on the visible time range.
     */
    get scale() { return this._scale; }
    set scale(scale: ScaleKind) {
        this._scale = scale;
        this.reportMutation();
    }

    private determineScale(): Scale {
        switch (this._scale) {
            case 'hour':
                return this.hourScale;
            default:
                return this.hourScale;
        }
    }
}

interface Scale {
    drawLineContent(g: Graphics, axis: AbsoluteTimeAxis): void;
    drawOverlay(g: Graphics, axis: AbsoluteTimeAxis): void;
}

/**
 * A scale that displays a label for each hour, and ticks for each quarter of an hour.
 */
class HourScale implements Scale {

    private majorX: number[] = [];
    private majorLabels: string[] = [];
    private midX: number[] = [];
    private minorX: number[] = [];

    drawLineContent(g: Graphics, axis: AbsoluteTimeAxis) {
        // Trunc to hours before positioning
        let t = startOfHour(axis.timeline.start);

        const halfHourDistance = axis.timeline.distanceBetween(t, t + HALF_HOUR);
        const quarterHourDistance = axis.timeline.distanceBetween(t, t + QUARTER_HOUR);

        this.majorX.length = 0;
        this.majorLabels.length = 0;
        this.midX.length = 0;
        this.minorX.length = 0;

        const dt = new Date();
        while (t <= axis.timeline.stop) {
            const x = axis.timeline.positionTime(t);
            dt.setTime(t);

            this.majorX.push(x);
            this.minorX.push(x + quarterHourDistance);
            this.midX.push(x + halfHourDistance);
            this.minorX.push(x + halfHourDistance + quarterHourDistance);

            let label = formatDate(dt, 'HH', axis.timezone);
            if (label === '00') {
                label = formatDate(dt, 'MMM', axis.timezone)
                    + ' ' + formatDate(dt, 'DD', axis.timezone);
            }
            this.majorLabels.push(label);

            t += ONE_HOUR;
        }

        const height = g.canvas.height;
        const path = new Path(0, 0);
        for (const x of this.majorX) {
            path.moveTo(Math.round(x) + 0.5, 0);
            path.lineTo(Math.round(x) + 0.5, height);
        }
        for (const x of this.midX) {
            path.moveTo(Math.round(x) + 0.5, height * 0.6);
            path.lineTo(Math.round(x) + 0.5, height);
        }
        for (const x of this.minorX) {
            path.moveTo(Math.round(x) + 0.5, height * 0.8);
            path.lineTo(Math.round(x) + 0.5, height);
        }
        g.strokePath({
            color: axis.timeline.rowBorderColor,
            path,
        });

        const font = `${axis.timeline.textSize}px ${axis.timeline.fontFamily}`;
        for (let i = 0; i < this.majorLabels.length; i++) {
            const label = this.majorLabels[i];
            const x = this.majorX[i];
            if (label.length > 2) {
                g.fillText({
                    x: x + 2,
                    y: height * 0.75,
                    text: '00',
                    font,
                    color: 'grey',
                    baseline: 'middle',
                    align: 'left',
                });
                g.fillText({
                    x: x + 2,
                    y: height / 4,
                    text: label,
                    font,
                    color: 'grey',
                    baseline: 'middle',
                    align: 'left',
                });
            } else {
                g.fillText({
                    x: x + 2,
                    y: height / 2,
                    text: label,
                    font,
                    color: 'grey',
                    baseline: 'middle',
                    align: 'left',
                });
            }
        }
    }

    drawOverlay(g: Graphics, axis: AbsoluteTimeAxis) {
        if (axis.fullHeight) {
            const path = new Path(0, 0);
            for (const x of this.majorX) {
                path.moveTo(Math.round(x) + 0.5, axis.y + axis.height);
                path.lineTo(Math.round(x) + 0.5, g.canvas.height);
            }
            g.strokePath({
                color: axis.timeline.rowBorderColor,
                path,
            });
        }
    }
}

function formatDate(date: Date, format: string, timeZone?: string) {
    if (format === 'YYYY') {
        return new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric' }).format(date);
    } else if (format === 'MM') {
        return new Intl.DateTimeFormat('en-US', { timeZone, month: '2-digit' }).format(date);
    } else if (format === 'MMM') {
        return new Intl.DateTimeFormat('en-US', { timeZone, month: 'short' }).format(date);
    } else if (format === 'MMMM') {
        return new Intl.DateTimeFormat('en-US', { timeZone, month: 'long' }).format(date);
    } else if (format === 'DD') {
        return new Intl.DateTimeFormat('en-US', { timeZone, day: '2-digit' }).format(date);
    } else if (format === 'DDDD') { // Day of year
        const dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        const m = parseInt(new Intl.DateTimeFormat('en-US', { timeZone, month: 'numeric' }).format(date));
        const d = parseInt(new Intl.DateTimeFormat('en-US', { timeZone, day: 'numeric' }).format(date));
        let dayOfYear = dayCount[m] + d;
        if (m > 1 && isLeapYear(date, timeZone)) {
            dayOfYear++;
        }
        return leftPad(dayOfYear, 3);
    } else if (format === 'ddd') { // Day of week
        return new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date);
    } else if (format === 'Do') {
        const d = parseInt(new Intl.DateTimeFormat('en-US', { timeZone, day: 'numeric' }).format(date));
        return (d === 1 || d === 31) ? d + 'st' : (d === 2) ? d + 'nd' : d + 'th';
    } else if (format === 'HH') {
        return new Intl.DateTimeFormat('en-US', { timeZone, hour: '2-digit', hour12: false }).format(date);
    } else {
        throw new Error(`Unexpected format '${format}'`);
    }
}

function isLeapYear(date: Date, timeZone?: string) {
    const year = parseInt(new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric' }).format(date));
    if ((year & 3) !== 0) {
        return false;
    }
    return ((year % 100) !== 0 || (year % 400) === 0);
}

function leftPad(nr: number, n: number) {
    return Array(n - String(nr).length + 1).join('0') + nr;
}

function startOfHour(time: number) {
    const truncated = new Date(time);
    truncated.setMinutes(0, 0, 0);
    return truncated.getTime();
}
