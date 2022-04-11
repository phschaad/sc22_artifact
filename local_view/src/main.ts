import {
    BarController,
    BarElement,
    CategoryScale, Chart, Legend, LinearScale,
    Tooltip
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import $ from 'jquery';
import { Viewport } from 'pixi-viewport';
import * as pixi from 'pixi.js';
import { MapNode } from './elements/map_node';
import { MemoryMovementEdge } from './elements/memory_movement_edge';
import { MemoryNode } from './elements/memory_node';
import { Graph } from './graph/graph';
import { OuterProduct } from './samples/blas/outer_product';
import { Conv4DNested } from './samples/cnn_4d/cnn_4d_nested_fake';
import { HdiffSideBySide } from './samples/hdiff/hdiff_alt_tiled';
import { HdiffBadLayoutBadOrder } from './samples/hdiff/hdiff_bad_layout_bad_order';
import { HdiffGoodLayoutBadOrder } from './samples/hdiff/hdiff_good_layout_bad_order';
import { HdiffGoodLayoutGoodOrder } from './samples/hdiff/hdiff_good_layout_good_order';
import { HdiffGoodLayoutGoodOrderAligned } from './samples/hdiff/hdiff_good_layout_good_order_aligned';
import { MatMult } from './samples/mat_mult/mat_mult';
import { Program } from './samples/program';

export class Application {

    private static readonly INSTANCE: Application = new Application();

    private constructor() {
    }

    public static getInstance(): Application {
        return this.INSTANCE;
    }

    private tooltipContainer: HTMLElement | null = null;
    private tooltipText: HTMLElement | null = null;

    private viewport: Viewport | null = null;

    private readonly textPlane: Set<pixi.Text> = new Set();
    private lastDebounceTime: number = 0;

    public globalMemMovementHistogram: Map<number, number> = new Map();

    public reuseDistanceHistogram?: Chart;

    private _activeProgram?: Program;

    private app?: pixi.Application;

    public tempColorSaturation = 0.8;
    public tempColorLightness = 0.5;

    public get activeProgram(): Program | undefined {
        return this._activeProgram;
    }

    public set activeProgram(prog: Program | undefined) {
        this._activeProgram = prog;
        this._activeProgram?.draw();
    }

    public init(): void {
        this.initPixi();
        this.initTooltip();
        this.initSettings();

        Chart.register(annotationPlugin);
        Chart.register(
            BarController, BarElement, CategoryScale, Tooltip, Legend,
            LinearScale
        );
        const elem = document.getElementById('reuse-distance-histogram');
        if (elem) {
            this.reuseDistanceHistogram = new Chart(
                elem as HTMLCanvasElement,
                {
                    type: 'bar',
                    data: {
                        labels: [],
                        datasets: [],
                    },
                    options: {},
                }
            );
        }

        this.viewport?.on('zoomed-end', () => {
            // TODO: Debounce properly.
            const nTimestamp = Date.now();
            if (this.viewport && nTimestamp - this.lastDebounceTime > 500) {
                let scale = this.viewport.scaled;
                if (scale > 20)
                    scale = 20;
                this.textPlane.forEach((txtPart) => {
                    txtPart.resolution = scale;
                });
            }
            this.lastDebounceTime = nTimestamp;
        });
    }

    private initPixi(): void {
        const anchor = document.getElementById('pixi-anchor');
        if (!anchor)
            return;
        const anchorRect = anchor.getBoundingClientRect();
        
        this.app = new pixi.Application({
            width: anchorRect.width,
            height: anchorRect.height,
            transparent: true,
            antialias: true,
        });

        anchor.appendChild(this.app.view);

        this.viewport = new Viewport({
            screenWidth: anchorRect.width,
            screenHeight: anchorRect.height,
            worldWidth: 10000,
            worldHeight: 10000,
            interaction: this.app.renderer.plugins.interaction,
        });

        this.app.stage.addChild(this.viewport);

        this.viewport
            .drag()
            .pinch()
            .wheel()
            .decelerate({
                friction: 0.3,
            });
    }

    public export2Pdf(graph: Graph): void {
        //if (this.app) {
        //    const canvas = this.app.renderer.plugins.extract.canvas(graph);
        //    const stream = blobStream();
        //    const size = [graph.width, graph.height];
        //    const ctx = new canvas2pdf.PdfContext(stream, {
        //        size: size,
        //    });
        //}
    }

    public initTooltip(): void {
        this.tooltipContainer = document.getElementById('tooltip');
        this.tooltipText = document.getElementById('tooltipText');
    }

    public showTooltip(x: number, y: number, text: string): void {
        if (this.tooltipContainer && this.tooltipText) {
            this.tooltipText.innerText = text;
            this.tooltipContainer.style.left = '0px';
            this.tooltipContainer.style.top = '0px';
            this.tooltipContainer.setAttribute('data-show', '');
            const bcr = this.tooltipContainer.getBoundingClientRect();
            const navbarBcr = document.getElementById('navbar')?.getBoundingClientRect();
            const spacing = navbarBcr ? navbarBcr.height : 0;
            this.tooltipContainer.style.left = (x - 8).toString() + 'px';
            this.tooltipContainer.style.top = (((y - bcr.height) - 8) + spacing).toString() + 'px';
            
        }
    }

    public hideTooltip(): void {
        this.tooltipContainer?.removeAttribute('data-show');
    }

    private onUpdateReuseDistanceViewmode(): void {
        if ($('#input-reuse-distance-viewmode').is(':checked')) {
            this.activeProgram?.graphs.forEach(graph => {
                graph.enableReuseDistanceOverlay();
            });
        } else {
            this.activeProgram?.graphs.forEach(graph => {
                graph.disableReuseDistanceOverlay();
            });
        }
    }

    private onUpdateDataMovementViewmode(): void {
        if ($('#input-physical-data-movement-viewmode').is(':checked')) {
                this.activeProgram?.graphs.forEach(graph => {
                    graph.enablePhysMovementOverlay();
                })
            } else {
                this.activeProgram?.graphs.forEach(graph => {
                    graph.disablePhysMovementOverlay();
                })
            }
    }

    public initSettings(): void {
        const reuseDistanceCb = $('#input-reuse-distance-viewmode');
        reuseDistanceCb.on('change', () => {
            this.onUpdateReuseDistanceViewmode();
        });

        const physicalMovementCb = $('#input-physical-data-movement-viewmode');
        physicalMovementCb.on('change', () => {
            this.onUpdateDataMovementViewmode();
        });

        $('#cacheLineSizeInput').on('change', () => {
            this.recalculateAll();
        });

        $('#reuseDistanceThresholdInput').on('change', () => {
            this.recalculateAll();
        });

        /*
        const tempColorSaturationInput = $('#tempColorSaturationInput');
        const tempColorLightnessInput = $('#tempColorLightnessInput');
        tempColorSaturationInput.on('change', () => {
            const raw = tempColorSaturationInput.val();
            if (raw !== undefined && typeof(raw) === 'string') {
                const parsed = parseFloat(raw);
                if (parsed !== undefined && parsed >= 0 && parsed <= 1) {
                    this.tempColorSaturation = parsed;
                    this.graphs.forEach(graph => {
                        graph.draw();
                    });
                }
            }
        });
        tempColorLightnessInput.on('change', () => {
            const raw = tempColorLightnessInput.val();
            if (raw !== undefined && typeof(raw) === 'string') {
                const parsed = parseFloat(raw);
                if (parsed !== undefined && parsed >= 0 && parsed <= 1) {
                    this.tempColorLightness = parsed;
                    this.graphs.forEach(graph => {
                        graph.draw();
                    });
                }
            }
        });
        */

        $('#input-access-pattern-viewmode').on('change', () => {
            this.activeProgram?.graphs.forEach(graph => {
                graph.nodes.forEach(node => {
                    if (node instanceof MemoryNode)
                        node.clearAllAccesses();
                });
                graph.draw();
            });
        });

        $('#sampleSwitcher').on('change', () => {
            if (!this.viewport)
                return;

            if (this._activeProgram) {
                this.viewport?.removeChild(this._activeProgram.container);
                this._activeProgram.destroy();
                this._activeProgram = undefined;
            }

            switch ($('#sampleSwitcher').val()) {
                case 'hdiff-baseline':
                    this.activeProgram = new HdiffBadLayoutBadOrder(this.viewport, 0, 0);
                    break;
                case 'hdiff-reshaped':
                    this.activeProgram = new HdiffGoodLayoutBadOrder(this.viewport, 0, 0);
                    break;
                case 'hdiff-reordered':
                    this.activeProgram = new HdiffGoodLayoutGoodOrder(this.viewport, 0, 0);
                    break;
                case 'hdiff-aligned':
                    this.activeProgram = new HdiffGoodLayoutGoodOrderAligned(this.viewport, 0, 0);
                    break;
                case 'hdiff-side-by-side':
                    this.activeProgram = new HdiffSideBySide(this.viewport, 0, 0);
                    break;
                case '3d-conv':
                    this.activeProgram = new Conv4DNested(this.viewport, 0, 0);
                    break;
                case 'outer-prod':
                    this.activeProgram = new OuterProduct(this.viewport, 0, 0);
                    break;
                case 'gemm':
                    this.activeProgram = new MatMult(this.viewport, 0, 0);
                    break;
            }

            if (this.activeProgram) {
                this.onUpdateDataMovementViewmode();
                this.onUpdateReuseDistanceViewmode();
                this.recalculateAll();
            }
        });
    }

    public registerToTextPlane(text: pixi.Text): void {
        this.textPlane.add(text);
    }

    public deregisterFromTextPlane(text: pixi.Text): void {
        this.textPlane.delete(text);
    }

    public getViewport(): Viewport | null {
        return this.viewport;
    }

    private constructForGraph(g: Graph): void {
        g.edges.forEach(edge => {
            if (edge instanceof MemoryMovementEdge) {
                const vol = edge.calculateMovementVolume();
                const prev = this.globalMemMovementHistogram.get(vol);
                if (prev !== undefined)
                    this.globalMemMovementHistogram.set(vol, prev + 1);
                else
                    this.globalMemMovementHistogram.set(vol, 1);
            }
        });

        g.nodes.forEach(node => {
            if (node instanceof MapNode)
                this.constructForGraph(node.innerGraph);
        });
    }

    public constructMemoryMovementHist(): void {
        this.globalMemMovementHistogram.clear();

        this.activeProgram?.graphs.forEach(graph => {
            this.constructForGraph(graph);
        });
    }

    private graphClearCalculatedValues(g: Graph): void {
        g.edges.forEach(edge => {
            if (edge instanceof MemoryMovementEdge)
                edge.clearVolume();
        });
        g.nodes.forEach(node => {
            if (node instanceof MemoryNode)
                node.applyToAll(undefined, t => {
                    t.stackDistancesFlattened = [];
                    t.stackDistances.clear();
                    t.coldMisses = 0;
                    t.totalMisses = 0;
                });
            else if (node instanceof MapNode)
                this.graphClearCalculatedValues(node.innerGraph);
        });
    }

    private recalcForGraph(g: Graph): void {
        g.nodes.forEach(node => {
            if (node instanceof MapNode) {
                node.calculateStackDistances();
                this.recalcForGraph(node.innerGraph);
            }
        });
    }

    public recalculateAll(): void {
        MemoryNode.reuseDistanceHistogram.clear();
        MemoryNode.minReuseDistanceHistogram.clear();
        MemoryNode.maxReuseDistanceHistogram.clear();
        MemoryNode.missesHistogram.clear();
        this.activeProgram?.graphs.forEach(g => {
            this.graphClearCalculatedValues(g);
        });
        this.globalMemMovementHistogram.clear();

        this.activeProgram?.graphs.forEach(g => {
            this.recalcForGraph(g);
        });

        this.constructMemoryMovementHist();

        this.activeProgram?.graphs.forEach(g => {
            g.draw();
        });
    }

}

(globalThis as any).openSettingsSidebar = () => {
    const sidebar = document.getElementById('settingsSidebar');
    if (sidebar)
        sidebar.style.display = 'block';
}

(globalThis as any).closeSettingsSidebar = () => {
    const sidebar = document.getElementById('settingsSidebar');
    if (sidebar)
        sidebar.style.display = 'none';
}

async function run(): Promise<void> {
    Application.getInstance().init();

    const viewport = Application.getInstance().getViewport();
    if (!viewport)
        return;

    Application.getInstance().activeProgram =
        new HdiffBadLayoutBadOrder(viewport, 0, 0);

    Application.getInstance().constructMemoryMovementHist();
}

$(() => {
    run();
});
