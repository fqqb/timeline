import { Graphics } from '../../graphics/Graphics';
import { Band } from '../Band';
import { ScaleKind } from './ScaleKind';
/**
 * A ruler that interprets time as milliseconds since January 01, 1970, 00:00:00 UTC.
 * Same as JavaScript Date.
 */
export declare class TimeRuler extends Band {
    private _contentHeight;
    private _textColor;
    private _fullHeight;
    private _timezone?;
    private _scale;
    private hourScale;
    private quarterDayScale;
    private weekDayScale;
    private weekScale;
    private monthScale;
    private yearScale;
    private decadeScale;
    private orderedScales;
    private scaleRenderer?;
    calculateContentHeight(g: Graphics): number;
    drawBandContent(g: Graphics): void;
    drawUnderlay(g: Graphics): void;
    /**
     * The height of the band content (excluding margins).
     */
    get contentHeight(): number;
    set contentHeight(contentHeight: number);
    get fullHeight(): boolean;
    set fullHeight(fullHeight: boolean);
    get textColor(): string;
    set textColor(textColor: string);
    /**
     * Set the timezone by which to format scale labels. If undefined, the local timezone is used.
     */
    get timezone(): string | undefined;
    set timezone(timezone: string | undefined);
    /**
     * The scale for this ruler. Scales render ticks and labels.
     *
     * If undefined, an automatic scale is determined based
     * on the visible time range.
     */
    get scale(): ScaleKind;
    set scale(scale: ScaleKind);
    private determineScale;
}
