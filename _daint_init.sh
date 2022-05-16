#/bin/bash
module swap PrgEnv-cray PrgEnv-gnu
module load daint-mc
module load cray-python/3.8.2.1
module load gcc/8.3.0
module load intel
export LD_PRELOAD='/opt/cray/pe/lib64/libsci_cray_mp.so.5'
