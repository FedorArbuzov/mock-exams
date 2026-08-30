# mockctl web + kubectl — courses embedded; talks to host K8s via mounted kubeconfig.
FROM golang:1.23-bookworm AS build

WORKDIR /src/mockctl
COPY mockctl/go.mod mockctl/go.sum ./
RUN go mod download

COPY mockctl/ ./
# go:embed needs courses under mockctl/courses/ (see build-embed-docker.ps1).
COPY courses-en/ ./courses/

RUN CGO_ENABLED=0 go build -tags embed -trimpath -ldflags "-s -w" -o /mockctl .

FROM debian:bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl unzip \
  && KVER="$(curl -fsSL https://dl.k8s.io/release/stable.txt)" \
  && curl -fsSL "https://dl.k8s.io/release/${KVER}/bin/linux/amd64/kubectl" -o /usr/local/bin/kubectl \
  && chmod +x /usr/local/bin/kubectl \
  && curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip \
  && unzip -q /tmp/awscliv2.zip -d /tmp \
  && /tmp/aws/install \
  && rm -rf /tmp/aws /tmp/awscliv2.zip \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /mockctl /usr/local/bin/mockctl
COPY deploy/mockctl-web/entrypoint.sh /entrypoint.sh
# Strip CRLF when the repo is checked out on Windows.
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

WORKDIR /work
EXPOSE 8091

ENTRYPOINT ["/entrypoint.sh"]
CMD ["web", "--no-open", "--bind", "0.0.0.0", "--port", "8091"]
