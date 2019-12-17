import { AbsoluteTimeAxis, Scale } from './AbsoluteTimeAxis';
import { Timenav } from './Timenav';

const ONE_HOUR = 60 * 60 * 1000;
const HALF_HOUR = ONE_HOUR / 2;
const QUARTER_HOUR = ONE_HOUR / 4;

/**
 * A scale that displays a label for each hour, and ticks for each quarter of an hour.
 */
export class HourScale implements Scale {

    draw(ctx: CanvasRenderingContext2D, timenav: Timenav, y: number, axis: AbsoluteTimeAxis) {
        // Trunc to hours before positioning
        let t = this.startOfHour(timenav.start);

        const hourDistance = timenav.distanceBetween(t, t + ONE_HOUR);
        const halfHourDistance = timenav.distanceBetween(t, t + HALF_HOUR);
        const quarterHourDistance = timenav.distanceBetween(t, t + QUARTER_HOUR);
        const utc = axis.utc;

        while (t <= timenav.stop) {
            const x = timenav.positionTime(t);
            let label = this.formatDate(new Date(t), 'HH', utc);

            const dividerColor = timenav.rowBorderColor!;
            const textSize = timenav.textSize;
            const fontFamily = timenav.fontFamily;

            // MAJOR
            ctx.lineWidth = 1;
            ctx.strokeStyle = dividerColor;
            ctx.beginPath();
            ctx.moveTo(x, y);
            if (axis.fullHeight) {
                ctx.lineTo(x, ctx.canvas.height);
            } else {
                ctx.lineTo(x, y + axis.height);
            }
            ctx.stroke();

            // MINOR 1
            ctx.lineWidth = 1;
            ctx.strokeStyle = dividerColor;
            ctx.beginPath();
            ctx.moveTo(x + quarterHourDistance, y + axis.height * 0.8);
            ctx.lineTo(x + quarterHourDistance, y + axis.height);
            ctx.stroke();

            // MID
            ctx.lineWidth = 1;
            ctx.strokeStyle = dividerColor;
            ctx.beginPath();
            ctx.moveTo(x + halfHourDistance, y + axis.height * 0.6);
            ctx.lineTo(x + halfHourDistance, y + axis.height);
            ctx.stroke();

            // MINOR 2
            ctx.lineWidth = 1;
            ctx.strokeStyle = dividerColor;
            ctx.beginPath();
            ctx.moveTo(x + halfHourDistance + quarterHourDistance, y + axis.height * 0.8);
            ctx.lineTo(x + halfHourDistance + quarterHourDistance, y + axis.height);
            ctx.stroke();

            ctx.font = `${textSize}px ${fontFamily}`;
            ctx.fillStyle = 'grey';
            ctx.textBaseline = 'middle';

            if (label === '00') {
                ctx.fillText(label, x + 2, y + axis.height * 0.75);
                label = this.formatDate(new Date(t), 'MMM', utc) + ' ' + this.formatDate(new Date(t), 'DD', utc);
                ctx.fillText(label, x + 2, y + axis.height / 4);
            } else {
                ctx.fillText(label, x + 2, y + axis.height / 2);
            }

            t += ONE_HOUR;
        }
    }

    private formatDate(date: Date, format: string, utc: boolean) {
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

    private startOfHour(time: number) {
        const truncated = new Date(time);
        truncated.setMinutes(0, 0, 0);
        return truncated.getTime();
    }
}
