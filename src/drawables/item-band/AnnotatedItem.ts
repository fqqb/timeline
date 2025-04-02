import { HitRegionSpecification } from '../../graphics/HitRegionSpecification';
import { DrawInfo } from './DrawInfo';
import { Item } from './Item';

export interface AnnotatedItem extends Item {
    region: HitRegionSpecification;
    hovered: boolean;
    drawInfo?: DrawInfo;
}
