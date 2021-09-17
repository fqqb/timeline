import { DateTime } from 'luxon';
import { Band } from './Band';
import { Graphics, Path } from './Graphics';

export type ScaleKind = 'auto' | 'hour' | 'quarterDay' | 'weekDay' | 'week' | 'month' | 'year' | 'decade';

/**
 * A ruler that interprets time as milliseconds since January 01, 1970, 00:00:00 UTC.
 * Same as JavaScript Date.
 */
export class TimeRuler extends Band {

    private _textColor = 'grey';
    private _fullHeight = false;
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

    /** @hidden */
    calculateContentHeight(g: Graphics) {
        return 20;
    }

    /** @hidden */
    drawBandContent(g: Graphics) {
        this.scaleRenderer = this.determineScale();
        this.scaleRenderer!.drawBandContent(g, this);
    }

    /** @hidden */
    drawUnderlay(g: Graphics) {
        this.scaleRenderer!.drawUnderlay(g, this);
    }

    get fullHeight() { return this._fullHeight; }
    set fullHeight(fullHeight: boolean) {
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
    drawUnderlay(g: Graphics, ruler: TimeRuler): void;
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
        let t = DateTime.fromMillis(ruler.timeline.start);
        if (ruler.timezone) {
            t = t.setZone(ruler.timezone);
        }
        t = t.startOf('hour');

        const halfHourDistance = ruler.timeline.distanceBetween(t.toMillis(), t.plus({ minutes: 30 }).toMillis());
        const quarterHourDistance = ruler.timeline.distanceBetween(t.toMillis(), t.plus({ minutes: 15 }).toMillis());

        this.majorX.length = 0;
        this.majorLabels.length = 0;
        this.midX.length = 0;
        this.minorX.length = 0;

        const stop = DateTime.fromMillis(ruler.timeline.stop);
        while (t <= stop) {
            const x = ruler.timeline.positionTime(t.toMillis());

            this.majorX.push(x);
            this.minorX.push(x + quarterHourDistance);
            this.midX.push(x + halfHourDistance);
            this.minorX.push(x + halfHourDistance + quarterHourDistance);
            this.majorLabels.push(t.toFormat(t.hour === 0 ? 'MMM dd' : 'HH'));

            t = t.plus({ hours: 1 });
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

    drawUnderlay(g: Graphics, ruler: TimeRuler) {
        if (ruler.fullHeight) {
            const path = new Path(0, 0);
            for (const x of this.majorX) {
                path.moveTo(Math.round(x) + 0.5, ruler.y + ruler.height);
                path.lineTo(Math.round(x) + 0.5, g.canvas.height);
            }
            g.strokePath({
                color: ruler.timeline.bandBorderColor,
                path,
            });
        }
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
        let t = DateTime.fromMillis(ruler.timeline.start);
        if (ruler.timezone) {
            t = t.setZone(ruler.timezone);
        }
        t = t.startOf('day');

        this.majorX.length = 0;

        const height = g.canvas.height;
        const font = `${ruler.timeline.textSize}px ${ruler.timeline.fontFamily}`;

        const stop = DateTime.fromMillis(ruler.timeline.stop);

        while (t <= stop) {
            const x = ruler.timeline.positionTime(t.toMillis());
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
                text: t.toFormat('EEE dd/MM'),
                font,
                color: ruler.textColor,
                baseline: 'middle',
                align: 'left',
            });

            for (const hour of [0, 6, 12, 18]) {
                const sub = t.set({ hour });
                if (hour !== 0) {
                    const subX = ruler.timeline.positionTime(sub.toMillis());
                    g.strokePath({
                        color: ruler.timeline.bandBorderColor,
                        path: new Path(0, 0)
                            .moveTo(Math.round(subX) + 0.5, height / 2)
                            .lineTo(Math.round(subX) + 0.5, height),
                    });
                }
                const subLabelX = ruler.timeline.positionTime(sub.plus({ hours: 3 }).toMillis());
                g.fillText({
                    x: subLabelX,
                    y: height * 0.75,
                    text: sub.toFormat('HH'),
                    font,
                    color: ruler.textColor,
                    baseline: 'middle',
                    align: 'center',
                });
            }

            t = t.plus({ days: 1 }); // This accounts for DST (adding hours does not)
        }
    }

    drawUnderlay(g: Graphics, ruler: TimeRuler) {
        if (ruler.fullHeight) {
            const path = new Path(0, 0);
            for (const x of this.majorX) {
                path.moveTo(Math.round(x) + 0.5, ruler.y + ruler.height);
                path.lineTo(Math.round(x) + 0.5, g.canvas.height);
            }
            g.strokePath({
                color: ruler.timeline.bandBorderColor,
                path,
            });
        }
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
        let t = DateTime.fromMillis(ruler.timeline.start);
        if (ruler.timezone) {
            t = t.setZone(ruler.timezone);
        }
        t = t.startOf('week');

        this.majorX.length = 0;

        const height = g.canvas.height;
        const font = `${ruler.timeline.textSize}px ${ruler.timeline.fontFamily}`;

        const stop = DateTime.fromMillis(ruler.timeline.stop);

        while (t <= stop) {
            const x = ruler.timeline.positionTime(t.toMillis());
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
                text: t.toFormat("dd MMM, yy"),
                font,
                color: ruler.textColor,
                baseline: 'middle',
                align: 'left',
            });

            for (let weekday = 1; weekday <= 7; weekday++) {
                const sub = t.set({ weekday });
                if (weekday !== 1) {
                    const subX = ruler.timeline.positionTime(sub.toMillis());
                    g.strokePath({
                        color: ruler.timeline.bandBorderColor,
                        path: new Path(0, 0)
                            .moveTo(Math.round(subX) + 0.5, height / 2)
                            .lineTo(Math.round(subX) + 0.5, height),
                    });
                }
                const subLabelX = ruler.timeline.positionTime(sub.plus({ hours: 12 }).toMillis());
                g.fillText({
                    x: subLabelX,
                    y: height * 0.75,
                    text: sub.toFormat('EEEEE'),
                    font,
                    color: ruler.textColor,
                    baseline: 'middle',
                    align: 'center',
                });
            }

            t = t.plus({ weeks: 1 });
        }
    }

    drawUnderlay(g: Graphics, ruler: TimeRuler) {
        if (ruler.fullHeight) {
            const path = new Path(0, 0);
            for (const x of this.majorX) {
                path.moveTo(Math.round(x) + 0.5, ruler.y + ruler.height);
                path.lineTo(Math.round(x) + 0.5, g.canvas.height);
            }
            g.strokePath({
                color: ruler.timeline.bandBorderColor,
                path,
            });
        }
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
        let t = DateTime.fromMillis(ruler.timeline.start);
        if (ruler.timezone) {
            t = t.setZone(ruler.timezone);
        }
        t = t.startOf('month');

        this.majorX.length = 0;

        const height = g.canvas.height;
        const font = `${ruler.timeline.textSize}px ${ruler.timeline.fontFamily}`;

        const start = t;
        const stop = DateTime.fromMillis(ruler.timeline.stop);

        while (t <= stop) {
            const x = ruler.timeline.positionTime(t.toMillis());
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
                text: t.toFormat("LLLL"),
                font,
                color: ruler.textColor,
                baseline: 'middle',
                align: 'left',
            });

            t = t.plus({ months: 1 });
        }

        t = start.startOf('week');
        while (t <= stop) {
            const x = ruler.timeline.positionTime(t.toMillis());

            g.strokePath({
                color: ruler.timeline.bandBorderColor,
                path: new Path(0, 0)
                    .moveTo(Math.round(x) + 0.5, height / 2)
                    .lineTo(Math.round(x) + 0.5, height),
            });
            const subLabelX = ruler.timeline.positionTime(t.plus({ days: 3, hours: 12 }).toMillis());
            g.fillText({
                x: subLabelX,
                y: height * 0.75,
                text: t.toFormat('dd/MM'),
                font,
                color: ruler.textColor,
                baseline: 'middle',
                align: 'center',
            });

            t = t.plus({ weeks: 1 });
        }
    }

    drawUnderlay(g: Graphics, ruler: TimeRuler) {
        if (ruler.fullHeight) {
            const path = new Path(0, 0);
            for (const x of this.majorX) {
                path.moveTo(Math.round(x) + 0.5, ruler.y + ruler.height);
                path.lineTo(Math.round(x) + 0.5, g.canvas.height);
            }
            g.strokePath({
                color: ruler.timeline.bandBorderColor,
                path,
            });
        }
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
        let t = DateTime.fromMillis(ruler.timeline.start);
        if (ruler.timezone) {
            t = t.setZone(ruler.timezone);
        }
        t = t.startOf('year');

        this.majorX.length = 0;

        const height = g.canvas.height;
        const font = `${ruler.timeline.textSize}px ${ruler.timeline.fontFamily}`;

        const stop = DateTime.fromMillis(ruler.timeline.stop);

        while (t <= stop) {
            const x = ruler.timeline.positionTime(t.toMillis());
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
                text: t.toFormat("yyyy"),
                font,
                color: ruler.textColor,
                baseline: 'middle',
                align: 'left',
            });

            for (let month = 1; month <= 12; month++) {
                const sub = t.set({ month });
                if (month !== 1) {
                    const subX = ruler.timeline.positionTime(sub.toMillis());
                    g.strokePath({
                        color: ruler.timeline.bandBorderColor,
                        path: new Path(0, 0)
                            .moveTo(Math.round(subX) + 0.5, height / 2)
                            .lineTo(Math.round(subX) + 0.5, height),
                    });
                }
                const x2 = sub.plus({ months: 1 }).toMillis();
                const subLabelX = ruler.timeline.positionTime((sub.toMillis() + x2) / 2);
                g.fillText({
                    x: subLabelX,
                    y: height * 0.75,
                    text: sub.toFormat('LLL'),
                    font,
                    color: ruler.textColor,
                    baseline: 'middle',
                    align: 'center',
                });
            }

            t = t.plus({ years: 1 });
        }
    }

    drawUnderlay(g: Graphics, ruler: TimeRuler) {
        if (ruler.fullHeight) {
            const path = new Path(0, 0);
            for (const x of this.majorX) {
                path.moveTo(Math.round(x) + 0.5, ruler.y + ruler.height);
                path.lineTo(Math.round(x) + 0.5, g.canvas.height);
            }
            g.strokePath({
                color: ruler.timeline.bandBorderColor,
                path,
            });
        }
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
        let t = DateTime.fromMillis(ruler.timeline.start);
        if (ruler.timezone) {
            t = t.setZone(ruler.timezone);
        }
        t = t.startOf('year');

        const height = g.canvas.height;
        const font = `${ruler.timeline.textSize}px ${ruler.timeline.fontFamily}`;

        const stop = DateTime.fromMillis(ruler.timeline.stop);

        while (t <= stop) {
            const x = ruler.timeline.positionTime(t.toMillis());

            g.strokePath({
                color: ruler.timeline.bandBorderColor,
                path: new Path(0, 0)
                    .moveTo(Math.round(x) + 0.5, 0)
                    .lineTo(Math.round(x) + 0.5, height),
            });
            g.fillText({
                x: x + 2,
                y: height / 2,
                text: t.toFormat("yyyy"),
                font,
                color: ruler.textColor,
                baseline: 'middle',
                align: 'left',
            });

            t = t.plus({ years: 1 });
        }
    }

    drawUnderlay(g: Graphics, ruler: TimeRuler) {
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
        let t = DateTime.fromMillis(ruler.timeline.start);
        if (ruler.timezone) {
            t = t.setZone(ruler.timezone);
        }
        t = t.startOf('year');
        t = t.set({ year: t.year - (t.year % 10) });

        const height = g.canvas.height;
        const font = `${ruler.timeline.textSize}px ${ruler.timeline.fontFamily}`;

        const stop = DateTime.fromMillis(ruler.timeline.stop);

        while (t <= stop) {
            const x = ruler.timeline.positionTime(t.toMillis());

            g.strokePath({
                color: ruler.timeline.bandBorderColor,
                path: new Path(0, 0)
                    .moveTo(Math.round(x) + 0.5, 0)
                    .lineTo(Math.round(x) + 0.5, height),
            });
            g.fillText({
                x: x + 2,
                y: height / 2,
                text: t.toFormat("yyyy") + 's',
                font,
                color: ruler.textColor,
                baseline: 'middle',
                align: 'left',
            });

            t = t.plus({ years: 10 });
        }
    }

    drawUnderlay(g: Graphics, ruler: TimeRuler) {
    }
}
