import sys
import dace
import numpy as np


def run_bert(fname: str, B: int, H: int, N: int, P: int, SM: int, EMB: int):
    x = np.random.rand(B, SM, N)

    attn_wq = np.ones((P, H, N))
    attn_wk = np.ones((P, H, N))
    attn_wv = np.ones((P, H, N))
    attn_wo = np.ones((P, H, N))
    attn_bk = np.ones((P, H, 1, 1))
    attn_bo = np.ones((N,))
    attn_bq = np.ones((P, H, 1, 1))
    attn_bv = np.ones((P, H, 1, 1))
    attn_dropout = np.full((B, SM, N), 0.5)

    norm1_scale = np.ones((N,))
    norm1_bias = np.zeros((N,))
    norm2_scale = np.ones((N,))
    norm2_bias = np.zeros((N,))

    linear1_w = np.ones((EMB, N))
    linear1_b = np.zeros((EMB,))
    linear1_dropout = np.full((B, SM, EMB), 0.5)
    linear2_w = np.ones((N, EMB))
    linear2_b = np.zeros((N,))
    ff_dropout = np.full((B, SM, N), 0.5)

    sdfg = dace.SDFG.from_file(fname)

    y = sdfg(x=x,
             attn_wq=attn_wq,
             attn_wk=attn_wk,
             attn_wv=attn_wv,
             attn_wo=attn_wo,
             attn_bk=attn_bk,
             attn_bo=attn_bo,
             attn_bq=attn_bq,
             attn_bv=attn_bv,
             attn_dropout=attn_dropout,
             norm1_scale=norm1_scale,
             norm1_bias=norm1_bias,
             norm2_scale=norm2_scale,
             norm2_bias=norm2_bias,
             linear1_w=linear1_w,
             linear1_b=linear1_b,
             linear1_dropout=linear1_dropout,
             linear2_w=linear2_w,
             linear2_b=linear2_b,
             ff_dropout=ff_dropout,
             attn_scale=1.0,
             B=B,
             H=H,
             N=N,
             SM=SM,
             P=P,
             emb=EMB)


if __name__ == '__main__':
    np.random.seed(seed=1234567890)

    fname = sys.argv[1]
    B = int(sys.argv[2])
    H = int(sys.argv[3])
    N = int(sys.argv[4])
    P = int(sys.argv[5])
    SM = int(sys.argv[6])
    EMB = int(sys.argv[7])

    run_bert(fname, B, H, N, P, SM, EMB)


