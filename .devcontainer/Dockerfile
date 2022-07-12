FROM mcr.microsoft.com/vscode/devcontainers/anaconda:3

RUN conda install -y python=3.8
RUN conda install -y mkl mkl-devel mkl-include
RUN pip3 --disable-pip-version-check --no-cache-dir install \
    dace==0.13.1 pygount scipy pandas numpy matplotlib
