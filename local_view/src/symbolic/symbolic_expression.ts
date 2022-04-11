import math from 'mathjs';

export class SymbolicExpression {

    private _val?: number;
    private _expr: string;

    public constructor(
        val: number | string,
        private fallbackValue?: number
    ) {
        if (typeof(val) === 'string') {
            this._expr = val;
            this._val = undefined;
        } else {
            this._expr = val.toString();
            this._val = val;
        }
    }

    public evaluate(scope?: object): number | undefined {
        const res = math.evaluate(this._expr, scope);
        if (typeof(res) === 'number')
            this._val = res;
        return this._val;
    }

    public get value(): number | undefined {
        if (this._val === undefined)
            this.evaluate();
        if (this._val === undefined)
            return this.fallbackValue;
        return this._val;
    }

    public get expression(): string {
        return this._expr;
    }

}
