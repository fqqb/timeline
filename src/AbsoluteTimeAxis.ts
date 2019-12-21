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

    drawLineContent(ctx: CanvasRenderingContext2D) {
        this.determineScale().drawLineContent(ctx, this);
    }

    drawOverlay(ctx: CanvasRenderingContext2D) {
        this.determineScale().drawOverlay(ctx, this);
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
    drawLineContent(ctx: CanvasRenderingContext2D, axis: AbsoluteTimeAxis): void;
    drawOverlay(ctx: CanvasRenderingContext2D, axis: AbsoluteTimeAxis): void;
}

/**
 * A scale that displays a label for each hour, and ticks for each quarter of an hour.
 */
class HourScale implements Scale {

    private majorX: number[] = [];
    private majorLabels: string[] = [];
    private midX: number[] = [];
    private minorX: number[] = [];

    drawLineContent(ctx: CanvasRenderingContext2D, axis: AbsoluteTimeAxis) {
        // Trunc to hours before positioning
        let t = startOfHour(axis.timenav.start);

        const halfHourDistance = axis.timenav.distanceBetween(t, t + HALF_HOUR);
        const quarterHourDistance = axis.timenav.distanceBetween(t, t + QUARTER_HOUR);

        this.majorX.length = 0;
        this.majorLabels.length = 0;
        this.midX.length = 0;
        this.minorX.length = 0;

        const dt = new Date();
        while (t <= axis.timenav.stop) {
            const x = axis.timenav.positionTime(t);
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

        const height = ctx.canvas.height;
        ctx.lineWidth = 1;
        ctx.strokeStyle = axis.timenav.rowBorderColor;
        ctx.beginPath();
        for (const x of this.majorX) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        for (const x of this.midX) {
            ctx.moveTo(x, height * 0.6);
            ctx.lineTo(x, height);
        }
        for (const x of this.minorX) {
            ctx.moveTo(x, height * 0.8);
            ctx.lineTo(x, height);
        }
        ctx.stroke();

        ctx.font = `${axis.timenav.textSize}px ${axis.timenav.fontFamily}`;
        ctx.fillStyle = 'grey';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < this.majorLabels.length; i++) {
            const label = this.majorLabels[i];
            const x = this.majorX[i];
            if (label.length > 2) {
                ctx.fillText('00', x + 2, height * 0.75);
                ctx.fillText(label, x + 2, height / 4);
            } else {
                ctx.fillText(label, x + 2, height / 2);
            }
        }
    }

    drawOverlay(ctx: CanvasRenderingContext2D, axis: AbsoluteTimeAxis) {
        if (axis.fullHeight) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = axis.timenav.rowBorderColor;
            ctx.beginPath();
            for (const x of this.majorX) {
                ctx.moveTo(x, axis.y + axis.height);
                ctx.lineTo(x, ctx.canvas.height);
            }
            ctx.stroke();
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
