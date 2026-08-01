# mockctl web + kubectl — courses embedded, talks to host minikube via mounted kubeconfig.
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
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && KVER="$(curl -fsSL https://dl.k8s.io/release/stable.txt)" \
  && curl -fsSL "https://dl.k8s.io/release/${KVER}/bin/linux/amd64/kubectl" -o /usr/local/bin/kubectl \
  && chmod +x /usr/local/bin/kubectl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /mockctl /usr/local/bin/mockctl
COPY deploy/mockctl-web/entrypoint.sh /entrypoint.sh
# Strip CRLF when the repo is checked out on Windows.
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

WORKDIR /work
EXPOSE 8091

ENTRYPOINT ["/entrypoint.sh"]
CMD ["web", "--no-open", "--port", "8091"]
