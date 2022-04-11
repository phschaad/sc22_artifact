import { Container } from '@pixi/display';
import { ComputationNode } from '../../elements/computation_node';
import {
    AccessMode,
    DataContainer,
    SymbolicDataAccess,
} from '../../elements/data_container';
import { DataDimension } from '../../elements/dimensions';
import { MapNode } from '../../elements/map_node';
import { MemoryNode } from '../../elements/memory_node';
import { Graph } from '../../graph/graph';
import { Program } from '../program';

export class DotProduct extends Program {

    constructor(stage: Container, x: number, y: number) {
        super(stage, x, y);

        const graph = new Graph();

        const N = new DataDimension('N', 3);
        const M = new DataDimension('M', 1);

        const A = new DataContainer('A', [N]);
        const B = new DataContainer('B', [N]);
        const C = new DataContainer('C', [M]);

        const memA = new MemoryNode(graph, A, false);
        graph.registerMemoryNode(A, memA, AccessMode.ReadOnly);
        memA.position.set(50, 0);
        const memB = new MemoryNode(graph, B, false);
        graph.registerMemoryNode(B, memB, AccessMode.ReadOnly);
        memB.position.set(270, 0);
        const memC = new MemoryNode(graph, C, true);
        graph.registerMemoryNode(C, memC, AccessMode.Write);
        memC.position.set(165, 420);

        const accessOrder: SymbolicDataAccess[] = [
            {
                dataContainer: A,
                accessMode: AccessMode.ReadOnly,
                index: ['i'],
            },
            {
                dataContainer: B,
                accessMode: AccessMode.ReadOnly,
                index: ['i'],
            },
            {
                dataContainer: C,
                accessMode: AccessMode.Write,
                index: ['0'],
            },
        ];

        const computation = new ComputationNode(
            graph, 'C[0] = A[i] * B[i]', accessOrder, false
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
                }
            ],
            subgraph
        );
        map.position.set(0, 150);

        graph.addChild(memA);
        graph.addChild(memB);
        graph.addChild(memC);
        graph.addChild(map);

        this.addGraph(graph);
    }

}
