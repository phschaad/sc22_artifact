import { Container } from 'pixi.js';
import { Program } from '../program';
import { HdiffBadLayoutBadOrder } from './hdiff_bad_layout_bad_order';
import { HdiffGoodLayoutBadOrder } from './hdiff_good_layout_bad_order';
import { HdiffGoodLayoutGoodOrder } from './hdiff_good_layout_good_order';
import { HdiffGoodLayoutGoodOrderAligned } from './hdiff_good_layout_good_order_aligned';

export class HdiffSideBySide extends Program {

    constructor(stage: Container, x: number, y: number) {
        super(stage, x, y);

        const badLayoutBadOrder = HdiffBadLayoutBadOrder.generateGraph();
        const goodLayoutBadOrder = HdiffGoodLayoutBadOrder.generateGraph();
        const goodLayoutGoodOrder = HdiffGoodLayoutGoodOrder.generateGraph();
        const aligned = HdiffGoodLayoutGoodOrderAligned.generateGraph();

        badLayoutBadOrder.position.set(0, 0);
        goodLayoutBadOrder.position.set(
            0, badLayoutBadOrder.height + 100
        );
        goodLayoutGoodOrder.position.set(
            0, goodLayoutBadOrder.y + goodLayoutBadOrder.height + 100
        );
        aligned.position.set(
            0, goodLayoutGoodOrder.y + goodLayoutGoodOrder.height + 100
        );

        this.addGraph(badLayoutBadOrder);
        this.addGraph(goodLayoutBadOrder);
        this.addGraph(goodLayoutGoodOrder);
        this.addGraph(aligned);
    }

}