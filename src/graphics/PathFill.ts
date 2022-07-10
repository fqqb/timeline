import { FillStyle } from './FillStyle';
import { Path } from './Path';

/**
 * Properties to be provided with {@link Graphics.fillPath}.
 */
export interface PathFill {
    path: Path;
    fill: FillStyle;
}
