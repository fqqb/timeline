import { AnnotatedItem } from './AnnotatedItem';

export interface ItemLayoutStrategy {

    wrapItems(items: AnnotatedItem[]): AnnotatedItem[][];
}
