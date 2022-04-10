import argparse
import dace
import numpy as np


def run_aligned(I: int, J: int, K: int):
    in_field = np.random.rand(I+4, J+4, K)
    coeff = np.random.rand(K, I, J)
    out_field = np.zeros((I, J, K))

    sdfg = dace.SDFG.from_file('HDIFF/04_aligned.sdfg')

    sdfg(in_field=in_field, coeff=coeff, out_field=out_field)


if __name__ == '__main__':
    np.random.seed(seed=1234567890)

    parser = argparse.ArgumentParser()
    parser.add_argument('-p', '--preset', choices=['L', 'paper'], default='L')

    args = vars(parser.parse_args())

    if args['preset'] == 'L':
        run_aligned(I=315, J=315, K=175)
    elif args['preset'] == 'paper':
        run_aligned(I=256, J=256, K=160)

