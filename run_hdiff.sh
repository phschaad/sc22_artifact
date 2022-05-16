#!/bin/bash

echo "===================================================="
echo "Running HDIFF benchmark...."

export OMP_NUM_THREADS=32

REPS=100

DIM_I=256
DIM_J=256
DIM_K=160
DIM_PRESET="paper"

echo "[I=$DIM_I, J=$DIM_J, K=$DIM_K] (NPBench '$DIM_PRESET' preset)."
echo "$REPS Repetitions each."

echo ""
echo "[01] Baseline - NumPy implementation:"
echo "Running..."
export DACE_profiling="false"
np_res=$(python npbench/run_benchmark.py -b hdiff -f numpy -p $DIM_PRESET -r $REPS)
np_median=$(echo "$np_res" | grep "median:" | awk '{print $6}')
echo "Runtime: $np_median"

echo ""
echo "[02] Best NPBench CPU version (DaCe):"
echo "Running..."
export DACE_profiling="false"
np_res=$(python npbench/run_benchmark.py -b hdiff -f dace_cpu -p $DIM_PRESET -r $REPS)
np_median=$(echo "$np_res" | grep "auto_opt" | grep "median:" | awk '{print $7}')
echo "Runtime: $np_median"

echo ""
echo "[03] Tuned - Data reshape and loop reorder:"
echo "Running..."
export DACE_profiling="true"
export DACE_profiling_status="false"
export DACE_treps=$REPS
dace_res=$(python _run_hdiff_reshaped_reordered.py -p $DIM_PRESET)
dace_median=$(echo "$dace_res" | grep "DaCe" | awk '{print $2,$3}')
echo "Runtime: $dace_median"

echo ""
echo "[04] Tuned - Strided padding:"
echo "Running..."
export DACE_profiling="true"
export DACE_profiling_status="false"
export DACE_treps=$REPS
export DACE_compiler_allow_view_arguments="true"
dace_res=$(python _run_hdiff_aligned.py -p $DIM_PRESET)
dace_median=$(echo "$dace_res" | grep "DaCe" | awk '{print $2,$3}')
echo "Runtime: $dace_median"

echo "===================================================="

