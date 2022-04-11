import { Container } from '@pixi/display';
import { ComputationNode } from '../../elements/computation_node';
import {
    AccessMode,
    DataContainer,
    SymbolicDataAccess,
} from '../../elements/data_container';
import { DataDimension } from '../../elements/dimensions';
import { MapNode } from '../../elements/map_node';
import { MemoryMovementEdge } from '../../elements/memory_movement_edge';
import { MemoryNode } from '../../elements/memory_node';
import { Graph } from '../../graph/graph';
import { Program } from '../program';

export class Conv4DNested extends Program {

    constructor(stage: Container, x: number, y: number) {
        super(stage, x, y);

        const graph = new Graph();

        const N = new DataDimension('N', 4);
        const H = new DataDimension('H', 6);
        const W = new DataDimension('W', 5);
        const C = new DataDimension('C', 3);
        const KX = new DataDimension('Kx', 2);
        const KY = new DataDimension('Ky', 4);
        const Wprime = new DataDimension('W\'', W.value - KX.value + 1);
        const Hprime = new DataDimension('H\'', H.value - KY.value + 1);

        const input = new DataContainer('x', [N, C, H, W]);
        const weights = new DataContainer('w', [C, C, KY, KX]);
        const output = new DataContainer('y', [N, C, Hprime, Wprime]);

        const memInput = new MemoryNode(graph, input, false);
        graph.registerMemoryNode(input, memInput, AccessMode.ReadOnly);
        memInput.position.set(0, 0);
        const memWeights = new MemoryNode(graph, weights, false);
        graph.registerMemoryNode(weights, memWeights, AccessMode.ReadOnly);
        memWeights.position.set(850, 0);
        const memOutput = new MemoryNode(graph, output, true);
        graph.registerMemoryNode(output, memOutput, AccessMode.Write);
        memOutput.position.set(285, 1900);

        const accessOrder: SymbolicDataAccess[] = [
            {
                dataContainer: input,
                accessMode: AccessMode.ReadOnly,
                index: ['i', 'm', 'k+ky', 'l+kx'],
            },
            {
                dataContainer: weights,
                accessMode: AccessMode.ReadOnly,
                index: ['i', 'm', 'ky', 'kx'],
            },
            {
                dataContainer: output,
                accessMode: AccessMode.Write,
                index: ['i', 'j', 'k', 'l'],
            },
        ];

        const computation = new ComputationNode(
            graph, 'y[i, j, k, l] = x[i, m, k+ky, l+kx] * w[j, m, ky, kx]',
            accessOrder, false
        );

        const computationSubgraph = new Graph();
        computationSubgraph.addChild(computation);

        const map4 = new MapNode(
            graph,
            [
                {
                    itvar: 'kx',
                    start: 0,
                    end: KX.value,
                    step: 1,
                },
            ],
            computationSubgraph
        );

        const subgraph4 = new Graph();
        subgraph4.addChild(map4);

        const map3 = new MapNode(
            graph,
            [
                {
                    itvar: 'ky',
                    start: 0,
                    end: KY.value,
                    step: 1,
                },
            ],
            subgraph4
        );

        const subgraph3 = new Graph();
        subgraph3.addChild(map3);

        const map2 = new MapNode(
            graph,
            [
                {
                    itvar: 'm',
                    start: 0,
                    end: C.value,
                    step: 1,
                },
            ],
            subgraph3
        );

        const subgraph2 = new Graph();
        subgraph2.addChild(map2);

        const map = new MapNode(
            graph,
            [
                {
                    itvar: 'i',
                    start: 0,
                    end: N.value,
                    step: 1,
                },
                {
                    itvar: 'j',
                    start: 0,
                    end: C.value,
                    step: 1,
                },
                {
                    itvar: 'k',
                    start: 0,
                    end: Hprime.value,
                    step: 1,
                },
                {
                    itvar: 'l',
                    start: 0,
                    end: Wprime.value,
                    step: 1,
                },
            ],
            subgraph2
        );
        map.position.set(50, 1000);

        graph.addChild(memInput);
        graph.addChild(memWeights);
        graph.addChild(memOutput);
        graph.addChild(map);

        graph.addChild(new MemoryMovementEdge(
            '', graph, memInput, map
        ));
        graph.addChild(new MemoryMovementEdge(
            '', graph, memWeights, map
        ));
        graph.addChild(new MemoryMovementEdge(
            '', graph, map, memOutput
        ));

        this.addGraph(graph);
    }

}
