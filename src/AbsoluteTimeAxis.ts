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
    private _utc = false;
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

            let label = formatDate(dt, 'HH', axis.utc);
            if (label === '00') {
                label = formatDate(dt, 'MMM', axis.utc)
                    + ' ' + formatDate(dt, 'DD', axis.utc);
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

function formatDate(date: Date, format: string, utc: boolean) {
    if (format === 'YYYY') {
        return String(utc ? date.getUTCFullYear() : date.getFullYear());
    } else if (format === 'MM') {
        const m = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
        return (m < 10) ? '0' + m : ' ' + m;
    } else if (format === 'MMM') {
        const monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const m = (utc ? date.getUTCMonth() : date.getMonth());
        return monthAbbr[m];
    } else if (format === 'MMMM') {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const m = (utc ? date.getUTCMonth() : date.getMonth());
        return months[m];
    } else if (format === 'DD') {
        const d = (utc ? date.getUTCDate() : date.getDate());
        return (d < 10) ? '0' + d : ' ' + d;
    } else if (format === 'DDDD') { // Day of year
        const dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        const m = (utc ? date.getUTCMonth() : date.getMonth());
        const d = (utc ? date.getUTCDate() : date.getDate());
        let dayOfYear = dayCount[m] + d;
        if (m > 1 && isLeapYear(date, utc)) {
            dayOfYear++;
        }
        return leftPad(dayOfYear, 3);
    } else if (format === 'dd') { // Day of week
        const weekAbbr = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        return weekAbbr[utc ? date.getUTCDay() : date.getDay()];
    } else if (format === 'ddd') { // Day of week
        const weekAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return weekAbbr[utc ? date.getUTCDay() : date.getDay()];
    } else if (format === 'Do') {
        const d = (utc ? date.getUTCDate() : date.getDate());
        return (d === 1 || d === 31) ? d + 'st' : (d === 2) ? d + 'nd' : d + 'th';
    } else if (format === 'HH') {
        const h = (utc ? date.getUTCHours() : date.getHours());
        return (h < 10) ? '0' + h : '' + h;
    } else {
        throw new Error(`Unexpected format '${format}'`);
    }
}

function isLeapYear(date: Date, utc: boolean) {
    const year = (utc ? date.getUTCFullYear() : date.getFullYear());
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
