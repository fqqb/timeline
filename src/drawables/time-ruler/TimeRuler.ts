import { Graphics } from '../../graphics/Graphics';
import { Band } from '../Band';
import { GridLayer } from '../GridLayer';
import { ScaleKind } from './ScaleKind';
import { DecadeScale, FiveMinutesScale, FiveSecondsScale, HalfHourScale, HalfMinuteScale, HourScale, HundredMillisecondsScale, MinuteScale, MonthScale, QuarterDayScale, Scale, SecondScale, TenMillisecondsScale, TenMinutesScale, TenSecondsScale, TwoHundredMillisecondsScale, WeekDayScale, WeekScale, YearScale } from './scales';

/**
 * A ruler that interprets time as milliseconds since January 01, 1970, 00:00:00 UTC.
 * Same as JavaScript Date.
 */
export class TimeRuler extends Band {

    private _contentHeight = 30;
    private _textColor = 'grey';
    private _tickColor = '#888888';
    private _grid?: GridLayer;
    private _gridColor: string = '#e8e8e8';
    private _timezone?: string;
    private _scale: ScaleKind = 'auto';

    private tenMillisecondsScale = new TenMillisecondsScale();
    private hundredMillisecondsScale = new HundredMillisecondsScale();
    private twoHundredMillisecondsScale = new TwoHundredMillisecondsScale();
    private secondScale = new SecondScale();
    private fiveSecondsScale = new FiveSecondsScale();
    private tenSecondsScale = new TenSecondsScale();
    private halfMinuteScale = new HalfMinuteScale();
    private minuteScale = new MinuteScale();
    private fiveMinutesScale = new FiveMinutesScale();
    private tenMinutesScale = new TenMinutesScale();
    private halfHourScale = new HalfHourScale();
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
        this.hourScale,
        this.halfHourScale,
        this.tenMinutesScale,
        this.fiveMinutesScale,
        this.minuteScale,
        this.halfMinuteScale,
        this.tenSecondsScale,
        this.fiveSecondsScale,
        this.secondScale,
        this.twoHundredMillisecondsScale,
        this.hundredMillisecondsScale,
        this.tenMillisecondsScale, // Micro
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
        if (this.grid === 'underlay' && this.scaleRenderer?.drawGrid) {
            this.scaleRenderer.drawGrid(g, this);
        }
    }

    override drawOverlay(g: Graphics) {
        if (this.grid === 'overlay' && this.scaleRenderer?.drawGrid) {
            this.scaleRenderer.drawGrid(g, this);
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

    /**
     * Whether to extend major ticks over the entire canvas height
     */
    get grid() { return this._grid; }
    set grid(grid: GridLayer | undefined) {
        this._grid = grid;
        this.reportMutation();
    }

    /**
     * Color of the grid
     */
    get gridColor() { return this._gridColor; }
    set gridColor(gridColor: string) {
        this._gridColor = gridColor;
        this.reportMutation();
    }

    /**
     * Color of any text labels
     */
    get textColor() { return this._textColor; }
    set textColor(textColor: string) {
        this._textColor = textColor;
        this.reportMutation();
    }

    /**
     * Tick color
     */
    get tickColor() { return this._tickColor; }
    set tickColor(tickColor: string) {
        this._tickColor = tickColor;
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
            case 'tenMilliseconds':
                return this.tenMillisecondsScale;
            case 'hundredMilliseconds':
                return this.hundredMillisecondsScale;
            case 'twoHundredMilliseconds':
                return this.twoHundredMillisecondsScale;
            case 'second':
                return this.secondScale;
            case 'fiveSeconds':
                return this.fiveSecondsScale;
            case 'tenSeconds':
                return this.tenSecondsScale;
            case 'halfMinute':
                return this.halfMinuteScale;
            case 'minute':
                return this.minuteScale;
            case 'fiveMinutes':
                return this.fiveMinutesScale;
            case 'tenMinutes':
                return this.tenMinutesScale;
            case 'halfHour':
                return this.halfHourScale;
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
