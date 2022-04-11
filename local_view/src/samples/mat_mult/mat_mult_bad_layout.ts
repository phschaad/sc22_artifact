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

export class MatMultBadLayout extends Program {

    constructor(stage: Container, x: number, y: number) {
        super(stage, x, y);

        const graph = new Graph();

        const N = new DataDimension('N', 16);
        const M = new DataDimension('M', 64);
        const K = new DataDimension('K', 16);

        const A = new DataContainer('A', [N, K]);
        const B = new DataContainer('B', [K, M]);
        const C = new DataContainer('C', [N, M]);

        const memA = new MemoryNode(graph, A, false);
        graph.registerMemoryNode(A, memA, AccessMode.ReadOnly);
        memA.position.set(0, 0);
        const memB = new MemoryNode(graph, B, false);
        graph.registerMemoryNode(B, memB, AccessMode.ReadOnly);
        memB.position.set(370, 0);
        const memC = new MemoryNode(graph, C, true);
        graph.registerMemoryNode(C, memC, AccessMode.Write);
        memC.position.set(65, 760);

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
            subgraph
        );
        map.position.set(0, 450);

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
