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

export class MatMultTiled extends Program {

    constructor(stage: Container, x: number, y: number) {
        super(stage, x, y);

        const graph = new Graph();

        const N = new DataDimension('N', 16);
        const M = new DataDimension('M', 64);
        const K = new DataDimension('K', 16);

        const tileN = 8;
        const tileM = 8;
        const tileK = 8;

        const A = new DataContainer('A', [N, K]);
        const B = new DataContainer('B', [K, M], true);
        const C = new DataContainer('C', [N, M]);

        const memA = new MemoryNode(graph, A, false);
        graph.registerMemoryNode(A, memA, AccessMode.ReadOnly);
        memA.position.set(0, 0);
        const memB = new MemoryNode(graph, B, false);
        graph.registerMemoryNode(B, memB, AccessMode.ReadOnly);
        memB.position.set(280, 0);
        const memC = new MemoryNode(graph, C, true);
        graph.registerMemoryNode(C, memC, AccessMode.ReadWrite);
        memC.position.set(0, 800);

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

        const compSubgraph = new Graph();
        compSubgraph.addChild(computation);

        const innerMap = new MapNode(
            graph,
            [
                {
                    itvar: 'i',
                    start: 'ti',
                    //end: 'ti+3',
                    end: 'ti+' + tileN.toString(),
                    step: 1,
                    freeSymbol: 'ti',
                    freeSymbolDefault: 0,
                },
                {
                    itvar: 'j',
                    start: 'tj',
                    end: 'tj+' + tileM.toString(),
                    step: 1,
                    freeSymbol: 'tj',
                    freeSymbolDefault: 0,
                },
                {
                    itvar: 'k',
                    start: 'tk',
                    end: 'tk+' + tileK.toString(),
                    step: 1,
                    freeSymbol: 'tk',
                    freeSymbolDefault: 0,
                },
            ],
            compSubgraph
        );

        const outerSubgraph = new Graph();
        outerSubgraph.addChild(innerMap);

        const outerMap = new MapNode(
            graph,
            [
                {
                    itvar: 'ti',
                    start: 0,
                    end: N.value,
                    step: tileN,
                },
                {
                    itvar: 'tj',
                    start: 0,
                    end: M.value,
                    step: tileM,
                },
                {
                    itvar: 'tk',
                    start: 0,
                    end: K.value,
                    step: tileK,
                },
            ],
            outerSubgraph
        );
        outerMap.position.set(60, 300);

        graph.addChild(memA);
        graph.addChild(memB);
        graph.addChild(memC);
        graph.addChild(outerMap);

        graph.addChild(new MemoryMovementEdge(
            '', graph, memA, outerMap
        ));
        graph.addChild(new MemoryMovementEdge(
            '', graph, memB, outerMap
        ));
        graph.addChild(new MemoryMovementEdge(
            '', graph, outerMap, memC
        ));

        this.addGraph(graph);
    }

}
