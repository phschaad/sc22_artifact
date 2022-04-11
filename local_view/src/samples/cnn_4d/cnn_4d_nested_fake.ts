import { Container } from '@pixi/display';
import { ComputationNode } from '../../elements/computation_node';
import {
    AccessMode,
    DataContainer,
    SymbolicDataAccess
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

        const N = new DataDimension('N', 3);
        const H = new DataDimension('H', 9);
        const W = new DataDimension('W', 9);
        const Cin = new DataDimension('C_in', 3);
        const Cout = new DataDimension('C_out', 2);
        const KX = new DataDimension('Kx', 3);
        const KY = new DataDimension('Ky', 3);
        const Wprime = new DataDimension('W\'', W.value - KX.value + 1);
        const Hprime = new DataDimension('H\'', H.value - KY.value + 1);

        const input = new DataContainer('x', [N, Cin, H, W], false, 8);
        const weights = new DataContainer('w', [Cout, Cin, KY, KX], false, 8);
        const output = new DataContainer('y', [N, Cout, Hprime, Wprime], false, 8);

        const memInput = new MemoryNode(graph, input, false);
        graph.registerMemoryNode(input, memInput, AccessMode.ReadOnly);
        const memWeights = new MemoryNode(graph, weights, false);
        graph.registerMemoryNode(weights, memWeights, AccessMode.ReadOnly);
        const memOutput = new MemoryNode(graph, output, true);
        graph.registerMemoryNode(output, memOutput, AccessMode.Write);

        const accessOrder: SymbolicDataAccess[] = [
            {
                dataContainer: input,
                accessMode: AccessMode.ReadOnly,
                index: ['i', 'm', 'k+ky', 'l+kx'],
            },
            {
                dataContainer: weights,
                accessMode: AccessMode.ReadOnly,
                index: ['j', 'm', 'ky', 'kx'],
            },
            {
                dataContainer: output,
                accessMode: AccessMode.ReadOnly,
                index: ['i', 'j', 'k', 'l'],
            },
            {
                dataContainer: output,
                accessMode: AccessMode.Write,
                index: ['i', 'j', 'k', 'l'],
            },
        ];

        const computation = new ComputationNode(
            graph, 'y[i, j, k, l] += x[i, m, k+ky, l+kx] * w[j, m, ky, kx]',
            accessOrder, false
        );

        const computationSubgraph = new Graph();
        computationSubgraph.addChild(computation);

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
                    end: Cout.value,
                    step: 1,
                },
                {
                    itvar: 'k',
                    start: 0,
                    end: Wprime.value,
                    step: 1,
                },
                {
                    itvar: 'l',
                    start: 0,
                    end: Hprime.value,
                    step: 1,
                },
                {
                    itvar: 'm',
                    start: 0,
                    end: Cin.value,
                    step: 1,
                },
                {
                    itvar: 'ky',
                    start: 0,
                    end: KY.value,
                    step: 1,
                },
                {
                    itvar: 'kx',
                    start: 0,
                    end: KX.value,
                    step: 1,
                },
            ],
            computationSubgraph
        );

        computationSubgraph.position.x = (map.width / 2) - (computationSubgraph.width / 2);

        map.position.set(0, 600);
        const midpoint = map.width / 2;
        
        memInput.position.set((midpoint - midpoint / 2) - (memInput.unscaledWidth / 2), 0);
        memWeights.position.set((midpoint + midpoint / 2) - (memWeights.unscaledWidth / 2), 120);
        memOutput.position.set(midpoint - (memOutput.unscaledWidth / 2), 940);

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
