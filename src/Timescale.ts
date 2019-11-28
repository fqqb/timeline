import { Band } from './Band';
import { Timeline } from './Timeline';

const ONE_HOUR = 60 * 60 * 1000;
const HALF_HOUR = ONE_HOUR / 2;
const QUARTER_HOUR = ONE_HOUR / 4;

export class Timescale extends Band {

    private _utc = false;
    private _fullHeight = false;
    private _columnShading = false;
    private _shadeColor = '#eee';

    constructor(timeline: Timeline, label?: string) {
        super(timeline, label);
        this.fixed = true;
    }

    draw(canvas: HTMLCanvasElement, x: number, y: number) {
        const ctx = canvas.getContext('2d')!;

        // Trunc to hours before positioning
        const date = this.startOfHour(this.timeline.getStart());

        const hourPoints = this.timeline.pointsBetween(date, new Date(date.getTime() + ONE_HOUR));
        const halfHourPoints = this.timeline.pointsBetween(date, new Date(date.getTime() + HALF_HOUR));
        const quarterHourPoints = this.timeline.pointsBetween(date, new Date(date.getTime() + QUARTER_HOUR));

        const tz = this.utc ? 'UTC' : undefined;

        while (date.getTime() <= this.timeline.getStop().getTime()) {
            const x = this.timeline.positionDate(date);
            let label = this.formatDate(date, 'HH', tz);

            if (this.columnShading && parseInt(label) % 2) {
                ctx.fillStyle = this.shadeColor;
                if (this.fullHeight) {
                    ctx.fillRect(x, y, hourPoints, canvas.height - y);
                } else {
                    ctx.fillRect(x, y, hourPoints, this.height);
                }
            }

            // MAJOR
            ctx.lineWidth = 1;
            ctx.strokeStyle = this.dividerColor;
            ctx.beginPath();
            ctx.moveTo(x, y);
            if (this.fullHeight) {
                ctx.lineTo(x, canvas.height);
            } else {
                ctx.lineTo(x, y + this.height);
            }
            ctx.stroke();

            // MINOR 1
            ctx.lineWidth = 1;
            ctx.strokeStyle = this.dividerColor;
            ctx.beginPath();
            ctx.moveTo(x + quarterHourPoints, y + this.height * 0.8);
            ctx.lineTo(x + quarterHourPoints, y + this.height);
            ctx.stroke();

            // MID
            ctx.lineWidth = 1;
            ctx.strokeStyle = this.dividerColor;
            ctx.beginPath();
            ctx.moveTo(x + halfHourPoints, y + this.height * 0.6);
            ctx.lineTo(x + halfHourPoints, y + this.height);
            ctx.stroke();

            // MINOR 2
            ctx.lineWidth = 1;
            ctx.strokeStyle = this.dividerColor;
            ctx.beginPath();
            ctx.moveTo(x + halfHourPoints + quarterHourPoints, y + this.height * 0.8);
            ctx.lineTo(x + halfHourPoints + quarterHourPoints, y + this.height);
            ctx.stroke();

            ctx.font = `${this.textSize}px ${this.fontFamily}`;
            ctx.fillStyle = 'grey';
            ctx.textBaseline = 'middle';

            if (label === '00') {
                ctx.fillText(label, x + 2, y + this.height * 0.75);
                label = this.formatDate(date, 'MMM', tz) + ' ' + this.formatDate(date, 'DD', tz);
                ctx.fillText(label, x + 2, y + this.height / 4);
            } else {
                ctx.fillText(label, x + 2, y + this.height / 2);
            }

            date.setTime(date.getTime() + ONE_HOUR);
        }

        super.draw(canvas, x, y);
    }

    get fullHeight() {
        return this._fullHeight;
    }

    set fullHeight(fullHeight: boolean) {
        this._fullHeight = fullHeight;
        this.timeline.repaint();
    }

    get utc() {
        return this._utc;
    }

    set utc(utc: boolean) {
        this._utc = utc;
        this.timeline.repaint();
    }

    get columnShading() {
        return this._columnShading;
    }

    set columnShading(columnShading: boolean) {
        this._columnShading = columnShading;
        this.timeline.repaint();
    }

    get shadeColor() {
        return this._shadeColor;
    }

    set shadeColor(shadeColor: string) {
        this._shadeColor = shadeColor;
    }

    private formatDate(date: Date, format: string, tz?: string) {
        const utc = (tz === 'GMT' || tz === 'UTC');
        if (tz && !utc) {
            throw new Error(`Unsupported timezone '${tz}'`);
        }

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
            if (m > 1 && this.isLeapYear(date, utc)) {
                dayOfYear++;
            }
            return this.leftPad(dayOfYear, 3);
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

    private isLeapYear(date: Date, utc: boolean) {
        const year = (utc ? date.getUTCFullYear() : date.getFullYear());
        if ((year & 3) !== 0) {
            return false;
        }
        return ((year % 100) !== 0 || (year % 400) === 0);
    }

    private leftPad(nr: number, n: number) {
        return Array(n - String(nr).length + 1).join('0') + nr;
    }

    private startOfHour(date: Date) {
        const truncated = new Date(date.getTime());
        truncated.setMinutes(0, 0, 0);
        return truncated;
    }
}
