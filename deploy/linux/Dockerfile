# Ubuntu with systemd for Linux course labs (Docker-only environment)
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV container=docker

RUN apt-get update && apt-get install -y --no-install-recommends \
    systemd \
    systemd-sysv \
    dbus \
    openssh-server \
    sudo \
    vim \
    curl \
    wget \
    ca-certificates \
    gnupg \
    iproute2 \
    iputils-ping \
    traceroute \
    net-tools \
    dnsutils \
    bind9-dnsutils \
    iptables \
    nftables \
    ufw \
    lvm2 \
    thin-provisioning-tools \
    e2fsprogs \
    xfsprogs \
    nfs-kernel-server \
    nfs-common \
    nginx \
    apache2 \
    bind9 \
    postfix \
    rsyslog \
    auditd \
    acl \
    at \
    cron \
    rsync \
    tar \
    gzip \
    bzip2 \
    xz-utils \
    zip \
    unzip \
    locales \
    strace \
    lsof \
    htop \
    jq \
    procps \
    psmisc \
    util-linux \
    apparmor \
    apparmor-utils \
    fail2ban \
    keepalived \
    openssl \
    tcpdump \
    netcat-openbsd \
    python3 \
    && rm -rf /var/lib/apt/lists/* \
    && locale-gen en_US.UTF-8

# Trim default units that break in containers
RUN systemctl mask \
    dev-hugepages.mount \
    sys-fs-fuse-connections.mount \
    systemd-remount-fs.service \
    systemd-logind.service \
    getty.target \
    console-getty.service \
    && systemctl set-default multi-user.target

COPY entrypoint.sh /usr/local/bin/lab-entrypoint.sh
RUN chmod +x /usr/local/bin/lab-entrypoint.sh

# Lab user: course / course (change in production!)
RUN useradd -m -s /bin/bash course \
    && echo 'course:course' | chpasswd \
    && usermod -aG sudo course \
    && echo 'course ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/course \
    && mkdir -p /var/run/sshd /backup /srv/lab \
    && ssh-keygen -A

EXPOSE 22 80 443

STOPSIGNAL SIGRTMIN+3
ENTRYPOINT ["/usr/local/bin/lab-entrypoint.sh"]
CMD ["/sbin/init"]
