import { Container } from 'pixi.js';
import { Graph } from '../graph/graph';

export class Program {

    public readonly container: Container;
    public readonly graphs: Graph[] = [];

    protected constructor(
        protected readonly stage: Container,
        protected x: number,
        protected y: number,
    ) {
        this.container = new Container();
        this.container.position.set(x, y);
        this.stage.addChild(this.container);
    }

    protected addGraph(graph: Graph): void {
        this.graphs.push(graph);
        this.container.addChild(graph);
    }

    public destroy(): void {
        this.container.destroy();
    }

    public draw(): void {
        this.graphs.forEach(graph => {
            graph.draw();
        });
    }

}
