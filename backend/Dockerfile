# docker build -f Dockerfile -t uhhlt/anno_plot_backend:latest .
# docker push uhhlt/anno_plot_backend:latest

FROM ubuntu:jammy-20221020 as ubuntu
CMD ["/bin/bash"]

# makes CUDA devices visible to the container by default
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=compute,utility

# install basic tools to download files/models
RUN apt-get update -q &&\
    apt-get install -q -y --no-install-recommends bzip2 curl wget ca-certificates build-essential &&\
    apt-get clean &&\
    rm -rf /var/lib/apt/lists/* &&\
    rm -r /var/cache

# install micromamba for anaconda python package management
#RUN "${SHELL}" <(curl -L micro.mamba.pm/install.sh)
RUN curl -Ls https://micro.mamba.pm/api/micromamba/linux-64/latest | tar -xvj bin/micromamba
# RUN wget https://micro.mamba.pm/api/micromamba/linux-64/latest -O mamba.tar.bz2
# ARG MICROMAMBA_VERSION=1.5.1
# RUN wget https://micro.mamba.pm/api/micromamba/linux-64/${MICROMAMBA_VERSION} -O mamba.tar.bz2
# RUN tar -xvj -f mamba.tar.bz2 bin/micromamba
# RUN rm mamba.tar.bz2

# create the 'annoplot' python environment with all dependencies
ENV MAMBA_ROOT_PREFIX=/opt
COPY environment.yml .
RUN micromamba create -f environment.yml -q -y &&\
    micromamba clean -a -f -q -y &&\
    find /opt/ -follow -type f -name '*.a' -delete &&\
    find /opt/ -follow -type f -name '*.js.map' -delete &&\
    rm -r /root/.cache

# These settings & scripts are needed to automatically start any CMD in the container with the python environment
ENV MAMBA_EXE="/bin/micromamba"
ENV ENV_NAME=AnnoPlot
ARG MAMBA_DOCKERFILE_ACTIVATE=1
COPY _entrypoint.sh /usr/local/bin/_entrypoint.sh
COPY _activate_current_env.sh /usr/local/bin/_activate_current_env.sh
COPY _dockerfile_shell.sh /usr/local/bin/_dockerfile_shell.sh
ENTRYPOINT ["/usr/local/bin/_entrypoint.sh"]
SHELL ["/usr/local/bin/_dockerfile_shell.sh"]

# set up python env variables
ARG AP_ENV
ENV AP_ENV=${AP_ENV} \
    PYTHONFAULTHANDLER=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONHASHSEED=random \
    PYTHONDONTWRITEBYTECODE=1 \
    CUPY_CACHE_IN_MEMORY=1

# copy the source code into the image
WORKDIR /anno_plot_code
COPY . /anno_plot_code
WORKDIR /anno_plot_code/src