import { FillStyle } from '../../graphics/FillStyle';
import { Graphics } from '../../graphics/Graphics';
import { Band } from '../Band';
import { State } from './State';
import { StateClickEvent } from './StateClickEvent';
import { StateMouseEvent } from './StateMouseEvent';
/**
 * Draw discrete state changes.
 */
export declare class StateBand extends Band {
    private _contentHeight;
    private _stateBackground;
    private _stateDividerColor;
    private _stateDividerWidth;
    private _stateDividerDash;
    private _stateCursor;
    private _stateFontFamily;
    private _stateHoverBackground;
    private _stateMarginLeft;
    private _stateTextColor;
    private _stateTextSize;
    private _states;
    private statesById;
    private annotatedStates;
    private stateClickListeners;
    private stateMouseEnterListeners;
    private stateMouseMoveListeners;
    private stateMouseLeaveListeners;
    /**
     * Register a listener that receives an update when a state is clicked.
     */
    addStateClickListener(listener: (ev: StateClickEvent) => void): void;
    /**
     * Unregister a previously registered listener to stop receiving
     * state click events.
     */
    removeStateClickListener(listener: (ev: StateClickEvent) => void): void;
    /**
     * Register a listener that receives updates whenever the mouse enters
     * a state.
     */
    addStateMouseEnterListener(listener: (ev: StateMouseEvent) => void): void;
    /**
     * Unregister a previously registered listener to stop receiving
     * state mouse-enter events.
     */
    removeStateMouseEnterListener(listener: (ev: StateMouseEvent) => void): void;
    /**
     * Register a listener that receives updates whenever the mouse is moving
     * over a state.
     */
    addStateMouseMoveListener(listener: (ev: StateMouseEvent) => void): void;
    /**
     * Unregister a previously registered listener to stop receiving
     * state mouse-move events.
     */
    removeStateMouseMoveListener(listener: (ev: StateMouseEvent) => void): void;
    /**
     * Register a listener that receives updates whenever the mouse is moving
     * outside a state.
     */
    addStateMouseLeaveListener(listener: (ev: StateMouseEvent) => void): void;
    /**
     * Unregister a previously registered listener to stop receiving
     * state mouse-leave events.
     */
    removeStateMouseLeaveListener(listener: (ev: StateMouseEvent) => void): void;
    private processData;
    calculateContentHeight(g: Graphics): number;
    drawBandContent(g: Graphics): void;
    private measureState;
    private drawState;
    /**
     * The height of the band content (excluding margins).
     */
    get contentHeight(): number;
    set contentHeight(contentHeight: number);
    /**
     * List of states to be drawn on this band.
     */
    get states(): State[];
    set states(states: State[]);
    /**
     * Background color of states belonging to this band.
     */
    get stateBackground(): FillStyle;
    set stateBackground(stateBackground: FillStyle);
    /**
     * Color of the divider indicating a state change.
     */
    get stateDividerColor(): string;
    set stateDividerColor(stateDividerColor: string);
    /**
     * Width of the divider that separates states.
     */
    get stateDividerWidth(): number;
    set stateDividerWidth(stateDividerWidth: number);
    /**
     * Dash pattern of the divider that separates states.
     */
    get stateDividerDash(): number[];
    set stateDividerDash(stateDividerDash: number[]);
    /**
     * Text color of states belonging to this band.
     */
    get stateTextColor(): string;
    set stateTextColor(stateTextColor: string);
    /**
     * Text size of states belonging to this band.
     */
    get stateTextSize(): number;
    set stateTextSize(stateTextSize: number);
    /**
     * Font family of states belonging to this band.
     */
    get stateFontFamily(): string;
    set stateFontFamily(stateFontFamily: string);
    /**
     * Whitespace between the left border of a state, and
     * its label.
     */
    get stateMarginLeft(): number;
    set stateMarginLeft(stateMarginLeft: number);
    /**
     * Cursor when mouse hovers a state.
     */
    get stateCursor(): string;
    set stateCursor(stateCursor: string);
    /**
     * State background when hovering.
     *
     * This is drawn on top of the actual state background.
     */
    get stateHoverBackground(): FillStyle;
    set stateHoverBackground(stateHoverBackground: FillStyle);
}
