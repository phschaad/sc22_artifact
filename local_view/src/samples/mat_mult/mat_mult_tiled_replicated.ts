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

export class MatMultTiledReplicated extends Program {

    constructor(stage: Container, x: number, y: number) {
        super(stage, x, y);

        const graph = new Graph();

        const N = new DataDimension('N', 8);
        const M = new DataDimension('M', 32);
        const K = new DataDimension('K', 8);

        const tileN = new DataDimension('tileN', 4);
        const tileM = new DataDimension('tileM', 4);
        const tileK = new DataDimension('tileK', 4);

        const A = new DataContainer('A', [N, K]);
        const B = new DataContainer('B', [K, M], true);
        const C = new DataContainer('C', [N, M]);

        const Atile = new DataContainer('tile_A', [tileN, tileK]);
        const Btile = new DataContainer('tile_B', [tileK, tileM], true);
        const Ctile = new DataContainer('tile_C', [tileN, tileM]);

        const memA = new MemoryNode(graph, A, false);
        graph.registerMemoryNode(A, memA, AccessMode.ReadOnly);
        memA.position.set(0, 0);
        const memB = new MemoryNode(graph, B, false);
        graph.registerMemoryNode(B, memB, AccessMode.ReadOnly);
        memB.position.set(387.8, 0);
        const memC = new MemoryNode(graph, C, true);
        graph.registerMemoryNode(C, memC, AccessMode.ReadWrite);
        memC.position.set(135, 1000);

        const accessOrder: SymbolicDataAccess[] = [
            {
                dataContainer: Atile,
                accessMode: AccessMode.ReadOnly,
                index: ['i', 'k'],
            },
            {
                dataContainer: Btile,
                accessMode: AccessMode.ReadOnly,
                index: ['k', 'j'],
            },
            {
                dataContainer: Ctile,
                accessMode: AccessMode.ReadOnly,
                index: ['i', 'j'],
            },
            {
                dataContainer: Ctile,
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
                    end: 'ti+' + tileN.value.toString(),
                    step: 1,
                    freeSymbol: 'ti',
                    freeSymbolDefault: 0,
                },
                {
                    itvar: 'j',
                    start: 'tj',
                    end: 'tj+' + tileM.value.toString(),
                    step: 1,
                    freeSymbol: 'tj',
                    freeSymbolDefault: 0,
                },
                {
                    itvar: 'k',
                    start: 'tk',
                    end: 'tk+' + tileK.value.toString(),
                    step: 1,
                    freeSymbol: 'tk',
                    freeSymbolDefault: 0,
                },
            ],
            compSubgraph
        );
        innerMap.position.set(0, 150);

        const outerSubgraph = new Graph();
        outerSubgraph.addChild(innerMap);

        const memTileA = new MemoryNode(outerSubgraph, Atile);
        outerSubgraph.registerMemoryNode(Atile, memTileA, AccessMode.ReadOnly);
        memTileA.position.set(100, 0);
        const memTileB = new MemoryNode(outerSubgraph, Btile);
        outerSubgraph.registerMemoryNode(Btile, memTileB, AccessMode.ReadOnly);
        memTileB.position.set(300, 0);
        const memTileC = new MemoryNode(outerSubgraph, Ctile, true);
        outerSubgraph.registerMemoryNode(Ctile, memTileC, AccessMode.ReadOnly);
        memTileC.position.set(200, 450);

        outerSubgraph.addChild(new MemoryMovementEdge(
            '', outerSubgraph, memTileA, innerMap
        ));
        outerSubgraph.addChild(new MemoryMovementEdge(
            '', outerSubgraph, memTileB, innerMap
        ));
        outerSubgraph.addChild(new MemoryMovementEdge(
            '', outerSubgraph, innerMap, memTileC
        ));

        outerSubgraph.addChild(memTileA);
        outerSubgraph.addChild(memTileB);
        outerSubgraph.addChild(memTileC);

        const outerMap = new MapNode(
            graph,
            [
                {
                    itvar: 'ti',
                    start: 0,
                    end: N.value,
                    step: tileN.value,
                },
                {
                    itvar: 'tj',
                    start: 0,
                    end: M.value,
                    step: tileM.value,
                },
                {
                    itvar: 'tk',
                    start: 0,
                    end: K.value,
                    step: tileK.value,
                },
            ],
            outerSubgraph
        );
        outerMap.position.set(30, 200);

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
