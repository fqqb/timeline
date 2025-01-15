import { addDays, addHours, addMinutes, addMonths, addWeeks, addYears, setHours, startOfDay, startOfDecade, startOfHour, startOfMonth, startOfWeek, startOfYear } from 'date-fns';
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';
import { enUS } from 'date-fns/locale';
import { Graphics } from '../../graphics/Graphics';
import { Path } from '../../graphics/Path';
import { Band } from '../Band';
import { FullHeightKind } from './FullHeightKind';
import { ScaleKind } from './ScaleKind';

/**
 * Perform a timezone-aware startOfHour operation
 */
function startOfTZHour(t: Date, timezone: string) {
    // Shift t to the proper timezone
    t = toZonedTime(t, timezone);

    t = startOfHour(t);

    // Shift back
    return fromZonedTime(t, timezone);
}

/**
 * Perform a timezone-aware startOfDay operation
 */
function startOfTZDay(t: Date, timezone: string) {
    // Shift t to the proper timezone
    t = toZonedTime(t, timezone);

    t = startOfDay(t);

    // Shift back
    return fromZonedTime(t, timezone);
}

/**
 * Perform a timezone-aware startOfWeek operation
 */
function startOfTZWeek(t: Date, timezone: string) {
    // Shift t to the proper timezone
    t = toZonedTime(t, timezone);

    t = startOfWeek(t, { weekStartsOn: 1 });

    // Shift back
    return fromZonedTime(t, timezone);
}

/**
 * Perform a timezone-aware startOfMonth operation
 */
function startOfTZMonth(t: Date, timezone: string) {
    // Shift t to the proper timezone
    t = toZonedTime(t, timezone);

    t = startOfMonth(t);

    // Shift back
    return fromZonedTime(t, timezone);
}

/**
 * Perform a timezone-aware startOfYear operation
 */
function startOfTZYear(t: Date, timezone: string) {
    // Shift t to the proper timezone
    t = toZonedTime(t, timezone);

    t = startOfYear(t);

    // Shift back
    return fromZonedTime(t, timezone);
}

/**
 * Perform a timezone-aware startOfDecade operation
 */
function startOfTZDecade(t: Date, timezone: string) {
    // Shift t to the proper timezone
    t = toZonedTime(t, timezone);

    t = startOfDecade(t);

    // Shift back
    return fromZonedTime(t, timezone);
}

/**
 * Perform a timezone-aware setHours operation
 */
function setTZHours(t: Date, hours: number, timezone: string) {
    // Shift t to the proper timezone
    t = toZonedTime(t, timezone);

    t = setHours(t, hours);

    // Shift back
    return fromZonedTime(t, timezone);
}

/**
 * A ruler that interprets time as milliseconds since January 01, 1970, 00:00:00 UTC.
 * Same as JavaScript Date.
 */
export class TimeRuler extends Band {

    private _contentHeight = 30;
    private _textColor = 'grey';
    private _fullHeight?: FullHeightKind;
    private _timezone?: string;
    private _scale: ScaleKind = 'auto';

    private hourScale = new HourScale();
    private quarterDayScale = new QuarterDayScale();
    private weekDayScale = new WeekDayScale();
    private weekScale = new WeekScale();
    private monthScale = new MonthScale();
    private yearScale = new YearScale();
    private decadeScale = new DecadeScale();

    private orderedScales = [
        this.decadeScale, // Macro
        this.yearScale,
        this.monthScale,
        this.weekScale,
        this.weekDayScale,
        this.quarterDayScale,
        this.hourScale, // Micro
    ];

    private scaleRenderer?: Scale;

    override calculateContentHeight(g: Graphics) {
        return this.contentHeight;
    }

    override drawBandContent(g: Graphics) {
        this.scaleRenderer = this.determineScale();
        this.scaleRenderer!.drawBandContent(g, this);
    }

    override drawUnderlay(g: Graphics) {
        if (this.fullHeight === 'underlay') {
            this.scaleRenderer!.drawFullHeightTicks(g, this);
        }
    }

    override drawOverlay(g: Graphics): void {
        if (this.fullHeight === 'overlay') {
            this.scaleRenderer!.drawFullHeightTicks(g, this);
        }
    }

    /**
     * The height of the band content (excluding margins).
     */
    get contentHeight() { return this._contentHeight; }
    set contentHeight(contentHeight: number) {
        this._contentHeight = contentHeight;
        this.reportMutation();
    }

    get fullHeight() { return this._fullHeight; }
    set fullHeight(fullHeight: FullHeightKind | undefined) {
        this._fullHeight = fullHeight;
        this.reportMutation();
    }

    get textColor() { return this._textColor; }
    set textColor(textColor: string) {
        this._textColor = textColor;
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
     * The scale for this ruler. Scales render ticks and labels.
     *
     * If undefined, an automatic scale is determined based
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
            case 'quarterDay':
                return this.quarterDayScale;
            case 'weekDay':
                return this.weekDayScale;
            case 'week':
                return this.weekScale;
            case 'month':
                return this.monthScale;
            case 'year':
                return this.yearScale;
            case 'decade':
                return this.decadeScale;
        }

        // Autodetermine a reasonable scale
        let bestCandidate = this.orderedScales[0];
        for (let i = 1; i < this.orderedScales.length; i++) {
            const candidate = this.orderedScales[i];
            const unitWidth = candidate.measureUnitWidth(this);
            if (unitWidth >= candidate.getPreferredUnitWidth()) {
                bestCandidate = candidate;
            } else {
                break;
            }
        }

        return bestCandidate;
    }
}

interface Scale {
    getPreferredUnitWidth(): number;
    measureUnitWidth(ruler: TimeRuler): number;
    drawBandContent(g: Graphics, ruler: TimeRuler): void;
    drawFullHeightTicks(g: Graphics, ruler: TimeRuler): void;
}

/**
 * A scale that displays a label for each hour, and ticks for each quarter of an hour.
 */
class HourScale implements Scale {

    private majorX: number[] = [];
    private majorLabels: string[] = [];
    private midX: number[] = [];
    private minorX: number[] = [];

    getPreferredUnitWidth() {
        return 38;
    }

    measureUnitWidth(ruler: TimeRuler) {
        const x1 = ruler.timeline.start;
        const x2 = x1 + 3600000; // 1 hour
        return ruler.timeline.positionTime(x2) - ruler.timeline.positionTime(x1);
    }

    drawBandContent(g: Graphics, ruler: TimeRuler) {
        let t = new Date(ruler.timeline.start);

        // Default to local
        const timezone = ruler.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

        t = startOfTZHour(t, timezone);

        const halfHourDistance = ruler.timeline.distanceBetween(t.getTime(), addMinutes(t, 30).getTime());
        const quarterHourDistance = ruler.timeline.distanceBetween(t.getTime(), addMinutes(t, 15).getTime());

        this.majorX.length = 0;
        this.majorLabels.length = 0;
        this.midX.length = 0;
        this.minorX.length = 0;

        while (t.getTime() <= ruler.timeline.stop) {
            const x = ruler.timeline.positionTime(t.getTime());

            this.majorX.push(x);
            this.minorX.push(x + quarterHourDistance);
            this.midX.push(x + halfHourDistance);
            this.minorX.push(x + halfHourDistance + quarterHourDistance);

            let majorLabel = formatInTimeZone(t, timezone, 'HH', { locale: enUS });
            if (majorLabel === '00') {
                majorLabel = formatInTimeZone(t, timezone, 'MMM dd', { locale: enUS });
            }
            this.majorLabels.push(majorLabel);

            t = addHours(t, 1);
        }

        const height = g.height;
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
            color: ruler.timeline.bandBorderColor,
            path,
        });

        const font = `${ruler.timeline.textSize}px ${ruler.timeline.fontFamily}`;
        for (let i = 0; i < this.majorLabels.length; i++) {
            const label = this.majorLabels[i];
            const x = this.majorX[i];
            if (label.length > 2) {
                g.fillText({
                    x: x + 2,
                    y: height * 0.75,
                    text: '00',
                    font,
                    color: ruler.textColor,
                    baseline: 'middle',
                    align: 'left',
                });
                g.fillText({
                    x: x + 2,
                    y: height / 4,
                    text: label,
                    font,
                    color: ruler.textColor,
                    baseline: 'middle',
                    align: 'left',
                });
            } else {
                g.fillText({
                    x: x + 2,
                    y: height / 2,
                    text: label,
                    font,
                    color: ruler.textColor,
                    baseline: 'middle',
                    align: 'left',
                });
            }
        }
    }

    drawFullHeightTicks(g: Graphics, ruler: TimeRuler) {
        const path = new Path(0, 0);
        for (const x of this.majorX) {
            path.moveTo(Math.round(x) + 0.5, ruler.y + ruler.height);
            path.lineTo(Math.round(x) + 0.5, g.height);
        }
        g.strokePath({
            color: ruler.timeline.bandBorderColor,
            path,
        });
    }
}

/**
 * A scale that displays a label for each day, and ticks for each quarter of a day.
 */
class QuarterDayScale implements Scale {

    private majorX: number[] = [];

    getPreferredUnitWidth() {
        return 30;
    }

    measureUnitWidth(ruler: TimeRuler) {
        const x1 = ruler.timeline.start;
        const x2 = x1 + (6 * 3600000); // 1/4 day
        return ruler.timeline.positionTime(x2) - ruler.timeline.positionTime(x1);
    }

    drawBandContent(g: Graphics, ruler: TimeRuler) {
        let t = new Date(ruler.timeline.start);

        // Default to local
        const timezone = ruler.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

        t = startOfTZDay(t, timezone);

        this.majorX.length = 0;

        const height = g.height;
        const font = `${ruler.timeline.textSize}px ${ruler.timeline.fontFamily}`;

        while (t.getTime() <= ruler.timeline.stop) {
            const x = ruler.timeline.positionTime(t.getTime());
            this.majorX.push(x);

            g.strokePath({
                color: ruler.timeline.bandBorderColor,
                path: new Path(0, 0)
                    .moveTo(Math.round(x) + 0.5, 0)
                    .lineTo(Math.round(x) + 0.5, height),
            });
            g.fillText({
                x: x + 2,
                y: height / 4,
                text: formatInTimeZone(t, timezone, 'EEE dd/MM', { locale: enUS }),
                font,
                color: ruler.textColor,
                baseline: 'middle',
                align: 'left',
            });

            for (const hour of [0, 6, 12, 18]) {
                const sub = setTZHours(t, hour, timezone);
                if (hour !== 0) {
                    const subX = ruler.timeline.positionTime(sub.getTime());
                    g.strokePath({
                        color: ruler.timeline.bandBorderColor,
                        path: new Path(0, 0)
                            .moveTo(Math.round(subX) + 0.5, height / 2)
                            .lineTo(Math.round(subX) + 0.5, height),
                    });
                }
                const subLabelX = ruler.timeline.positionTime(addHours(sub, 3).getTime());
                g.fillText({
                    x: subLabelX,
                    y: height * 0.75,
                    text: formatInTimeZone(sub, timezone, 'HH', { locale: enUS }),
                    font,
                    color: ruler.textColor,
                    baseline: 'middle',
                    align: 'center',
                });
            }

            t = addDays(t, 1); // This accounts for DST (adding hours does not)
        }
    }

    drawFullHeightTicks(g: Graphics, ruler: TimeRuler) {
        const path = new Path(0, 0);
        for (const x of this.majorX) {
            path.moveTo(Math.round(x) + 0.5, ruler.y + ruler.height);
            path.lineTo(Math.round(x) + 0.5, g.height);
        }
        g.strokePath({
            color: ruler.timeline.bandBorderColor,
            path,
        });
    }
}

/**
 * A scale that displays a label for each start of the week, and ticks for each day.
 */
class WeekDayScale implements Scale {

    private majorX: number[] = [];

    getPreferredUnitWidth() {
        return 20;
    }

    measureUnitWidth(ruler: TimeRuler) {
        const x1 = ruler.timeline.start;
        const x2 = x1 + (24 * 3600000); // 1 day
        return ruler.timeline.positionTime(x2) - ruler.timeline.positionTime(x1);
    }

    drawBandContent(g: Graphics, ruler: TimeRuler) {
        let t = new Date(ruler.timeline.start);

        // Default to local
        const timezone = ruler.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

        t = startOfTZWeek(t, timezone);

        this.majorX.length = 0;

        const height = g.height;
        const font = `${ruler.timeline.textSize}px ${ruler.timeline.fontFamily}`;

        while (t.getTime() <= ruler.timeline.stop) {
            const x = ruler.timeline.positionTime(t.getTime());
            this.majorX.push(x);

            g.strokePath({
                color: ruler.timeline.bandBorderColor,
                path: new Path(0, 0)
                    .moveTo(Math.round(x) + 0.5, 0)
                    .lineTo(Math.round(x) + 0.5, height),
            });
            g.fillText({
                x: x + 2,
                y: height / 4,
                text: formatInTimeZone(t, timezone, "dd MMM, yy", { locale: enUS }),
                font,
                color: ruler.textColor,
                baseline: 'middle',
                align: 'left',
            });

            for (let weekday = 0; weekday < 7; weekday++) {
                t = addDays(t, 1);

                if (weekday !== 6) { // Avoid overlap with day divider
                    const subX = ruler.timeline.positionTime(t.getTime());
                    g.strokePath({
                        color: ruler.timeline.bandBorderColor,
                        path: new Path(0, 0)
                            .moveTo(Math.round(subX) + 0.5, height / 2)
                            .lineTo(Math.round(subX) + 0.5, height),
                    });
                }

                const subLabelX = ruler.timeline.positionTime(addHours(t, 12).getTime());
                g.fillText({
                    x: subLabelX,
                    y: height * 0.75,
                    text: formatInTimeZone(t, timezone, 'EEEEE', { locale: enUS }),
                    font,
                    color: ruler.textColor,
                    baseline: 'middle',
                    align: 'center',
                });
            }
        }
    }

    drawFullHeightTicks(g: Graphics, ruler: TimeRuler) {
        const path = new Path(0, 0);
        for (const x of this.majorX) {
            path.moveTo(Math.round(x) + 0.5, ruler.y + ruler.height);
            path.lineTo(Math.round(x) + 0.5, g.height);
        }
        g.strokePath({
            color: ruler.timeline.bandBorderColor,
            path,
        });
    }
}

/**
 * A scale that displays a label for each month, and ticks for each week start.
 */
class WeekScale implements Scale {

    private majorX: number[] = [];

    getPreferredUnitWidth() {
        return 50;
    }

    measureUnitWidth(ruler: TimeRuler) {
        const x1 = ruler.timeline.start;
        const x2 = x1 + (7 * 24 * 3600000); // 1 week
        return ruler.timeline.positionTime(x2) - ruler.timeline.positionTime(x1);
    }

    drawBandContent(g: Graphics, ruler: TimeRuler) {
        let t = new Date(ruler.timeline.start);

        // Default to local
        const timezone = ruler.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

        t = startOfTZMonth(t, timezone);

        this.majorX.length = 0;

        const height = g.height;
        const font = `${ruler.timeline.textSize}px ${ruler.timeline.fontFamily}`;

        const start = t;

        while (t.getTime() <= ruler.timeline.stop) {
            const x = ruler.timeline.positionTime(t.getTime());
            this.majorX.push(x);

            g.strokePath({
                color: ruler.timeline.bandBorderColor,
                path: new Path(0, 0)
                    .moveTo(Math.round(x) + 0.5, 0)
                    .lineTo(Math.round(x) + 0.5, height / 2),
            });
            g.fillText({
                x: x + 2,
                y: height / 4,
                text: formatInTimeZone(t, timezone, "LLLL", { locale: enUS }),
                font,
                color: ruler.textColor,
                baseline: 'middle',
                align: 'left',
            });

            t = addMonths(t, 1);
        }

        t = startOfTZWeek(start, timezone);
        while (t.getTime() <= ruler.timeline.stop) {
            const x = ruler.timeline.positionTime(t.getTime());

            g.strokePath({
                color: ruler.timeline.bandBorderColor,
                path: new Path(0, 0)
                    .moveTo(Math.round(x) + 0.5, height / 2)
                    .lineTo(Math.round(x) + 0.5, height),
            });
            let subLabelT = addDays(addHours(t, 12), 3);
            const subLabelX = ruler.timeline.positionTime(subLabelT.getTime());
            g.fillText({
                x: subLabelX,
                y: height * 0.75,
                text: formatInTimeZone(t, timezone, 'dd/MM', { locale: enUS }),
                font,
                color: ruler.textColor,
                baseline: 'middle',
                align: 'center',
            });

            t = addWeeks(t, 1);
        }
    }

    drawFullHeightTicks(g: Graphics, ruler: TimeRuler) {
        const path = new Path(0, 0);
        for (const x of this.majorX) {
            path.moveTo(Math.round(x) + 0.5, ruler.y + ruler.height);
            path.lineTo(Math.round(x) + 0.5, g.height);
        }
        g.strokePath({
            color: ruler.timeline.bandBorderColor,
            path,
        });
    }
}

/**
 * A scale that displays a label for each year, and ticks for each month.
 */
class MonthScale implements Scale {

    private majorX: number[] = [];

    getPreferredUnitWidth() {
        return 32;
    }

    measureUnitWidth(ruler: TimeRuler) {
        const x1 = ruler.timeline.start;
        const x2 = x1 + (30 * 24 * 3600000); // ~1 month
        return ruler.timeline.positionTime(x2) - ruler.timeline.positionTime(x1);
    }

    drawBandContent(g: Graphics, ruler: TimeRuler) {
        let t = new Date(ruler.timeline.start);

        // Default to local
        const timezone = ruler.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

        t = startOfTZYear(t, timezone);

        this.majorX.length = 0;

        const height = g.height;
        const font = `${ruler.timeline.textSize}px ${ruler.timeline.fontFamily}`;

        while (t.getTime() <= ruler.timeline.stop) {
            const x = ruler.timeline.positionTime(t.getTime());
            this.majorX.push(x);

            g.strokePath({
                color: ruler.timeline.bandBorderColor,
                path: new Path(0, 0)
                    .moveTo(Math.round(x) + 0.5, 0)
                    .lineTo(Math.round(x) + 0.5, height),
            });
            g.fillText({
                x: x + 2,
                y: height / 4,
                text: formatInTimeZone(t, timezone, "yyyy", { locale: enUS }),
                font,
                color: ruler.textColor,
                baseline: 'middle',
                align: 'left',
            });

            for (let month = 0; month < 12; month++) {
                t = addMonths(t, 1);
                const subX = ruler.timeline.positionTime(t.getTime());
                g.strokePath({
                    color: ruler.timeline.bandBorderColor,
                    path: new Path(0, 0)
                        .moveTo(Math.round(subX) + 0.5, height / 2)
                        .lineTo(Math.round(subX) + 0.5, height),
                });
                const x2 = addMonths(t, 1).getTime();
                const subLabelX = ruler.timeline.positionTime((t.getTime() + x2) / 2);
                g.fillText({
                    x: subLabelX,
                    y: height * 0.75,
                    text: formatInTimeZone(t, timezone, 'LLL', { locale: enUS }),
                    font,
                    color: ruler.textColor,
                    baseline: 'middle',
                    align: 'center',
                });
            }
        }
    }

    drawFullHeightTicks(g: Graphics, ruler: TimeRuler) {
        const path = new Path(0, 0);
        for (const x of this.majorX) {
            path.moveTo(Math.round(x) + 0.5, ruler.y + ruler.height);
            path.lineTo(Math.round(x) + 0.5, g.height);
        }
        g.strokePath({
            color: ruler.timeline.bandBorderColor,
            path,
        });
    }
}

/**
 * A scale that displays a label for each year
 */
class YearScale implements Scale {

    getPreferredUnitWidth() {
        return 49;
    }

    measureUnitWidth(ruler: TimeRuler) {
        const x1 = ruler.timeline.start;
        const x2 = x1 + (365 * 24 * 3600000); // ~1 year
        return ruler.timeline.positionTime(x2) - ruler.timeline.positionTime(x1);
    }

    drawBandContent(g: Graphics, ruler: TimeRuler) {
        let t = new Date(ruler.timeline.start);

        // Default to local
        const timezone = ruler.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

        t = startOfTZYear(t, timezone);

        const height = g.height;
        const font = `${ruler.timeline.textSize}px ${ruler.timeline.fontFamily}`;

        while (t.getTime() <= ruler.timeline.stop) {
            const x = ruler.timeline.positionTime(t.getTime());

            g.strokePath({
                color: ruler.timeline.bandBorderColor,
                path: new Path(0, 0)
                    .moveTo(Math.round(x) + 0.5, 0)
                    .lineTo(Math.round(x) + 0.5, height),
            });
            g.fillText({
                x: x + 2,
                y: height / 2,
                text: formatInTimeZone(t, timezone, "yyyy", { locale: enUS }),
                font,
                color: ruler.textColor,
                baseline: 'middle',
                align: 'left',
            });

            t = addYears(t, 1);
        }
    }

    drawFullHeightTicks(g: Graphics, ruler: TimeRuler) {
    }
}

/**
 * A scale that displays a label for each decade
 */
class DecadeScale implements Scale {

    getPreferredUnitWidth() {
        return 49;
    }

    measureUnitWidth(ruler: TimeRuler) {
        const x1 = ruler.timeline.start;
        const x2 = x1 + (10 * 365 * 24 * 3600000); // ~10 year
        return ruler.timeline.positionTime(x2) - ruler.timeline.positionTime(x1);
    }

    drawBandContent(g: Graphics, ruler: TimeRuler) {
        let t = new Date(ruler.timeline.start);

        // Default to local
        const timezone = ruler.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

        t = startOfTZDecade(t, timezone);

        const height = g.height;
        const font = `${ruler.timeline.textSize}px ${ruler.timeline.fontFamily}`;

        while (t.getTime() <= ruler.timeline.stop) {
            const x = ruler.timeline.positionTime(t.getTime());

            g.strokePath({
                color: ruler.timeline.bandBorderColor,
                path: new Path(0, 0)
                    .moveTo(Math.round(x) + 0.5, 0)
                    .lineTo(Math.round(x) + 0.5, height),
            });
            g.fillText({
                x: x + 2,
                y: height / 2,
                text: formatInTimeZone(t, timezone, 'yyyy', { locale: enUS }) + 's',
                font,
                color: ruler.textColor,
                baseline: 'middle',
                align: 'left',
            });

            t = addYears(t, 10);
        }
    }

    drawFullHeightTicks(g: Graphics, ruler: TimeRuler) {
    }
}
