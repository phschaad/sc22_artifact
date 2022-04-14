import argparse
import dace
import numpy as np


def create_array(shape, dtype, total_size, strides):
    buffer = np.ndarray([total_size], dtype=dtype)
    view = np.ndarray(shape, dtype, buffer=buffer, strides=[s * dtype.itemsize for s in strides])
    return view


def copy_array(dst, src):
    dst[:] = src


def make_array_from_desc(desc, data):
    npdtype = desc.dtype.as_numpy_dtype()
    view = create_array(desc.shape, npdtype, desc.total_size, desc.strides)
    if data is not None:
        copy_array(view, data)
    return view


def run_aligned(I: int, J: int, K: int):
    in_field_data = np.random.rand(K, I+4, J+4)
    coeff_data = np.random.rand(K, I, J)
    out_field_data = np.zeros((K, I, J))

    sdfg = dace.SDFG.from_file('HDIFF/04_aligned.sdfg')

    in_field_desc = sdfg.data('in_field')
    coeff_desc = sdfg.data('coeff')
    out_field_desc = sdfg.data('out_field')

    in_field = make_array_from_desc(in_field_desc, in_field_data)
    coeff = make_array_from_desc(coeff_desc, coeff_data)
    out_field = make_array_from_desc(out_field_desc, out_field_data)

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

