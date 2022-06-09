#!/bin/bash

echo "===================================================="
echo "Running BERT benchmark...."

REPS=100

echo "----------------------------------------------------"
echo "Using data sizes:"

DIM_B=8
DIM_H=16
DIM_N=1024
DIM_P=64
DIM_SM=512
DIM_EMB=4096

echo "[B=$DIM_B, H=$DIM_H, N=$DIM_N, P=$DIM_P, SM=$DIM_SM, EMB=$DIM_EMB]"
echo "$REPS Repetitions each."

echo ""
echo "[01] Baseline - Naive NumPy implementation:"
echo "Running..."
export DACE_library_blas_default_implementation="MKL"
export DACE_profiling="true"
export DACE_profiling_status="false"
export DACE_treps=$REPS
export fname="BERT/01_original.sdfg"
res=$(python _run_bert.py $fname $DIM_B $DIM_H $DIM_N $DIM_P $DIM_SM $DIM_EMB)
filtered=$(echo "$res" | grep "DaCe")
read -ra arr <<<"$filtered"
echo "Runtime: ${arr[-2]}${arr[-1]}"

echo ""
echo "[02] Tuned - First set of fusions:"
echo "Running..."
export DACE_library_blas_default_implementation="MKL"
export DACE_profiling="true"
export DACE_profiling_status="false"
export DACE_treps=$REPS
export fname="BERT/02_fused.sdfg"
res=$(python _run_bert.py $fname $DIM_B $DIM_H $DIM_N $DIM_P $DIM_SM $DIM_EMB)
filtered=$(echo "$res" | grep "DaCe")
read -ra arr <<<"$filtered"
echo "Runtime: ${arr[-2]}${arr[-1]}"

echo ""
echo "[03] Tuned - Complete fusion:"
echo "Running..."
export DACE_library_blas_default_implementation="MKL"
export DACE_profiling="true"
export DACE_profiling_status="false"
export DACE_treps=$REPS
export fname="BERT/03_final.sdfg"
res=$(python _run_bert.py $fname $DIM_B $DIM_H $DIM_N $DIM_P $DIM_SM $DIM_EMB)
filtered=$(echo "$res" | grep "DaCe")
read -ra arr <<<"$filtered"
echo "Runtime: ${arr[-2]}${arr[-1]}"

echo "===================================================="

