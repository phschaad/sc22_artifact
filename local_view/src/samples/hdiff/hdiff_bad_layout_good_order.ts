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

export class HdiffBadLayoutGoodOrder extends Program {

    constructor(stage: Container, x: number, y: number) {
        super(stage, x, y);

        this.addGraph(HdiffBadLayoutGoodOrder.generateGraph());
    }

    public static generateGraph(): Graph {
        const graph = new Graph();

        const I = new DataDimension('I', 8);
        const Ip4 = new DataDimension('I+4', I.value + 4)
        const J = new DataDimension('J', 8);
        const Jp4 = new DataDimension('J+4', J.value + 4);
        const K = new DataDimension('K', 5);

        const infield = new DataContainer('in_field [I+4, J+4, K]', [Ip4, Jp4, K]);
        const outfield = new DataContainer('out_field [I, J, K]', [I, J, K]);
        const coeff = new DataContainer('coeff [I, J, K]', [I, J, K]);

        const infieldMem = new MemoryNode(graph, infield, false);
        const outfieldMem = new MemoryNode(graph, outfield, true);
        const coeffMem = new MemoryNode(graph, coeff, false);

        graph.registerMemoryNode(infield, infieldMem, AccessMode.ReadOnly);
        graph.registerMemoryNode(coeff, coeffMem, AccessMode.ReadOnly);
        graph.registerMemoryNode(outfield, outfieldMem, AccessMode.Write);

        graph.addChild(infieldMem);
        graph.addChild(outfieldMem);
        graph.addChild(coeffMem);

        //const i0j2: SymbolicDataAccess = {
        //    dataContainer: infield,
        //    accessMode: AccessMode.ReadOnly,
        //    index: ['k', 'i', 'j+2'],
        //};
        //const i1j1: SymbolicDataAccess = {
        //    dataContainer: infield,
        //    accessMode: AccessMode.ReadOnly,
        //    index: ['k', 'i+1', 'j+1'],
        //};
        //const i1j2: SymbolicDataAccess = {
        //    dataContainer: infield,
        //    accessMode: AccessMode.ReadOnly,
        //    index: ['k', 'i+1', 'j+2'],
        //};
        //const i1j3: SymbolicDataAccess = {
        //    dataContainer: infield,
        //    accessMode: AccessMode.ReadOnly,
        //    index: ['k', 'i+1', 'j+3'],
        //};
        //const i2j0: SymbolicDataAccess = {
        //    dataContainer: infield,
        //    accessMode: AccessMode.ReadOnly,
        //    index: ['k', 'i+2', 'j'],
        //};
        //const i2j1: SymbolicDataAccess = {
        //    dataContainer: infield,
        //    accessMode: AccessMode.ReadOnly,
        //    index: ['k', 'i+2', 'j+1'],
        //};
        //const i2j2: SymbolicDataAccess = {
        //    dataContainer: infield,
        //    accessMode: AccessMode.ReadOnly,
        //    index: ['k', 'i+2', 'j+2'],
        //};
        //const i2j3: SymbolicDataAccess = {
        //    dataContainer: infield,
        //    accessMode: AccessMode.ReadOnly,
        //    index: ['k', 'i+2', 'j+3'],
        //};
        //const i2j4: SymbolicDataAccess = {
        //    dataContainer: infield,
        //    accessMode: AccessMode.ReadOnly,
        //    index: ['k', 'i+2', 'j+4'],
        //};
        //const i3j1: SymbolicDataAccess = {
        //    dataContainer: infield,
        //    accessMode: AccessMode.ReadOnly,
        //    index: ['k', 'i+3', 'j+1'],
        //};
        //const i3j2: SymbolicDataAccess = {
        //    dataContainer: infield,
        //    accessMode: AccessMode.ReadOnly,
        //    index: ['k', 'i+3', 'j+2'],
        //};
        //const i3j3: SymbolicDataAccess = {
        //    dataContainer: infield,
        //    accessMode: AccessMode.ReadOnly,
        //    index: ['k', 'i+3', 'j+3'],
        //};
        //const i4j2: SymbolicDataAccess = {
        //    dataContainer: infield,
        //    accessMode: AccessMode.ReadOnly,
        //    index: ['k', 'i+4', 'j+2'],
        //};
        //const coeffijk: SymbolicDataAccess = {
        //    dataContainer: coeff,
        //    accessMode: AccessMode.ReadOnly,
        //    index: ['k', 'i', 'j'],
        //};
        //const outfieldijk: SymbolicDataAccess = {
        //    dataContainer: outfield,
        //    accessMode: AccessMode.Write,
        //    index: ['k', 'i', 'j'],
        //};

        const i0j2: SymbolicDataAccess = {
            dataContainer: infield,
            accessMode: AccessMode.ReadOnly,
            index: ['i', 'j+2', 'k'],
        };
        const i1j1: SymbolicDataAccess = {
            dataContainer: infield,
            accessMode: AccessMode.ReadOnly,
            index: ['i+1', 'j+1', 'k'],
        };
        const i1j2: SymbolicDataAccess = {
            dataContainer: infield,
            accessMode: AccessMode.ReadOnly,
            index: ['i+1', 'j+2', 'k'],
        };
        const i1j3: SymbolicDataAccess = {
            dataContainer: infield,
            accessMode: AccessMode.ReadOnly,
            index: ['i+1', 'j+3', 'k'],
        };
        const i2j0: SymbolicDataAccess = {
            dataContainer: infield,
            accessMode: AccessMode.ReadOnly,
            index: ['i+2', 'j', 'k'],
        };
        const i2j1: SymbolicDataAccess = {
            dataContainer: infield,
            accessMode: AccessMode.ReadOnly,
            index: ['i+2', 'j+1', 'k'],
        };
        const i2j2: SymbolicDataAccess = {
            dataContainer: infield,
            accessMode: AccessMode.ReadOnly,
            index: ['i+2', 'j+2', 'k'],
        };
        const i2j3: SymbolicDataAccess = {
            dataContainer: infield,
            accessMode: AccessMode.ReadOnly,
            index: ['i+2', 'j+3', 'k'],
        };
        const i2j4: SymbolicDataAccess = {
            dataContainer: infield,
            accessMode: AccessMode.ReadOnly,
            index: ['i+2', 'j+4', 'k'],
        };
        const i3j1: SymbolicDataAccess = {
            dataContainer: infield,
            accessMode: AccessMode.ReadOnly,
            index: ['i+3', 'j+1', 'k'],
        };
        const i3j2: SymbolicDataAccess = {
            dataContainer: infield,
            accessMode: AccessMode.ReadOnly,
            index: ['i+3', 'j+2', 'k'],
        };
        const i3j3: SymbolicDataAccess = {
            dataContainer: infield,
            accessMode: AccessMode.ReadOnly,
            index: ['i+3', 'j+3', 'k'],
        };
        const i4j2: SymbolicDataAccess = {
            dataContainer: infield,
            accessMode: AccessMode.ReadOnly,
            index: ['i+4', 'j+2', 'k'],
        };
        const coeffijk: SymbolicDataAccess = {
            dataContainer: coeff,
            accessMode: AccessMode.ReadOnly,
            index: ['i', 'j', 'k'],
        };
        const outfieldijk: SymbolicDataAccess = {
            dataContainer: outfield,
            accessMode: AccessMode.Write,
            index: ['i', 'j', 'k'],
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

        const computationString = 'COMPUTATION HERE';
        const computation = new ComputationNode(
            graph, computationString, accessOrder, false
        );

        const compSubgraph = new Graph();
        compSubgraph.addChild(computation);

        const map = new MapNode(
            graph,
            [
                {
                    itvar: 'k',
                    start: 0,
                    end: K.value,
                    step: 1,
                },
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
        coeffMem.position.set(550, 220);

        map.position.set(450, 560);

        outfieldMem.position.set(380, 860);

        return graph;
    }

}