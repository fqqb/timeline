import { FillStyle } from '../../graphics/FillStyle';
import { Graphics } from '../../graphics/Graphics';
import { Band } from '../Band';
import { Line } from './Line';
import { PointClickEvent } from './PointClickEvent';
import { PointHoverEvent } from './PointHoverEvent';
/**
 * Band type that plots a line along the timeline.
 */
export declare class LinePlot extends Band {
    private _fill;
    private _lineColor;
    private _lineWidth;
    private _labelFontFamily;
    private _labelBackground;
    private _labelTextColor;
    private _labelTextSize;
    private _minimum?;
    private _maximum?;
    private _pointRadius;
    private _pointHoverRadius;
    private _pointColor;
    private _lines;
    private _contentHeight;
    private _zeroLineColor;
    private _zeroLineWidth;
    private _zeroLineDash;
    private _labelFormatter;
    private annotatedLines;
    private viewMinimum?;
    private viewMaximum?;
    private pointClickListeners;
    private pointHoverListeners;
    /**
     * Register a listener that receives an update when a point on
     * a Line is clicked.
     */
    addPointClickListener(listener: (ev: PointClickEvent) => void): void;
    /**
     * Unregister a previously registered listener to stop receiving
     * click events.
     */
    removePointClickListener(listener: (ev: PointClickEvent) => void): void;
    /**
     * Register a listener that receives an update when a point on a
     * Line is hovered.
     */
    addPointHoverListener(listener: (ev: PointHoverEvent) => void): void;
    /**
     * Unregister a previously registered listener to stop receiving
     * hover events.
     */
    removePointHoverListener(listener: (ev: PointHoverEvent) => void): void;
    private processData;
    calculateContentHeight(g: Graphics): number;
    drawBandContent(g: Graphics): void;
    private drawArea;
    private drawLine;
    /**
     * The height of the band content (excluding margins).
     */
    get contentHeight(): number;
    set contentHeight(contentHeight: number);
    /**
     * Color of the line that connects data points.
     */
    get lineColor(): string;
    set lineColor(lineColor: string);
    /**
     * Thickness of the plot line.
     */
    get lineWidth(): number;
    set lineWidth(lineWidth: number);
    /**
     * Area fill between the plot line and the value 0.
     */
    get fill(): FillStyle;
    set fill(fill: FillStyle);
    /**
     * Color of the point symbol.
     */
    get pointColor(): string;
    set pointColor(pointColor: string);
    /**
     * Radius of the point symbol.
     */
    get pointRadius(): number;
    set pointRadius(pointRadius: number);
    /**
     * Radius of the point symbol when hovered.
     */
    get pointHoverRadius(): number;
    set pointHoverRadius(pointHoverRadius: number);
    /**
     * Font family of any value labels.
     */
    get labelFontFamily(): string;
    set labelFontFamily(labelFontFamily: string);
    /**
     * Background color of any value labels.
     */
    get labelBackground(): FillStyle;
    set labelBackground(labelBackground: FillStyle);
    /**
     * Text color of any value labels.
     */
    get labelTextColor(): string;
    set labelTextColor(labelTextColor: string);
    /**
     * Size of any value labels.
     */
    get labelTextSize(): number;
    set labelTextSize(labelTextSize: number);
    /**
     * Function that formats a point value to string.
     *
     * The default behaviour is to format with 2 digits after the
     * decimal point.
     */
    get labelFormatter(): (value: number) => string;
    set labelFormatter(labelFormatter: (value: number) => string);
    /**
     * Color of the line at value zero.
     */
    get zeroLineColor(): string;
    set zeroLineColor(zeroLineColor: string);
    /**
     * Width of the line at value zero.
     */
    get zeroLineWidth(): number;
    set zeroLineWidth(zeroLineWidth: number);
    /**
     * Dash pattern of the line at value zero.
     */
    get zeroLineDash(): number[];
    set zeroLineDash(zeroLineDash: number[]);
    /**
     * Value that corresponds with the minimum value on the curve. If undefined,
     * the value is automatically derived from the plot data.
     */
    get minimum(): number | undefined;
    set minimum(minimum: number | undefined);
    /**
     * Value that corresponds with the maximum value on the curve. If undefined,
     * the value is automatically derived from the plot data.
     */
    get maximum(): number | undefined;
    set maximum(maximum: number | undefined);
    get lines(): Line[];
    set lines(lines: Line[]);
}
