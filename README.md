# Setup

The contents of the repository can be directly deployed into an automatically
configured Docker container through
[Visual Studio Code](https://code.visualstudio.com/).
To achieve this, the following requirements should be met:

- Installed (and running) Docker engine.
- [Visual Studio Code](https://code.visualstudio.com/) (VS Code).
- Microsoft's VS Code[
  Remote Development extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack),
  available through the built-in extension marketplace.

With these requirements met, the following instructions can be followed to
launch the container and attach VS Code to it:

1. Open VS Code and navigate to the `Remote Explorer` panel in the
   toolbar on the left.
2. In the `Devvolumes` panel, click on `Clone Repository in Container Volume`.
   If this option is not present, check if the Docker daemon is running and
   re-open VS Code before resuming from this step.
3. Paste `https://github.com/phschaad/sc22_artifact.git` into the input field and hit Enter.
4. Wait for the container to fully start.
5. Once an additional `SDFG Optimization` icon appears in the left toolbar,
   the container has been fully started and initialized.

A more in-depth step-by-step guide on how to launch Development Containers in
VS Code can be found [here](https://code.visualstudio.com/docs/remote/containers#_quick-start-open-a-git-repository-or-github-pr-in-an-isolated-container-volume).

### Pre-Built VM

A pre-built VM Image is provided at https://doi.org/10.5281/zenodo.6424094 in
cases where the approach described above can not be followed. The user is named
`sc22`, and the user password is `supercomputing`.

**NOTE**: It is strongly discouraged to use the pre-built VM due to decreased
performance and stability. We instead recommend following the steps outlined
above.

# Running

### Analysis via Local View

The local view can be started with the shell script `localview.sh` through the
integrated terminal in VS Code, connected to the container.

This starts a
webserver on `localhost:8080`, accessible outside the container, on which
the local view resides. A dropdown in the top navigation bar allows switching
between the different applications mentioned or depicted in the paper using the
local view.

### HDIFF experiments

Horizontal diffusion can be run using the shell script `run_hdiff.sh` through
the integrated terminal in VS Code, connected to the container.

This runs and times two sets of experiments:

- Dataset with purposefully introduced misalignment (modified `L` dataset from
  NPBench, `K=175`, `I=J=315`):
  1. *Baseline*: Unoptimized NumPy version provided by NPBench.
  2. *NPBench Best CPU Auto-Opt*: Best automatically optimized version for CPUs
  provided by NPBench.
  3. *Reshaped / Reordered*: A hand-tuned version, where data layouts and loop orders
  were optimized.
  4. *Aligned*: A further optimized version, where post-padding was introduced to
  improve alignment.
- Dataset used in the [original NPBench publication](https://doi.org/10.1145/3447818.3460360)
  (`paper` dataset from NPBench, `K=160`, `I=J=256`):
  1. *Baseline*: Unoptimized NumPy version provided by NPBench.
  2. *NPBench Best CPU Auto-Opt*: Best automatically optimized version for CPUs
  provided by NPBench.
  3. *Reshaped / Reordered*: A hand-tuned version, where data layouts and loop orders
  were optimized.

Each experiment run is executed 100 times, and the median time is reported.

### BERT experiments

The BERT encoder can be run using the shell script `run_bert.sh` through
the integrated terminal in VS Code, connected to the container.

This runs and times the following experiments:
1. *Baseline*: Unoptimized, naive NumPy implementation.
2. *Fused*: Optimized version with some loop fusion.
2. *Fully Fused ('Final')*: Fastest obtained version with maximal degree of loop fusion.

Each experiment run is executed 10 times, and the median time is reported.

# File Structure

- `README.md`: This file.
- `.devcontainer`: VS Code development container settings, including Dockerfile.
- `.vscode`: VS Code settings and configurations.
- `BERT`: Contains three versions of the BERT encoder.
  - `01_original.sdfg`: Unoptimized, naive NumPy implementation.
  - `02_fused.sdfg`: Optimized version with some loop fusion.
  - `03_final.sdfg`: Fastest obtained version with maximal degree of loop fusion.
- `HDIFF`: Contains four versions of the horizontal diffusion (`hdiff`) program.
  - `01_original.sdfg`: Unoptimized, naive NumPy implementation from NPBench.
  - `02_npbench_best_cpu.sdfg`: Best auto-optimized CPU version obtained from NPBench.
  - `03_reshape_reorder.sdfg`: Optimized version with optimized data layout and loop order.
  - `04_aligned.sdfg`: Further optimized version with post-padding to improve alignment.
- `local_view`: Source code for the local analysis view.
- `npbench`: The NPBench version used for the experiments, as a git submodule.
- `_*.py`: Helper scripts to run the experiments, don't execute directly.
- `npbench_hdiff_override.json`: Custom data size configuration for NPBench.
- `localview.sh`: **Shell script to start the local analysis view in a webserver on port 8080.**
- `run_bert.sh`: **Shell script to run all BERT encoder experiments.**
- `run_hdiff.sh`: **Shell script to run all HDIFF experiments.**
