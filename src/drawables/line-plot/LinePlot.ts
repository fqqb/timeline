import { FillStyle } from '../../graphics/FillStyle';
import { Graphics } from '../../graphics/Graphics';
import { MouseHitEvent } from '../../graphics/MouseHitEvent';
import { Path } from '../../graphics/Path';
import { Timeline } from '../../Timeline';
import { Band } from '../Band';
import { AxisRegion } from './AxisRegion';
import { HLine } from './HLine';
import { Line } from './Line';
import { LinePlotMouseMoveEvent } from './LinePlotMouseMoveEvent';
import { LinePlotRegion } from './LinePlotRegion';
import { LinePoint } from './LinePoint';
import { LineStyle } from './LineStyle';
import { generateTicksForHeight } from './tickgen';


interface AnnotatedLine {
    id: string;
    visible: boolean;
    lineColor?: string;
    lineWidth?: number;
    lineStyle?: LineStyle;
    fill?: FillStyle;
    pointRadius?: number;
    pointColor?: string;
    lohiColor?: string;
    points: AnnotatedPoint[];
}

interface DrawInfo {
    renderX: number;
    renderY?: number;
}

interface AnnotatedPoint {
    x: number;
    y: number | null;
    low?: number;
    high?: number;
    drawInfo?: DrawInfo;
}

interface AnnotatedTick {
    y: number;
    value: number;
}

let lineSequence = 1;

/**
 * Band type that plots a line along the timeline.
 */
export class LinePlot extends Band {

    private _fill: FillStyle = 'transparent';
    private _lineColor = '#4f9146';
    private _lineWidth = 1;
    private _lineStyle: LineStyle = 'straight';
    private _labelFontFamily = 'Verdana, Geneva, sans-serif';
    private _labelTextColor = '#333333';
    private _labelTextSize = 8;
    private _axisBackground: FillStyle = 'transparent';
    private _axisWidth?: number;
    private _minimum?: number;
    private _maximum?: number;
    private _axisPadding = 0.1;
    private _zoomMultiplier = 0.05;
    private _pointRadius = 1.5;
    private _pointColor = '#4f9146';
    private _lohiColor = '#5555552b';
    private _lines: Line[] = [];
    private _hlines: HLine[] = [];
    private _contentHeight = 30;
    private _labelFormatter: (value: number) => string = value => {
        return value.toFixed(2);
    };

    private annotatedTicks: AnnotatedTick[] = [];
    private annotatedLines: AnnotatedLine[] = [];
    private minTick?: AnnotatedTick;
    private maxTick?: AnnotatedTick;

    private axisRegion?: AxisRegion;
    private customMinimum?: number;
    private customMaximum?: number;

    /** @hidden */
    valueForPositionFn?: (position: number) => number;

    private linePlotRegion: LinePlotRegion;

    constructor(timeline: Timeline) {
        super(timeline);
        this.linePlotRegion = new LinePlotRegion(this.bandRegion, this);
    }

    /**
     * Register a listener that receives updates whenever the mouse is moving over
     * this plot.
     */
    addMouseMoveListener(listener: (ev: LinePlotMouseMoveEvent) => void) {
        super.addMouseMoveListener(listener as any);
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * plot mouse-move events.
     */
    removeMouseMoveListener(listener: (ev: LinePlotMouseMoveEvent) => void) {
        super.removeMouseMoveListener(listener as any);
    }

    // Convert user input to internal data structure
    private processData() {
        this.annotatedLines.length = 0;
        const lineId = 'line_plot_' + lineSequence++;
        if (this.lines.length) {
            for (const line of this.lines) {
                const annotatedPoints = [];
                for (const point of line.points) {
                    annotatedPoints.push({ x: point.x, y: point.y, low: point.low, high: point.high, });
                }
                annotatedPoints.sort((a, b) => a.x - b.x);
                this.annotatedLines.push({
                    id: lineId,
                    visible: line.visible ?? true,
                    lineColor: line.lineColor,
                    lineWidth: line.lineWidth,
                    lineStyle: line.lineStyle,
                    fill: line.fill,
                    pointRadius: line.pointRadius,
                    pointColor: line.pointColor,
                    lohiColor: line.lohiColor,
                    points: annotatedPoints,
                });
            }
        }

        this.axisRegion = new AxisRegion(lineId + '_axis', this.bandRegion.id, this);
    }

    calculateContentHeight(g: Graphics) {
        return this._contentHeight;
    }

    drawBandContent(g: Graphics) {
        const { contentHeight } = this;

        const hitRegion = this.offscreen!.addHitRegion(this.linePlotRegion);
        hitRegion.addRect(0, 0, this.timeline.mainWidth, contentHeight);

        // Prioritize custom range when applicable
        let min = this.customMinimum;
        let max = this.customMaximum;

        // Determine min/max, either through configuration or from the data
        // However, ignore data outside of viewport.
        if (min === undefined || max === undefined) {
            min = this.minimum;
            max = this.maximum;
            if (min == undefined || max == undefined) {
                for (const line of this.visibleLines) {
                    for (const pt of line.points) {
                        if (pt.x < this.timeline.start || pt.x > this.timeline.stop) {
                            continue;
                        }
                        if (this.minimum === undefined && pt.y !== null) {
                            const viewLow = pt.low !== undefined ? Math.min(pt.low, pt.y) : pt.y;
                            if (min === undefined || viewLow < min) {
                                min = viewLow;
                            }
                        }
                        if (this.maximum === undefined && pt.y !== null) {
                            const viewHigh = pt.high !== undefined ? Math.max(pt.high, pt.y) : pt.y;
                            if (max === undefined || viewHigh > max) {
                                max = viewHigh;
                            }
                        }
                    }
                }
                for (const hline of this.hlines) {
                    if (hline.extendAxisRange ?? true) {
                        if (min === undefined || hline.value < min) {
                            min = hline.value;
                        }
                        if (max === undefined || hline.value > max) {
                            max = hline.value;
                        }
                    }
                }
            }
        }

        if (min === undefined || max === undefined) {
            return;
        }
        if (max < min) { // Edge case in case only one of minimum/maximum was configured
            [min, max] = [max, min];
        }

        // Calculate ticks for the available content height.
        // Don't consider range padding for this to avoid labels getting clipped.
        const calculatedTicks = generateTicksForHeight(min, max, contentHeight, this.labelTextSize, 2);
        const dataMin = min;
        const dataMax = max;

        // Add range padding unless an explicit value was defined
        if (this.minimum === undefined && this.customMinimum === undefined) {
            min -= (max - min) * this.axisPadding;
        }
        if (this.maximum === undefined && this.customMaximum === undefined) {
            max += (max - min) * this.axisPadding;
        }

        const positionForValueFn = (value: number) => {
            return contentHeight - ((value - min) / (max - min) * (contentHeight - 0));
        };
        this.valueForPositionFn = (position: number) => {
            return min + (contentHeight - position) * (max - min) / contentHeight;
        };

        this.annotatedTicks.length = 0;
        for (const tick of calculatedTicks) {
            this.annotatedTicks.push({ y: positionForValueFn(tick), value: tick });
        }
        this.minTick = { y: positionForValueFn(dataMin), value: dataMin };
        this.maxTick = { y: positionForValueFn(dataMax), value: dataMax };

        // Draw order:
        // 1/ area fill (per line)
        // 2/ zero line (shared)
        // 3/ Low/High area (per line)
        // 4/ trace (per line)

        for (let i = 0; i < this.visibleLines.length; i++) {
            if (this.visibleLines[i].points.length) {
                const visibleLine = this.visibleLines[i];

                for (const point of visibleLine.points) {
                    point.drawInfo = {
                        renderX: Math.round(this.timeline.positionTime(point.x)),
                        renderY: point.y !== null ? positionForValueFn(point.y) : undefined,
                    };
                }

                this.drawArea(g, visibleLine, positionForValueFn);
            }
        }

        for (let i = 0; i < this.visibleLines.length; i++) {
            if (this.visibleLines[i].points.length) {
                const visibleLine = this.visibleLines[i];
                this.drawLohi(g, visibleLine, positionForValueFn);
                this.drawLine(g, visibleLine);
            }
        }

        for (const hline of this.hlines) {
            this.drawHLine(g, hline, positionForValueFn);
        }
    }

    override drawSidebarContent(g: Graphics, width: number) {
        const textMargin = 6; // Space between value and axis edge (left/right)
        const spacing = 2; // Space between tick and value
        const font = `${this.labelTextSize}px ${this.labelFontFamily}`;

        const tickTextIsFullyVisible = (tick: AnnotatedTick) => {
            const y1 = this.y + tick.y - (this.labelTextSize / 2);
            const y2 = this.y + tick.y + (this.labelTextSize / 2);
            return y1 >= this.y && y2 <= (this.y + this.contentHeight);
        };

        let visibleTicks = this.annotatedTicks.filter(tickTextIsFullyVisible);
        if (visibleTicks.length < 2 && this.minTick && this.maxTick) {
            visibleTicks = [this.minTick, this.maxTick];
        }

        let axisWidth = this.axisWidth;
        if (axisWidth === undefined) {
            for (const tick of visibleTicks) {
                const text = this.labelFormatter(tick.value);
                const fm = g.measureText(text, font);
                if (axisWidth === undefined || axisWidth < textMargin + fm.width + textMargin) {
                    axisWidth = textMargin + fm.width + textMargin;
                }
            }
        }
        if (axisWidth === undefined) {
            axisWidth = 30;
        }

        g.fillRect({
            x: width - axisWidth,
            y: this.y,
            width: axisWidth,
            height: this.contentHeight,
            fill: this.axisBackground,
        });

        if (this.axisRegion) {
            const hitRegion = g.addHitRegion(this.axisRegion);
            hitRegion.addRect(width - axisWidth, this.y, axisWidth, this.contentHeight);
        }

        for (const tick of visibleTicks) {
            const y = Math.round(this.y + tick.y) + 0.5;

            g.strokePath({
                color: this.labelTextColor,
                lineWidth: 1,
                path: new Path(width - textMargin + spacing, y).lineTo(width, y),
            });

            if (tickTextIsFullyVisible(tick)) {
                g.fillText({
                    text: this.labelFormatter(tick.value),
                    align: 'right',
                    baseline: 'middle',
                    color: this.labelTextColor,
                    font,
                    x: width - textMargin,
                    y,
                });
            } else if (tick === this.minTick) {
                g.fillText({
                    text: this.labelFormatter(tick.value),
                    align: 'right',
                    baseline: 'bottom',
                    color: this.labelTextColor,
                    font,
                    x: width - textMargin,
                    y: this.y + this.contentHeight + 0.5,
                });
            } else if (tick === this.maxTick) {
                g.fillText({
                    text: this.labelFormatter(tick.value),
                    align: 'right',
                    baseline: 'top',
                    color: this.labelTextColor,
                    font,
                    x: width - textMargin,
                    y: this.y + 0.5,
                });
            }
        }
    };

    private drawLohi(g: Graphics, line: AnnotatedLine, positionForValueFn: (value: number) => number) {
        const fill = line.lohiColor ?? this.lohiColor;

        for (let i = 1; i < line.points.length; i++) {
            const prev = line.points[i - 1].drawInfo!;
            const prevLow = line.points[i - 1].low;
            const prevHigh = line.points[i - 1].high;
            const point = line.points[i].drawInfo!;
            const pointLow = line.points[i].low;
            const pointHigh = line.points[i].high;
            if (prev.renderY !== undefined
                && point.renderY !== undefined
                && prevLow !== undefined
                && prevHigh !== undefined
                && pointLow !== undefined
                && pointHigh !== undefined) {
                const prevLowY = positionForValueFn(prevLow);
                const prevHighY = positionForValueFn(prevHigh);
                const pointLowY = positionForValueFn(pointLow);
                const pointHighY = positionForValueFn(pointHigh);
                g.fillPath({
                    path: new Path(prev.renderX, prevHighY)
                        .lineTo(prev.renderX, prevLowY)
                        .lineTo(point.renderX, pointLowY)
                        .lineTo(point.renderX, pointHighY),
                    fill,
                });
            }
        }
    }

    private drawArea(g: Graphics, line: AnnotatedLine, positionForValueFn: (value: number) => number) {
        const fill = line.fill ?? this.fill;
        const lineWidth = line.lineWidth ?? this.lineWidth;
        const lineStyle = line.lineStyle ?? this.lineStyle;
        const originY = Math.round(positionForValueFn(0)) + 0.5;

        if (lineStyle === 'straight') {
            for (let i = 1; i < line.points.length; i++) {
                const prev = line.points[i - 1].drawInfo!;
                const point = line.points[i].drawInfo!;
                if (prev.renderY !== undefined && point.renderY !== undefined) {
                    g.fillPath({
                        path: new Path(prev.renderX, prev.renderY)
                            .lineTo(prev.renderX, originY)
                            .lineTo(point.renderX, originY)
                            .lineTo(point.renderX, point.renderY),
                        fill,
                    });
                }
            }
        } else {
            const offset = lineWidth === 1 ? 0.5 : 0;
            for (let i = 1; i < line.points.length; i++) {
                const prev = line.points[i - 1].drawInfo!;
                const point = line.points[i].drawInfo!;
                if (prev.renderY !== undefined && point.renderY !== undefined) {
                    const prevX = Math.round(prev.renderX) + offset;
                    const prevY = Math.round(prev.renderY) + offset;
                    const pointX = Math.round(point.renderX) + offset;
                    g.fillPath({
                        path: new Path(prevX, prevY)
                            .lineTo(prevX, originY)
                            .lineTo(pointX, originY)
                            .lineTo(pointX, prevY),
                        fill,
                    });
                }
            }
        }
    }

    private drawHLine(g: Graphics, hline: HLine, positionForValueFn: (value: number) => number) {
        const y = Math.round(positionForValueFn(hline.value)) + 0.5;
        g.strokePath({
            path: new Path(0, y).lineTo(this.timeline.mainWidth, y),
            color: hline.lineColor,
            dash: hline.lineDash,
            lineWidth: hline.lineWidth ?? 1,
        });
        const label = hline.label;
        if (label) {
            const labelTextSize = hline.labelTextSize ?? this.labelTextSize;
            const labelFontFamily = hline.labelFontFamily ?? this.labelFontFamily;
            const font = `${labelTextSize}px ${labelFontFamily}`;
            const fm = g.measureText(label, font);
            const lrMargin = 4;
            g.fillRect({
                x: 0,
                y: y - fm.height / 2,
                width: lrMargin + fm.width + lrMargin,
                height: fm.height,
                fill: hline.lineColor,
            });
            g.fillText({
                x: 0 + lrMargin,
                y: y,
                align: 'left',
                baseline: 'middle',
                color: hline.labelTextColor ?? this.labelTextColor,
                text: label,
                font,
            });
        }
    }

    private drawLine(g: Graphics, line: AnnotatedLine) {
        const lineColor = line.lineColor ?? this.lineColor;
        const lineWidth = line.lineWidth ?? this.lineWidth;
        const lineStyle = line.lineStyle ?? this.lineStyle;
        const pointColor = line.pointColor ?? this.pointColor;
        const pointRadius = line.pointRadius ?? this.pointRadius;

        const { points } = line;

        // Draw trace
        const path = new Path(points[0].drawInfo!.renderX, points[0].drawInfo!.renderY ?? 0);

        if (lineStyle === 'straight') {
            for (let i = 1; i < points.length; i++) {
                const prev = points[i - 1].drawInfo!;
                const point = points[i].drawInfo!;
                if (prev.renderY !== undefined && point.renderY !== undefined) {
                    path.lineTo(point.renderX, point.renderY);
                } else if (point.renderY !== undefined) {
                    path.moveTo(point.renderX, point.renderY);
                }
            }
        } else {
            const offset = lineWidth === 1 ? 0.5 : 0;
            for (let i = 1; i < points.length; i++) {
                const prev = points[i - 1].drawInfo!;
                const point = points[i].drawInfo!;
                if (prev.renderY !== undefined && point.renderY !== undefined) {
                    const x = Math.round(point.renderX) + offset;
                    let y = Math.round(prev.renderY) + offset;
                    path.lineTo(x, y);
                    y = Math.round(point.renderY) + offset;
                    path.lineTo(x, y);
                } else if (point.renderY !== undefined) {
                    const x = Math.round(point.renderX) + offset;
                    const y = Math.round(point.renderY) + offset;
                    path.moveTo(x, y);
                }
            }
        }

        g.strokePath({
            path,
            color: lineColor,
            lineWidth,
            lineCap: 'round',
            lineJoin: 'round',
        });

        // Draw point symbols
        for (const point of points) {
            const { renderX, renderY } = point.drawInfo!;
            if (renderY !== undefined) {
                g.fillEllipse({
                    cx: renderX,
                    cy: renderY,
                    rx: pointRadius,
                    ry: pointRadius,
                    fill: pointColor,
                });
            }
        }
    }

    private get visibleLines(): AnnotatedLine[] {
        return this.annotatedLines.filter(line => line.visible);
    }

    private findClosestByTime(t: number): Array<LinePoint | null> {
        // Note: closest may also be a gap
        const closestPoints: Array<LinePoint | null> = [];

        for (const line of this.visibleLines) {
            let currIdx: number | null = null;
            let currX: number | null = null;
            let currPoint: LinePoint | null = null;
            let tdelta = Infinity;
            for (let i = 0; i < line.points.length; i++) {
                const point = line.points[i];
                if (Math.abs(point.x - t) < tdelta) {
                    currIdx = i;
                    currX = point.x;
                    currPoint = line.points[i];

                    tdelta = Math.abs(point.x - t);
                }
            }

            // Avoiding show value for trailing gap
            const ignorePoint = (currIdx === line.points.length - 1) && currX !== t;
            if (currPoint !== null && !ignorePoint) {
                closestPoints.push(currPoint);
            } else {
                closestPoints.push(null);
            }
        }

        return closestPoints;
    }

    override createMouseMoveEvent(evt: MouseHitEvent): LinePlotMouseMoveEvent {
        const mouseEvent = super.createMouseMoveEvent(evt);
        return {
            ...mouseEvent,
            points: this.findClosestByTime(mouseEvent.time),
        };
    }

    /**
     * Specify a custom data range for the Y-axis.
     *
     * If the `axisPadding` property is set, it will have no effect.
     */
    setAxisRange(min: number, max: number) {
        this.customMinimum = min;
        this.customMaximum = max;
        this.reportMutation();
    }

    /**
     * Reset any custom data range for the Y-axis.
     */
    resetAxisRange() {
        this.customMinimum = undefined;
        this.customMaximum = undefined;
        this.reportMutation();
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
     * Color of the line that connects data points.
     */
    get lineColor() { return this._lineColor; }
    set lineColor(lineColor: string) {
        this._lineColor = lineColor;
        this.reportMutation();
    }

    /**
     * Thickness of the plot line.
     */
    get lineWidth() { return this._lineWidth; }
    set lineWidth(lineWidth: number) {
        this._lineWidth = lineWidth;
        this.reportMutation();
    }

    /**
     * Plot line style (straight or step).
     */
    get lineStyle() { return this._lineStyle; }
    set lineStyle(lineStyle: LineStyle) {
        this._lineStyle = lineStyle;
        this.reportMutation();
    }

    /**
     * Area fill between the plot line and the value 0.
     */
    get fill() { return this._fill; }
    set fill(fill: FillStyle) {
        this._fill = fill;
        this.reportMutation();
    }

    /**
     * Color of the point symbol.
     */
    get pointColor() { return this._pointColor; }
    set pointColor(pointColor: string) {
        this._pointColor = pointColor;
        this.reportMutation();
    }

    /**
     * Color of the low/high area.
     */
    get lohiColor() { return this._lohiColor; }
    set lohiColor(lohiColor: string) {
        this._lohiColor = lohiColor;
        this.reportMutation();
    }

    /**
     * Radius of the point symbol.
     */
    get pointRadius() { return this._pointRadius; }
    set pointRadius(pointRadius: number) {
        this._pointRadius = pointRadius;
        this.reportMutation();
    }

    /**
     * Font family of any value labels.
     */
    get labelFontFamily() { return this._labelFontFamily; }
    set labelFontFamily(labelFontFamily: string) {
        this._labelFontFamily = labelFontFamily;
        this.reportMutation();
    }

    /**
     * Text color of any value labels.
     */
    get labelTextColor() { return this._labelTextColor; }
    set labelTextColor(labelTextColor: string) {
        this._labelTextColor = labelTextColor;
        this.reportMutation();
    }

    /**
     * Size of any value labels.
     */
    get labelTextSize() { return this._labelTextSize; }
    set labelTextSize(labelTextSize: number) {
        this._labelTextSize = labelTextSize;
        this.reportMutation();
    }

    /**
     * Function that formats a point value to string.
     *
     * The default behavior is to format with 2 digits after the
     * decimal point.
     */
    get labelFormatter() { return this._labelFormatter; }
    set labelFormatter(labelFormatter: (value: number) => string) {
        this._labelFormatter = labelFormatter;
        this.reportMutation();
    }

    /**
     * Background color of the axis.
     */
    get axisBackground() { return this._axisBackground; }
    set axisBackground(axisBackground: FillStyle) {
        this._axisBackground = axisBackground;
        this.reportMutation();
    }

    /**
     * Axis width on the sidebar.
     *
     * If undefined, the width takes the space of the actual tick
     * label width.
     */
    get axisWidth() { return this._axisWidth; }
    set axisWidth(axisWidth: number | undefined) {
        this._axisWidth = axisWidth;
        this.reportMutation();
    }

    /**
     * Value that corresponds with the minimum value on the curve. If undefined,
     * the value is automatically derived from the plot data.
     */
    get minimum() { return this._minimum; }
    set minimum(minimum: number | undefined) {
        this._minimum = minimum;
        this.processData();
        this.reportMutation();
    }

    /**
     * Returns the smallest visible value on the axis. This accounts for axisPadding
     * where applicable.
     */
    get visibleMinimum() {
        return this.valueForPositionFn!(this.contentHeight);
    }

    /**
     * Value that corresponds with the maximum value on the curve. If undefined,
     * the value is automatically derived from the plot data.
     */
    get maximum() { return this._maximum; }
    set maximum(maximum: number | undefined) {
        this._maximum = maximum;
        this.processData();
        this.reportMutation();
    }

    /**
     * Returns the largest visible value on the axis. This accounts for axisPadding
     * where applicable.
     */
    get visibleMaximum() {
        return this.valueForPositionFn!(0);
    }

    /**
     * Add y-axis padding around the data. When autoscaling, additional space
     * is added both to the top and the bottom using the formula:
     * `axisPadding * data_range`.
     *
     * For example, if the data ranges from 0 to 10, the y-axis will show
     * 0 to 10 with an axisPadding of 0, and -1 to 11 with an axisPadding
     * of 0.1.
     *
     * This property is ignored at the bottom when `minimum` is explicitly
     * set, and it is ignored at the top when `maximum` is explicitly set.
     */
    get axisPadding() { return this._axisPadding; }
    set axisPadding(axisPadding: number) {
        this._axisPadding = axisPadding;
        this.reportMutation();
    }

    /**
     * The larger this number, the faster to zoom in/out
     * A multiplier of 1 allows for a max zoom-in of twice the data range.
     */
    get zoomMultiplier() { return this._zoomMultiplier; }
    set zoomMultiplier(zoomMultiplier: number) {
        this._zoomMultiplier = zoomMultiplier;
    }

    get lines() { return this._lines; }
    set lines(lines: Line[]) {
        this._lines = lines;
        this.processData();
        this.reportMutation();
    }

    get hlines() { return this._hlines; }
    set hlines(hlines: HLine[]) {
        this._hlines = hlines;
        this.reportMutation();
    }
}
