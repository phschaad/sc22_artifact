#!/bin/bash

echo "===================================================="
echo "Running HDIFF benchmark...."

REPS=100

echo "Patching NPBench L preset..."
cp npbench_hdiff_override.json npbench/bench_info/hdiff.json
echo "Patched."

echo "----------------------------------------------------"
echo "Using unaligned data sizes:"

DIM_I=315
DIM_J=315
DIM_K=175
DIM_PRESET="L"

echo "[I=$DIM_I, J=$DIM_J, K=$DIM_K] (modified NPBench '$DIM_PRESET' preset)."
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
np_median=$(echo "$np_res" | grep "fusion" | grep "median:" | awk '{print $6}')
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
dace_res=$(python _run_hdiff_aligned.py -p $DIM_PRESET)
dace_median=$(echo "$dace_res" | grep "DaCe" | awk '{print $2,$3}')
echo "Runtime: $dace_median"

echo "----------------------------------------------------"
echo "Using original NPBench data sizes:"

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
np_median=$(echo "$np_res" | grep "fusion" | grep "median:" | awk '{print $6}')
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

echo "===================================================="

