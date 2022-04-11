ARG VARIANT="3.8"

FROM mcr.microsoft.com/vscode/devcontainers/python:0-${VARIANT}

RUN pip3 --disable-pip-version-check --no-cache-dir install dace==0.13 pygount scipy pandas numpy matplotlib

CMD ["python", "-m", "http.server", "--directory", "local_view", "8080"]
