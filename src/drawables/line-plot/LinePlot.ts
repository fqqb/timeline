import { FillStyle } from '../../graphics/FillStyle';
import { Graphics } from '../../graphics/Graphics';
import { Path } from '../../graphics/Path';
import { REGION_ID_VIEWPORT } from '../../Timeline';
import { Band } from '../Band';
import { Line } from './Line';
import { LinePlotClickEvent } from './LinePlotClickEvent';
import { LinePlotMouseLeaveEvent } from './LinePlotMouseLeaveEvent';
import { LinePlotMouseMoveEvent } from './LinePlotMouseMoveEvent';
import { LinePlotPoint } from './LinePlotPoint';


interface AnnotatedLine {
    id: string;
    visible: boolean;
    lineColor?: string;
    lineWidth?: number;
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
    low: number | null;
    high: number | null;
    drawInfo?: DrawInfo;
}

let plotSequence = 1;
let lineSequence = 1;

/**
 * Band type that plots a line along the timeline.
 */
export class LinePlot extends Band {

    private _fill: FillStyle = 'transparent';
    private _lineColor = '#4f9146';
    private _lineWidth = 1;
    private _labelFontFamily = 'Verdana, Geneva, sans-serif';
    private _labelBackground: FillStyle = 'transparent';
    private _labelTextColor = '#333333';
    private _labelTextSize = 8;
    private _minimum?: number;
    private _maximum?: number;
    private _pointRadius = 1.5;
    private _pointColor = '#4f9146';
    private _lohiColor = '#5555552b';
    private _lines: Line[] = [];
    private _contentHeight = 30;
    private _zeroLineColor = '#e8e8e8';
    private _zeroLineWidth = 0;
    private _zeroLineDash: number[] = [4, 3];
    private _labelFormatter: (value: number) => string = value => {
        return value.toFixed(2);
    };

    private annotatedLines: AnnotatedLine[] = [];

    private linePlotRegionId = 'line_plot_' + plotSequence++;
    private clickListeners: Array<(ev: LinePlotClickEvent) => void> = [];
    private mouseMoveListeners: Array<(ev: LinePlotMouseMoveEvent) => void> = [];
    private mouseLeaveListeners: Array<(ev: LinePlotMouseLeaveEvent) => void> = [];

    /**
     * Register a listener that receives an update when the plot is clicked.
     */
    addClickListener(listener: (ev: LinePlotClickEvent) => void) {
        this.clickListeners.push(listener);
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * click events.
     */
    removeClickListener(listener: (ev: LinePlotClickEvent) => void) {
        this.clickListeners = this.clickListeners.filter(el => (el !== listener));
    }

    /**
     * Register a listener that receives updates whenever the mouse is moving over
     * this plot.
     */
    addMouseMoveListener(listener: (ev: LinePlotMouseMoveEvent) => void) {
        this.mouseMoveListeners.push(listener);
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * plot mouse-move events.
     */
    removeMouseMoveListener(listener: (ev: LinePlotMouseMoveEvent) => void) {
        this.mouseMoveListeners = this.mouseMoveListeners.filter(el => (el !== listener));
    }

    /**
     * Register a listener that receives updates whenever the mouse is moving outside
     * this plot.
     */
    addMouseLeaveListener(listener: (ev: LinePlotMouseLeaveEvent) => void) {
        this.mouseLeaveListeners.push(listener);
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * plot mouse-leave events.
     */
    removeMouseLeaveListener(listener: (ev: LinePlotMouseLeaveEvent) => void) {
        this.mouseLeaveListeners = this.mouseLeaveListeners.filter(el => (el !== listener));
    }

    // Convert user input to internal data structure
    private processData() {
        this.annotatedLines.length = 0;
        if (this.lines.length) {
            for (const line of this.lines) {
                const lineId = 'line_plot_' + lineSequence++;
                const annotatedPoints = [];
                for (const [x, y] of line.points) {
                    let low = null;
                    let high = null;
                    if (line.lohi) {
                        const lohi = line.lohi.get(x);
                        low = lohi ? lohi[0] ?? null : null;
                        high = lohi ? lohi[1] ?? null : null;
                    }
                    annotatedPoints.push({ x, y, low, high });
                }
                annotatedPoints.sort((a, b) => a.x - b.x);
                this.annotatedLines.push({
                    id: lineId,
                    visible: line.visible ?? true,
                    lineColor: line.lineColor,
                    lineWidth: line.lineWidth,
                    fill: line.fill,
                    pointRadius: line.pointRadius,
                    pointColor: line.pointColor,
                    lohiColor: line.lohiColor,
                    points: annotatedPoints,
                });
            }
        }
    }

    calculateContentHeight(g: Graphics) {
        return this._contentHeight;
    }

    drawBandContent(g: Graphics) {
        const { contentHeight } = this;

        // Determine min/max, either through configuration or from the data
        // However, ignore data outside of viewport.
        let min = this.minimum;
        let max = this.maximum;
        if (min == undefined || max == undefined) {
            for (const line of this.visibleLines) {
                for (const pt of line.points) {
                    if (pt.x < this.timeline.start || pt.x > this.timeline.stop) {
                        continue;
                    }
                    if (this.minimum === undefined && pt.y !== null) {
                        const viewLow = pt.low !== null ? Math.min(pt.low, pt.y) : pt.y;
                        if (min === undefined || viewLow < min) {
                            min = viewLow;
                        }
                    }
                    if (this.maximum === undefined && pt.y !== null) {
                        const viewHigh = pt.high !== null ? Math.max(pt.high, pt.y) : pt.y;
                        if (max === undefined || viewHigh > max) {
                            max = viewHigh;
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

        const positionForValueFn = (value: number) => {
            return contentHeight - ((value - min) / (max - min) * (contentHeight - 0));
        };
        const valueForPositionFn = (y: number) => {
            return ((contentHeight - y) / (contentHeight - 0)) * (max - min) + min;
        };

        const hitRegion = g.addHitRegion({
            id: this.linePlotRegionId,
            parentId: REGION_ID_VIEWPORT,
            mouseMove: evt => {
                const time = this.timeline.timeForCanvasPosition(evt.x);
                const mouseEvent: LinePlotMouseMoveEvent = {
                    clientX: evt.clientX,
                    clientY: evt.clientY,
                    time,
                    value: valueForPositionFn(evt.y),
                    points: this.findClosestByTime(time),
                };
                this.mouseMoveListeners.forEach(l => l(mouseEvent));
            },
            mouseLeave: evt => {
                const mouseEvent: LinePlotMouseLeaveEvent = {
                    clientX: evt.clientX,
                    clientY: evt.clientY,
                };
                this.mouseLeaveListeners.forEach(l => l(mouseEvent));
            },
            click: evt => {
                const time = this.timeline.timeForCanvasPosition(evt.x);
                const clickEvent: LinePlotClickEvent = {
                    clientX: evt.clientX,
                    clientY: evt.clientY,
                    time,
                    value: valueForPositionFn(evt.y),
                    points: this.findClosestByTime(time),
                };
                this.clickListeners.forEach(l => l(clickEvent));
            },
        });
        hitRegion.addRect(0, 0, this.timeline.mainWidth, this.contentHeight);

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

        if (this.zeroLineWidth > 0) {
            const originY = Math.round(positionForValueFn(0)) - 0.5;
            g.strokePath({
                path: new Path(0, originY).lineTo(this.timeline.mainWidth, originY),
                color: this.zeroLineColor,
                dash: this.zeroLineDash,
                lineWidth: this.zeroLineWidth,
            });
        }

        for (let i = 0; i < this.visibleLines.length; i++) {
            if (this.visibleLines[i].points.length) {
                const visibleLine = this.visibleLines[i];
                this.drawLohi(g, visibleLine, positionForValueFn);
                this.drawLine(g, visibleLine);
            }
        }

        const rightMargin = 4;
        const font = `${this.labelTextSize}px ${this.labelFontFamily}`;
        const minText = this.labelFormatter(min);
        let fm = g.measureText(minText, font);
        g.fillRect({
            x: this.timeline.mainWidth - fm.width - rightMargin,
            y: contentHeight - this.labelTextSize - 0.5,
            width: fm.width,
            height: this.labelTextSize,
            fill: this.labelBackground,
        });
        const maxText = this.labelFormatter(max);
        fm = g.measureText(maxText, font);
        g.fillRect({
            x: this.timeline.mainWidth - fm.width - rightMargin,
            y: 0.5,
            width: fm.width,
            height: this.labelTextSize,
            fill: this.labelBackground,
        });

        g.fillText({
            text: minText,
            align: 'right',
            baseline: 'bottom',
            color: this.labelTextColor,
            font,
            x: this.timeline.mainWidth - rightMargin,
            y: contentHeight,
        });
        g.fillText({
            text: maxText,
            align: 'right',
            baseline: 'top',
            color: this.labelTextColor,
            font,
            x: this.timeline.mainWidth - rightMargin,
            y: 0.5,
        });
    }

    private drawLohi(g: Graphics, line: AnnotatedLine, positionValueFn: (value: number) => number) {
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
                && prevLow !== null
                && prevHigh != null
                && pointLow !== null
                && pointHigh !== null) {
                const prevLowY = positionValueFn(prevLow);
                const prevHighY = positionValueFn(prevHigh);
                const pointLowY = positionValueFn(pointLow);
                const pointHighY = positionValueFn(pointHigh);
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

    private drawArea(g: Graphics, line: AnnotatedLine, positionValueFn: (value: number) => number) {
        const fill = line.fill ?? this.fill;

        const originY = Math.round(positionValueFn(0)) + 0.5;
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
    }

    private drawLine(g: Graphics, line: AnnotatedLine) {
        const lineColor = line.lineColor ?? this.lineColor;
        const lineWidth = line.lineWidth ?? this.lineWidth;
        const pointColor = line.pointColor ?? this.pointColor;
        const pointRadius = line.pointRadius ?? this.pointRadius;

        const { points } = line;

        // Draw trace
        const path = new Path(points[0].drawInfo!.renderX, points[0].drawInfo!.renderY ?? 0);
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1].drawInfo!;
            const point = points[i].drawInfo!;
            if (prev.renderY !== undefined && point.renderY !== undefined) {
                path.lineTo(point.renderX, point.renderY);
            } else if (point.renderY !== undefined) {
                path.moveTo(point.renderX, point.renderY);
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

    private findClosestByTime(t: number): Array<LinePlotPoint | null> {
        // Note: closest may also be a gap
        const closestPoints: Array<LinePlotPoint | null> = [];

        for (const line of this.visibleLines) {
            let currIdx: number | null = null;
            let currX: number | null = null;
            let currY: number | null = null;
            let currLow: number | null = null;
            let currHigh: number | null = null;
            let tdelta = Infinity;
            for (let i = 0; i < line.points.length; i++) {
                const { x, y, low, high } = line.points[i];
                if (Math.abs(x - t) < tdelta) {
                    currIdx = i;
                    currX = x;
                    currY = y;
                    currLow = low;
                    currHigh = high;

                    tdelta = Math.abs(x - t);
                }
            }

            // Avoiding show value for trailing gap
            const ignorePoint = (currIdx === line.points.length - 1) && currX !== t;
            if (currX !== null && !ignorePoint) {
                closestPoints.push({
                    time: currX,
                    value: currY,
                    low: currLow,
                    high: currHigh,
                });
            } else {
                closestPoints.push(null);
            }
        }

        return closestPoints;
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
     * Background color of any value labels.
     */
    get labelBackground() { return this._labelBackground; }
    set labelBackground(labelBackground: FillStyle) {
        this._labelBackground = labelBackground;
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
     * The default behaviour is to format with 2 digits after the
     * decimal point.
     */
    get labelFormatter() { return this._labelFormatter; }
    set labelFormatter(labelFormatter: (value: number) => string) {
        this._labelFormatter = labelFormatter;
        this.reportMutation();
    }

    /**
     * Color of the line at value zero.
     */
    get zeroLineColor() { return this._zeroLineColor; }
    set zeroLineColor(zeroLineColor: string) {
        this._zeroLineColor = zeroLineColor;
        this.reportMutation();
    }

    /**
     * Width of the line at value zero.
     */
    get zeroLineWidth() { return this._zeroLineWidth; }
    set zeroLineWidth(zeroLineWidth: number) {
        this._zeroLineWidth = zeroLineWidth;
        this.reportMutation();
    }

    /**
     * Dash pattern of the line at value zero.
     */
    get zeroLineDash() { return this._zeroLineDash; }
    set zeroLineDash(zeroLineDash: number[]) {
        this._zeroLineDash = zeroLineDash;
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
     * Value that corresponds with the maximum value on the curve. If undefined,
     * the value is automatically derived from the plot data.
     */
    get maximum() { return this._maximum; }
    set maximum(maximum: number | undefined) {
        this._maximum = maximum;
        this.processData();
        this.reportMutation();
    }

    get lines() { return this._lines; }
    set lines(lines: Line[]) {
        this._lines = lines;
        this.processData();
        this.reportMutation();
    }
}
