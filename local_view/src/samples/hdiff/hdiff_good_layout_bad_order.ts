import { Container } from 'pixi.js';
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

export class HdiffGoodLayoutBadOrder extends Program {

    constructor(stage: Container, x: number, y: number) {
        super(stage, x, y);

        this.addGraph(HdiffGoodLayoutBadOrder.generateGraph());
    }

    public static generateGraph(): Graph {
        const graph = new Graph();

        const I = new DataDimension('I', 9);
        const Ip4 = new DataDimension('I+4', I.value + 4)
        const J = new DataDimension('J', 9);
        const Jp4 = new DataDimension('J+4', J.value + 4);
        const K = new DataDimension('K', 5);

        const infield = new DataContainer('in_field [K, I+4, J+4]', [K, Ip4, Jp4], false, 8);
        const outfield = new DataContainer('out_field [K, I, J]', [K, I, J], false, 8);
        const coeff = new DataContainer('coeff [K, I, J]', [K, I, J], false, 8);

        const infieldMem = new MemoryNode(graph, infield, false);
        const outfieldMem = new MemoryNode(graph, outfield, true);
        const coeffMem = new MemoryNode(graph, coeff, false);

        graph.registerMemoryNode(infield, infieldMem, AccessMode.ReadOnly);
        graph.registerMemoryNode(coeff, coeffMem, AccessMode.ReadOnly);
        graph.registerMemoryNode(outfield, outfieldMem, AccessMode.Write);

        graph.addChild(infieldMem);
        graph.addChild(outfieldMem);
        graph.addChild(coeffMem);

        const i0j2: SymbolicDataAccess = {
            dataContainer: infield,
            accessMode: AccessMode.ReadOnly,
            index: ['k', 'i', 'j+2'],
        };
        const i1j1: SymbolicDataAccess = {
            dataContainer: infield,
            accessMode: AccessMode.ReadOnly,
            index: ['k', 'i+1', 'j+1'],
        };
        const i1j2: SymbolicDataAccess = {
            dataContainer: infield,
            accessMode: AccessMode.ReadOnly,
            index: ['k', 'i+1', 'j+2'],
        };
        const i1j3: SymbolicDataAccess = {
            dataContainer: infield,
            accessMode: AccessMode.ReadOnly,
            index: ['k', 'i+1', 'j+3'],
        };
        const i2j0: SymbolicDataAccess = {
            dataContainer: infield,
            accessMode: AccessMode.ReadOnly,
            index: ['k', 'i+2', 'j'],
        };
        const i2j1: SymbolicDataAccess = {
            dataContainer: infield,
            accessMode: AccessMode.ReadOnly,
            index: ['k', 'i+2', 'j+1'],
        };
        const i2j2: SymbolicDataAccess = {
            dataContainer: infield,
            accessMode: AccessMode.ReadOnly,
            index: ['k', 'i+2', 'j+2'],
        };
        const i2j3: SymbolicDataAccess = {
            dataContainer: infield,
            accessMode: AccessMode.ReadOnly,
            index: ['k', 'i+2', 'j+3'],
        };
        const i2j4: SymbolicDataAccess = {
            dataContainer: infield,
            accessMode: AccessMode.ReadOnly,
            index: ['k', 'i+2', 'j+4'],
        };
        const i3j1: SymbolicDataAccess = {
            dataContainer: infield,
            accessMode: AccessMode.ReadOnly,
            index: ['k', 'i+3', 'j+1'],
        };
        const i3j2: SymbolicDataAccess = {
            dataContainer: infield,
            accessMode: AccessMode.ReadOnly,
            index: ['k', 'i+3', 'j+2'],
        };
        const i3j3: SymbolicDataAccess = {
            dataContainer: infield,
            accessMode: AccessMode.ReadOnly,
            index: ['k', 'i+3', 'j+3'],
        };
        const i4j2: SymbolicDataAccess = {
            dataContainer: infield,
            accessMode: AccessMode.ReadOnly,
            index: ['k', 'i+4', 'j+2'],
        };
        const coeffijk: SymbolicDataAccess = {
            dataContainer: coeff,
            accessMode: AccessMode.ReadOnly,
            index: ['k', 'i', 'j'],
        };
        const outfieldijk: SymbolicDataAccess = {
            dataContainer: outfield,
            accessMode: AccessMode.Write,
            index: ['k', 'i', 'j'],
        };

        const accessOrder: SymbolicDataAccess[] = [
            i3j2,
            i4j2, i2j2,
            i3j3,
            i3j1,
            i3j2, i2j2,
            i1j2,
            i2j2, i0j2,
            i1j3,
            i1j1,
            i1j3, i1j3, i1j2,
            i2j3, i2j1,
            i2j2, i1j2,
            i2j3, i3j3, i1j3,
            i2j4,
            i1j2,
            i2j3, i2j2,
            i2j1, i3j1,
            i1j1, i2j2,
            i2j0, i2j2,
            i2j1, coeffijk,
            i2j2,
            outfieldijk,
        ];

        const computationString = 'hdiff';
        const computation = new ComputationNode(
            graph, computationString, accessOrder, false
        );

        const compSubgraph = new Graph();
        compSubgraph.addChild(computation);

        const map = new MapNode(
            graph,
            [
                {
                    itvar: 'i',
                    start: 0,
                    end: I.value,
                    step: 1,
                },
                {
                    itvar: 'j',
                    start: 0,
                    end: J.value,
                    step: 1,
                },
                {
                    itvar: 'k',
                    start: 0,
                    end: K.value,
                    step: 1,
                },
            ],
            compSubgraph
        );
        graph.addChild(map);

        graph.addChild(new MemoryMovementEdge(
            '', graph, infieldMem, map
        ));
        graph.addChild(new MemoryMovementEdge(
            '', graph, coeffMem, map
        ));
        graph.addChild(new MemoryMovementEdge(
            '', graph, map, outfieldMem
        ));

        infieldMem.position.set(0, 0);
        coeffMem.position.set(420, 230);

        map.position.set(300, 500);

        outfieldMem.position.set((map.x + map.width / 2) - outfieldMem.unscaledWidth / 2, 880);

        return graph;
    }

}