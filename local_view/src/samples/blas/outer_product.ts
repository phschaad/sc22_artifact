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

export class OuterProduct extends Program {

    constructor(stage: Container, x: number, y: number) {
        super(stage, x, y);

        const graph = new Graph();

        const N = new DataDimension('N', 3);
        const M = new DataDimension('N', 4);

        const A = new DataContainer('A', [N]);
        const B = new DataContainer('B', [M]);
        const C = new DataContainer('C', [N, M]);

        const memA = new MemoryNode(graph, A, false, 20);
        graph.registerMemoryNode(A, memA, AccessMode.ReadOnly);
        const memB = new MemoryNode(graph, B, false, 20);
        graph.registerMemoryNode(B, memB, AccessMode.ReadOnly);
        const memC = new MemoryNode(graph, C, true, 20);
        graph.registerMemoryNode(C, memC, AccessMode.Write);

        const accessOrder: SymbolicDataAccess[] = [
            {
                dataContainer: A,
                accessMode: AccessMode.ReadOnly,
                index: ['i'],
            },
            {
                dataContainer: B,
                accessMode: AccessMode.ReadOnly,
                index: ['j'],
            },
            {
                dataContainer: C,
                accessMode: AccessMode.Write,
                index: ['i', 'j'],
            },
        ];

        const compuptation = new ComputationNode(
            graph, 'C[i, j] = A[i] * B[j]', accessOrder, false
        );

        const subgraph = new Graph();
        subgraph.addChild(compuptation);

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
            ],
            subgraph, undefined, undefined, 30
        );
        map.position.set(0, 120);

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

        memA.position.set(map.x + (map.width / 4) - (memA.unscaledWidth / 2), 0);
        memB.position.set(map.x + (3 * map.width / 4) - (memB.unscaledWidth / 2), 0);
        memC.position.set(map.x + (map.width / 2) - (memC.unscaledWidth / 2), 380);

        this.addGraph(graph);
    }

}
