import { Graphics } from '@pixi/graphics';
import { Rectangle } from '@pixi/math';
import { Text } from '@pixi/text';
import $ from 'jquery';
import { max, median, min } from 'mathjs';
import { InteractionEvent } from 'pixi.js';
import { Graph } from '../graph/graph';
import { Application } from '../main';
import { getTempColor, KELLY_COLORS } from '../utils/utils';
import { AccessMap, DataContainer } from './data_container';
import { DataDimension } from './dimensions';
import { DEFAULT_LINE_STYLE, DEFAULT_TEXT_STYLE } from './element';
import { MapNode } from './map_node';
import { Node } from './node';

const INTERNAL_PADDING = 30;
const TILE_SIZE = 10;

class MemoryTile extends Graphics {

    public marked: boolean = false;
    public stackedHighlights: number = 0;

    private stackedAccesses: number = 0;
    private showingRelated: boolean = false;
    private showingCached: boolean = false;
    private selected: boolean = false;
    private hovered: boolean = false;

    public borderMarkingColors: number[] = [];

    public descendandts: MemoryTile[] | null = null;

    public stackDistances: Map<number, number> = new Map();
    public stackDistancesFlattened: number[] = [];
    public coldMisses: number = 0;
    public totalMisses: number = 0;

    public constructor(
        public readonly memoryNode: MemoryNode,
        public readonly elementX: number,
        public readonly elementY: number,
        public readonly elementWidth: number,
        public readonly elementHeight: number,
        public readonly index: number[],
    ) {
        super();

        this.interactive = true;
        this.hitArea = new Rectangle(
            this.elementX, this.elementY,
            this.elementWidth, this.elementHeight
        );

        this.on('mouseover', this.onMouseOver);
        this.on('mouseout', this.onMouseOut);
        this.on('pointerdown', this.onClicked);
    }

    private markCacheLine(): void {
        const cacheLine = this.memoryNode.getCacheLine(this.index);

        cacheLine.forEach(tile => {
            tile.onMarkCached();
        });
    }

    private unmarkCacheLine(): void {
        const cacheLine = this.memoryNode.getCacheLine(this.index);

        cacheLine.forEach(tile => {
            tile.unmarkCached();
        });
    }

    private unmarkRelatedAccesses(asAccess: boolean = false): void {
        this.memoryNode.parentGraph.getRelatedAccesses(
            this.memoryNode.dataContainer,
            this.index
        ).forEach((accesses, container) => {
            const nodes =
                this.memoryNode.parentGraph.memoryNodesMap.get(container);
            if (nodes) {
                accesses.forEach((access) => {
                    nodes.forEach(node => {
                        if (asAccess)
                            node[1].applyToIdx(
                                access[1], (t) => t.unmarkAccess()
                            );
                        else
                            node[1].applyToIdx(
                                access[1], (t) => t.unmarkRelated()
                            );
                        node[1].draw();
                    });
                });
            }
        });
    }

    private markRelatedAccesses(asAccess: boolean = false): void {
        this.memoryNode.parentGraph.getRelatedAccesses(
            this.memoryNode.dataContainer,
            this.index
        ).forEach((accesses, container) => {
            const nodes =
                this.memoryNode.parentGraph.memoryNodesMap.get(container);
            if (nodes) {
                accesses.forEach((access) => {
                    nodes.forEach(node => {
                        if (asAccess)
                            node[1].applyToIdx(
                                access[1], (t) => t.onMarkAccess()
                            );
                        else
                            node[1].applyToIdx(
                                access[1], (t) => t.onMarkRelated()
                            );
                        node[1].draw();
                    });
                });
            }
        });
    }

    private markTilingRegion(): void {
        const regions = this.memoryNode.getTilingRegionsForIdx(this.index);

        const redrawNodes: MemoryNode[] = [];
        regions.forEach((region, i) => {
            const color = KELLY_COLORS[i];

            region[1].forEach((val, key) => {
                const nodeRet =
                    this.memoryNode.parentGraph.memoryNodesMap.get(key);
                if (nodeRet !== undefined && nodeRet.length > 0) {
                    const node = nodeRet[0][1];

                    val.forEach(v => {
                        node.applyToIdx(
                            v[1],
                            (t) => {
                                if (!t.borderMarkingColors.includes(color))
                                    t.borderMarkingColors.push(color);
                            });
                    });

                    if (!redrawNodes.includes(node))
                        redrawNodes.push(node);
                }
            });
        });

        redrawNodes.forEach(node => node.draw());
    }

    private unmarkTilingRegion(): void {
        this.memoryNode.parentGraph.memoryNodesMap.forEach((v) => {
            v.forEach(tuple => {
                const node = tuple[1];
                node.applyToAll(undefined, (t) => t.borderMarkingColors = []);
                node.draw();
            });
        });
    }

    private fillReuseDistanceHistogram(): void {
        const keys = [...this.stackDistances.keys()];
        const maxKey = Math.max(...keys);
        const allVals = Array.from(Array(maxKey + 1).keys());
        const data = Array(maxKey + 1).fill(0);
        for (const key of keys) {
            const val = this.stackDistances.get(key);
            if (val !== undefined && key >= 0)
                data[key] = val;
        }

        const coldMisses = this.stackDistances.get(-1);
        const newData = {
            labels: [...allVals, 'Cold'],
            datasets: [{
                label: this.memoryNode.dataContainer.name + '[' + this.index.toString() + ']',
                backgroundColor: '#00538A',
                data: [...data, coldMisses === undefined ? 0 : coldMisses],
            }],
        };

        Application.getInstance().showReuseDistanceHist();

        const hist = Application.getInstance().reuseDistanceHistogram;
        if (hist) {
            hist.data = newData;
            hist.update();
        }
    }

    private clearReuseDistanceHistogram(): void {
        Application.getInstance().hideReuseDistanceHist();
    }

    public onClicked(): void {
        //if ($('#input-tiling-viewmode').is(':checked'))
        //    return;

        this.selected = !this.selected;

        if (this.selected) {
            if ($('#input-cache-lines-viewmode').is(':checked'))
                this.markCacheLine();
            else if ($('#input-reuse-distance-viewmode').is(':checked'))
                this.fillReuseDistanceHistogram();
            else
                this.markRelatedAccesses(true);
        } else {
            if ($('#input-cache-lines-viewmode').is(':checked'))
                this.unmarkCacheLine();
            else if ($('#input-reuse-distance-viewmode').is(':checked'))
                this.clearReuseDistanceHistogram();
            else
                this.unmarkRelatedAccesses(true);
        }

        this.draw();
    }

    public onMouseOver(mouseEvent: InteractionEvent): void {
        if (this.stackedAccesses > 0) {
            const globalPos = this.toGlobal({
                x: this.elementX,
                y: this.elementY,
            });
            Application.getInstance().showTooltip(
                globalPos.x + (this.elementWidth / 2), globalPos.y,
                this.stackedAccesses.toString()
            );
        }

        this.hovered = true;

        /*
        if ($('#input-tiling-viewmode').is(':checked')) {
            this.markTilingRegion();
        } else
        */
        if (this.memoryNode.reuseDistanceOverlayActive) {
            const globalPos = this.toGlobal({
                x: this.elementX,
                y: this.elementY,
            });

            if (this.stackDistancesFlattened.length > 0) {
                const med = median(this.stackDistancesFlattened);
                const mx = max(this.stackDistancesFlattened);
                const mi = min(this.stackDistancesFlattened);

                Application.getInstance().showTooltip(
                    globalPos.x + (this.elementWidth / 2), globalPos.y,
                    'Median: ' + med.toString() + '\n' +
                    'Min: ' + mi.toString() + '\n' +
                    'Max: ' + mx.toString() + '\n' +
                    'Misses: ' + this.totalMisses.toString()
                );
            } else {
                Application.getInstance().showTooltip(
                    globalPos.x + (this.elementWidth / 2), globalPos.y,
                    'Median: N/A\n' +
                    'Min: N/A\n' +
                    'Max: N/A\n' +
                    'Misses: ' + this.totalMisses.toString()
                );
            }
        } else {
            this.markRelatedAccesses();
        }

        this.draw();
    }

    public onMouseOut(): void {
        Application.getInstance().hideTooltip();

        this.hovered = false;

        //if ($('#input-tiling-viewmode').is(':checked'))
        //    this.unmarkTilingRegion();
        //else
        this.unmarkRelatedAccesses();

        this.draw();
    }

    private removeFromGlobalHist(): void {
        if (this.stackedAccesses > 0) {
            const prev = MemoryNode.accessHistogram.get(this.stackedAccesses);
            if (prev !== undefined) {
                if (prev <= 1)
                    MemoryNode.accessHistogram.delete(this.stackedAccesses);
                else
                    MemoryNode.accessHistogram.set(
                        this.stackedAccesses, prev - 1
                    );
            }
        }
    }

    private addToGlobalHist(): void {
        if (this.stackedAccesses > 0) {
            const prev = MemoryNode.accessHistogram.get(this.stackedAccesses);
            if (prev !== undefined && prev !== 0)
                MemoryNode.accessHistogram.set(this.stackedAccesses, prev + 1);
            else
                MemoryNode.accessHistogram.set(this.stackedAccesses, 1);
        }
    }

    public onMarkAccess(): void {
        // If this had stacked accesses before, try to remove it from the
        // global histogram.
        this.removeFromGlobalHist();

        this.stackedAccesses++;
        MemoryNode.MAX_ACCESSES = Math.max(
            MemoryNode.MAX_ACCESSES, this.stackedAccesses
        );
        MemoryNode.accessMap.set(this, this.stackedAccesses);

        this.addToGlobalHist();

        this.draw();
    }

    public unmarkAccess(): void {
        // If this had stacked accesses before, try to remove it from the
        // global histogram.
        this.removeFromGlobalHist();

        this.stackedAccesses--;
        if (this.stackedAccesses < 0)
            this.stackedAccesses = 0;
        MemoryNode.accessMap.set(this, this.stackedAccesses);

        this.addToGlobalHist();

        this.draw();
    }

    public onClearAccesses(): void {
        // If this had stacked accesses before, try to remove it from the
        // global histogram.
        this.removeFromGlobalHist();

        this.stackedAccesses = 0;
        MemoryNode.accessMap.set(this, this.stackedAccesses);

        this.draw();
    }

    public onMarkRelated(): void {
        this.showingRelated = true;
        this.draw();
    }

    public unmarkRelated(): void {
        this.showingRelated = false;
        this.draw();
    }

    public onMarkCached(): void {
        this.showingCached = true;
        this.draw();
    }

    public unmarkCached(): void {
        this.showingCached = false;
        this.draw();
    }

    public draw(): void {
        this.clear();

        this.lineStyle(DEFAULT_LINE_STYLE);

        if (this.selected) {
            if (this.showingRelated)
                this.beginFill(0x5050CC);
            else
                this.beginFill(0xA0A0FF);
        } else if (this.stackedAccesses > 0) {
            const keys = [...MemoryNode.accessHistogram.keys()];
            keys.sort((a, b) => { return a - b; });
            const idx = keys.indexOf(this.stackedAccesses);
            let badness = 0;
            if (idx < 0)
                badness = 0;
            else
                badness = idx / (keys.length - 1);

            this.beginFill(getTempColor(badness));
        } else if (this.showingRelated) {
            this.beginFill(0xCCCCCC);
        } else if (this.showingCached) {
            this.beginFill(0xC7FF73);
        } else if (this.borderMarkingColors.length > 0) {
            const tH = this.elementHeight / this.borderMarkingColors.length;
            this.borderMarkingColors.forEach((color, i) => {
                this.beginFill(color, 0.8);
                this.lineStyle({
                    width: 0,
                    color: color,
                });
                this.drawRect(
                    this.elementX, this.elementY + i * tH, this.elementWidth, tH
                );
                this.endFill();
            });

            this.lineStyle(DEFAULT_LINE_STYLE);
        } else if (this.memoryNode.reuseDistanceOverlayActive) {
            
            if (this.stackDistancesFlattened.length > 0) {
                let v;
                let keys;
                if ($('#input-rdm-max').is(':checked')) {
                    v = max(this.stackDistancesFlattened);
                    keys = [
                        ...MemoryNode.maxReuseDistanceHistogram.keys()
                    ];
                } else if ($('#input-rdm-min').is(':checked')) {
                    v = min(this.stackDistancesFlattened);
                    keys = [
                        ...MemoryNode.minReuseDistanceHistogram.keys()
                    ];
                } else if ($('#input-rdm-misses').is(':checked')) {
                    v = this.totalMisses;
                    keys = [...MemoryNode.missesHistogram.keys()];
                } else {
                    v = median(this.stackDistancesFlattened);
                    keys = [
                        ...MemoryNode.reuseDistanceHistogram.keys()
                    ];
                }

                keys.sort((a, b) => { return a - b; });
                let idx = -1;
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    if (key >= v) {
                        idx = i;
                        break;
                    }
                }

                let badness = 0;
                if (idx < 0)
                    badness = 0;
                else
                    badness = idx / (keys.length - 1);

                this.beginFill(getTempColor(badness));
            } else if (this.coldMisses > 0) {
                this.beginFill(0xCCCCCC, 0.8);
            } else {
                this.beginFill(0xFFFFFF, 0.8);
            }

            if (this.selected)
                this.tint = 0xAAAAAA;
        } else {
            this.beginFill(0xFFFFFF, 0.8);
        }

        if (this.hovered)
            this.tint = 0xCCCCCC;
        else
            this.tint = 0xFFFFFF;
        
        this.drawRect(
            this.elementX, this.elementY,
            this.elementWidth, this.elementHeight
        );

        this.endFill();
    }

    public get accesses(): number {
        return this.stackedAccesses;
    }

}

export class MemoryNode extends Node {

    public static MAX_ACCESSES: number = 1;

    public readonly unscaledWidth: number;
    public readonly unscaledHeight: number;

    private readonly tiles: MemoryTile[];
    private readonly gfxText: Text;

    public static readonly accessMap: Map<MemoryTile, number> = new Map();
    public static readonly accessHistogram: Map<number, number> = new Map();
    public static readonly reuseDistanceHistogram: Map<number, number> =
        new Map();
    public static readonly minReuseDistanceHistogram: Map<number, number> =
        new Map();
    public static readonly maxReuseDistanceHistogram: Map<number, number> =
        new Map();
    public static readonly missesHistogram: Map<number, number> = new Map();

    public reuseDistanceOverlayActive: boolean = false;

    constructor(
        parentGraph: Graph,
        public readonly dataContainer: DataContainer,
        private readonly nameBottom: boolean = false,
        private readonly tileSizeOverride?: number,
    ) {
        super(parentGraph);
        
        this.unscaledWidth = this.calcUnscaledWidthRecursive(
            this.dataContainer.dim.slice()
        );
        this.unscaledHeight = this.calcUnscaledHeightRecursive(
            this.dataContainer.dim.slice()
        );

        this.gfxText = new Text(this.dataContainer.name, DEFAULT_TEXT_STYLE);
        Application.getInstance().registerToTextPlane(this.gfxText);

        this.gfxText.position.x = this.unscaledWidth / 2;
        let tilesY = 0;
        if (this.nameBottom) {
            this.gfxText.position.y =
                this.unscaledHeight + ((this.gfxText.height / 2) + 5);
        } else {
            this.gfxText.position.y = this.gfxText.height / 2;
            tilesY += this.gfxText.height + 10;
        }

        this.gfxText.anchor.set(0.5);

        this.addChild(this.gfxText);

        this.tiles = new Array(
            this.dataContainer.dim[0].value
        ).fill(null);
        this.recursiveInit(
            this.dataContainer.dim.slice(), 0, tilesY,
            this.unscaledWidth, this.unscaledHeight, this.tiles, []
        );
    }

    private calcUnscaledWidthRecursive(dims: DataDimension[]): number {
        if (dims.length === 1)
            return dims[0].value * (this.tileSizeOverride !== undefined ? this.tileSizeOverride : TILE_SIZE);
        else if (dims.length === 2)
            return dims[1].value * (this.tileSizeOverride !== undefined ? this.tileSizeOverride : TILE_SIZE);
        else if (dims.length % 2 === 0)
            return INTERNAL_PADDING + this.calcUnscaledWidthRecursive(
                dims.slice(1)
            )
        else
            return dims[0].value * (
                INTERNAL_PADDING + this.calcUnscaledWidthRecursive(
                    dims.slice(1)
                )
            );
    }

    private calcUnscaledHeightRecursive(dims: DataDimension[]): number {
        if (dims.length === 1)
            return (this.tileSizeOverride !== undefined ? this.tileSizeOverride : TILE_SIZE);
        else if (dims.length === 2)
            return dims[0].value * (this.tileSizeOverride !== undefined ? this.tileSizeOverride : TILE_SIZE);
        else if (dims.length % 2 !== 0)
            return INTERNAL_PADDING + this.calcUnscaledHeightRecursive(
                dims.slice(1)
            );
        else
            return dims[0].value * (
                INTERNAL_PADDING + this.calcUnscaledHeightRecursive(
                    dims.slice(1)
                )
            );
    }

    public clearAllAccesses(): void {
        this.applyToAll(this.tiles, tile => { tile.onClearAccesses(); });
    }

    public getTilingRegionsForIdx(idx: number[]): [
        Map<string, number>, AccessMap<(number | undefined)[]>
    ][] {
        const regions = this.getTilingRegions();

        const matchedRegions: [
            Map<string, number>, AccessMap<(number | undefined)[]>
        ][] = [];
        regions.forEach(region => {
            const containerRegions = region[1].get(this.dataContainer);
            if (containerRegions === undefined)
                return;

            for (let i = 0; i < containerRegions.length; i++) {
                const val = containerRegions[i];

                let match = true;
                for (let j = 0; j < val.length; j++) {
                    if (j > idx.length - 1 || val[1][j] !== idx[j]) {
                        match = false;
                        break;
                    }
                }

                if (match) {
                    matchedRegions.push(region);
                    break;
                }
            }
        });

        return matchedRegions;
    }

    public getTilingRegions(): [
        Map<string, number>, AccessMap<(number | undefined)[]>
    ][] {
        const adjacentMaps: MapNode[] = [];
        this.inEdges.forEach(inEdge => {
            if (inEdge.src instanceof MapNode)
                adjacentMaps.push(inEdge.src);
        });
        this.outEdges.forEach(outEdge => {
            if (outEdge.dst instanceof MapNode)
                adjacentMaps.push(outEdge.dst);
        });

        const regions: [
            Map<string, number>, AccessMap<(number | undefined)[]>
        ][] = [];
        adjacentMaps.forEach(map => {
            const mapPattern = map.getAccessPattern();
            mapPattern.forEach(pattern => {
                regions.push([pattern[0], pattern[1]]);
            });
        });

        return regions;
    }

    public getCacheLine(idx: number[]): MemoryTile[] {
        const ret: MemoryTile[] = [];

        const lineBytesRaw = $('#cacheLineSizeInput').val();
        let lineBytes = undefined;
        if (lineBytesRaw !== undefined) {
            if (typeof(lineBytesRaw) === 'number')
                lineBytes = lineBytesRaw;
            else if (typeof(lineBytesRaw) === 'string')
                lineBytes = parseInt(lineBytesRaw);
        }
        
        if (lineBytes !== undefined && lineBytes > 0 &&
            idx.length === this.dataContainer.strides.length) {

            let flatIdx = this.dataContainer.startOffset;
            
            for (let i = 0; i < idx.length; i++)
                flatIdx += idx[i] * this.dataContainer.strides[i].value;

            const bytesBefore =
                ((flatIdx * this.dataContainer.elementSize) +
                this.dataContainer.alignment) % lineBytes;
            const bytesAfter =
                lineBytes - (bytesBefore + this.dataContainer.elementSize);
            const nAfter =
                Math.floor(bytesAfter / this.dataContainer.elementSize);
            const nBefore =
                Math.floor(bytesBefore / this.dataContainer.elementSize);

            const minFlatIdx = flatIdx - nBefore;
            const maxFlatIdx = flatIdx + nAfter;

            for (let i = minFlatIdx; i <= maxFlatIdx; i++) {
                const reconstructedIdx: number[] = [];
                let invalid = false;
                let remIdx = i - this.dataContainer.startOffset;
                if (remIdx < 0)
                    continue;

                for (let j = 0; j < this.dataContainer.strides.length; j++) {
                    const stride = this.dataContainer.inverse ?
                        this.dataContainer.strides[
                            this.dataContainer.strides.length - (j + 1)
                        ] : this.dataContainer.strides[j];
                    const dimIdx = Math.floor(remIdx / stride.value);
                    
                    remIdx = remIdx % stride.value;
                    
                    if (!this.dataContainer.inverse &&
                        dimIdx >= this.dataContainer.dim[j].value) {
                        invalid = true;
                        break;
                    }

                    if (this.dataContainer.inverse &&
                        dimIdx >= this.dataContainer.dim[
                            this.dataContainer.dim.length - (j + 1)
                        ].value) {
                        invalid = true;
                        break;
                    }

                    if (this.dataContainer.inverse)
                        reconstructedIdx.unshift(dimIdx);
                    else
                        reconstructedIdx.push(dimIdx);
                }
                
                if (!invalid) {
                    const targetTile = this.getTileAt(reconstructedIdx);
                    if (targetTile)
                        ret.push(targetTile);
                }
            }
        }

        return ret;
    }

    public applyToAll(
        tiles: MemoryTile[] | undefined, fun: (t: MemoryTile) => void
    ): void {
        const remaining: MemoryTile[][] =
            tiles === undefined ? [this.tiles] : [tiles];
        while (remaining.length) {
            const next = remaining.shift();

            next?.forEach(tile => {
                if (tile.descendandts && tile.descendandts.length)
                    remaining.push(tile.descendandts);
                fun(tile);
            });
        }
    }

    private recGetTilesAt(
        idx: (number | undefined)[], i: number = 0,
        pivot: MemoryTile[] = this.tiles
    ): MemoryTile[] | MemoryTile {
        const index = idx[i];

        if (index !== undefined && typeof index === 'number') {
            const nPivot = pivot[index];

            if (i < idx.length - 1 && nPivot.descendandts)
                return this.recGetTilesAt(idx, i + 1, nPivot.descendandts);
            else
                return nPivot;
        } else {
            if (i < idx.length - 1) {
                const rVal: MemoryTile[] = [];
                pivot.forEach(el => {
                    if (el.descendandts) {
                        const ret =
                            this.recGetTilesAt(idx, i + 1, el.descendandts);
                        if (ret instanceof MemoryTile)
                            rVal.push(ret);
                        else
                            rVal.push(...ret);
                    }
                });
                return rVal;
            } else {
                return pivot;
            }
        }
    }

    public getTilesAt(idx: (number | undefined)[]): MemoryTile[] | MemoryTile {
        return this.recGetTilesAt(idx);
    }

    public getTileAt(idx: number[]): MemoryTile | undefined {
        const ret = this.recGetTilesAt(idx);
        if (ret instanceof MemoryTile)
            return ret;
        return undefined;
    }

    public applyToIdx(
        idx: (number | undefined)[], fun: (t: MemoryTile) => void,
        i: number = 0, pivot: MemoryTile[] = this.tiles,
        targets: MemoryTile[] = []
    ): void {
        const index = idx[i];

        if (index !== undefined && typeof index === 'number'){
            if (index < 0 || index >= pivot.length)
                return;

            const nPivot = pivot[index];

            if (i < idx.length - 1 && nPivot.descendandts) {
                this.applyToIdx(idx, fun, i + 1, nPivot.descendandts, targets);
            } else {
                fun(nPivot);
                targets.push(nPivot);
            }
        } else {
            if (i < idx.length - 1) {
                pivot.forEach(el => {
                    if (el.descendandts)
                        this.applyToIdx(
                            idx, fun, i + 1, el.descendandts, targets
                        );
                });
            } else {
                pivot.forEach(el => {
                    fun(el);
                });
                targets.push(...pivot);
            }
        }
    }

    private recursiveInit(
        dims: DataDimension[], x: number, y: number, width: number,
        height: number, target: any[], targetIndexes: number[]
    ): void {
        const size = dims[0].value;

        const horizontal = dims.length % 2 !== 0;

        const padded = dims.length > 2;

        let elWidth = horizontal ? width / size : width;
        let elHeight = horizontal ? height : height / size;

        for (let i = 0; i < size; i++) {
            const nTargetIndexes = [...targetIndexes, i];

            const elX = horizontal ? x + i * elWidth : x;
            const elY = horizontal ? y : y + i * elHeight;

            const rect = new MemoryTile(
                this, elX, elY, elWidth, elHeight, nTargetIndexes
            );
            MemoryNode.accessMap.set(rect, 0);

            this.addChild(rect);

            target[i] = rect;

            if (dims.length > 1) {
                const nextSize = dims[1].value;
                rect.descendandts = new Array(nextSize).fill(null);

                this.recursiveInit(
                    dims.slice(1),
                    padded ? elX + INTERNAL_PADDING / 2 : elX,
                    padded ? elY + INTERNAL_PADDING / 2 : elY,
                    padded ? elWidth - INTERNAL_PADDING : elWidth,
                    padded ? elHeight - INTERNAL_PADDING : elHeight,
                    rect.descendandts,
                    nTargetIndexes
                );
            }
        }
    }

    public clearStackDistances(): void {
        this.applyToAll(this.tiles, tile => { tile.stackDistances.clear(); });
    }

    public getTotalCacheMisses(): number {
        let misses = 0;
        this.applyToAll(this.tiles, tile => {
            misses += tile.totalMisses;
        });
        return misses;
    }

    public draw(): void {
        super.draw();

        const remaining: MemoryTile[][] = [this.tiles];
        while (remaining.length > 0) {
            const next = remaining.shift();
            if (next) {
                for (let i = 0; i < next.length; i++) {
                    next[i].draw();
                    const desc = next[i].descendandts;
                    if (desc !== null)
                        remaining.push(desc);
                }
            }
        }
    }

}
