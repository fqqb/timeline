import { FillStyle } from '../../graphics/FillStyle';

export interface ShapeStyle {
    fill: FillStyle;
    borderWidth: number;
    borderColor: string;
    borderDash?: number[];
}
