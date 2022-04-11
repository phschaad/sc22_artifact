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

export class MatMult extends Program {

    constructor(stage: Container, x: number, y: number) {
        super(stage, x, y);

        const graph = new Graph();

        const N = new DataDimension('N', 9);
        const M = new DataDimension('M', 15);
        const K = new DataDimension('K', 10);

        const A = new DataContainer('A', [N, K]);
        const B = new DataContainer('B', [K, M], true);
        const C = new DataContainer('C', [N, M]);

        const memA = new MemoryNode(graph, A, false, 15);
        graph.registerMemoryNode(A, memA, AccessMode.ReadOnly);
        const memB = new MemoryNode(graph, B, false, 15);
        graph.registerMemoryNode(B, memB, AccessMode.ReadOnly);
        const memC = new MemoryNode(graph, C, true, 15);
        graph.registerMemoryNode(C, memC, AccessMode.Write);

        const accessOrder: SymbolicDataAccess[] = [
            {
                dataContainer: A,
                accessMode: AccessMode.ReadOnly,
                index: ['i', 'k'],
            },
            {
                dataContainer: B,
                accessMode: AccessMode.ReadOnly,
                index: ['k', 'j'],
            },
            {
                dataContainer: C,
                accessMode: AccessMode.ReadOnly,
                index: ['i', 'j'],
            },
            {
                dataContainer: C,
                accessMode: AccessMode.Write,
                index: ['i', 'j'],
            },
        ];

        const computation = new ComputationNode(
            graph, 'C[i, j] += A[i, k] * B[k, j]',
            accessOrder, false
        );

        const subgraph = new Graph();
        subgraph.addChild(computation);

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
                    end: M.value,
                    step: 1,
                },
                {
                    itvar: 'k',
                    start: 0,
                    end: K.value,
                    step: 1,
                },
            ],
            subgraph, undefined, undefined, 30
        );
        map.position.set(0, 260);

        const midpoint = map.width / 2;
        memA.position.set((midpoint / 2) - (memA.unscaledWidth / 2), 0);
        memB.position.set((midpoint + (midpoint / 2)) - (memB.unscaledWidth / 2), 0);
        memC.position.set(midpoint - (memC.unscaledWidth / 2), 560);

        graph.addChild(memA);
        graph.addChild(memB);
        graph.addChild(memC);
        graph.addChild(map);

        graph.addChild(new MemoryMovementEdge(
            '', graph, memA, map
        ));
        graph.addChild(new MemoryMovementEdge(
            '', graph, memB, map
        ));
        graph.addChild(new MemoryMovementEdge(
            '', graph, map, memC
        ));

        this.addGraph(graph);
    }

}
