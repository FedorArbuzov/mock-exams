# mock-exams Quickstart

Setup flow: Docker Desktop -> Kubernetes -> run one command -> open courses in the browser.

No admin rights required. You need internet access and about 5 GB of free disk space.

---

## Step 1. Install Docker Desktop

Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/):

| OS | Link |
|----|------|
| Windows | https://docs.docker.com/desktop/setup/install/windows-install/ |
| macOS | https://docs.docker.com/desktop/setup/install/mac-install/ |
| Linux | https://docs.docker.com/desktop/setup/install/linux-install/ |

After install, start Docker Desktop and wait until status is **Docker is running**.

Check in terminal:

```bash
docker info
```

This command should finish without errors.

---

## Step 2. Enable Kubernetes in Docker Desktop

1. Open **Docker Desktop**.
2. Go to **Settings** -> **Kubernetes**.
3. Enable **Kubernetes**.
4. Click **Apply & Restart** (or **Create cluster**).
5. Wait 1-3 minutes until the cluster is ready.

Check:

```bash
kubectl config use-context docker-desktop
kubectl get nodes
```

Expected output: nodes in **Ready** state, for example:

```text
NAME                    STATUS   ROLES           AGE   VERSION
desktop-control-plane   Ready    control-plane   ...   v1.31.x
desktop-worker          Ready    <none>          ...   v1.31.x
```

> **WSL note:** use PowerShell or a WSL terminal with Docker Desktop WSL Integration enabled.

---

## Step 3. Run one command

### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/FedorArbuzov/mock-exams-win/main/windows-mockctl-web.ps1 | iex
```

If execution policy blocks scripts:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### macOS / Linux

```bash
curl -fsSL https://raw.githubusercontent.com/FedorArbuzov/mock-exams-win/main/unix-mockctl-web.sh | bash
```

The script will:

- save kubeconfig to `~/.mock-exams/kubeconfig.yaml`;
- pull `ghcr.io/fedorarbuzov/mock-exams/mockctl-web:latest`;
- start container `mockctl-web` on port **8091**;
- verify cluster access from inside the container.

Expected final line:

```text
OK  http://127.0.0.1:8091/
```

---

## Step 4. Open courses

Open:

**http://127.0.0.1:8091/**

You will see lessons and labs (Start lab / Check / Cleanup).

---

## Stop

```bash
docker rm -f mockctl-web
```

Kubernetes in Docker Desktop stays enabled.

---

## Troubleshooting

### "Start Docker Desktop first"
Docker Desktop is not running. Start it and retry.

### "Enable Kubernetes in Docker Desktop"
Kubernetes is disabled or still starting. Recheck Step 2 and wait.

### Browser says "This site can't be reached" / "didn't send any data"
Refresh image and rerun:

**Windows:**

```powershell
docker pull ghcr.io/fedorarbuzov/mock-exams/mockctl-web:latest
docker rm -f mockctl-web
irm https://raw.githubusercontent.com/FedorArbuzov/mock-exams-win/main/windows-mockctl-web.ps1 | iex
```

**macOS / Linux:**

```bash
docker pull ghcr.io/fedorarbuzov/mock-exams/mockctl-web:latest
docker rm -f mockctl-web
curl -fsSL https://raw.githubusercontent.com/FedorArbuzov/mock-exams-win/main/unix-mockctl-web.sh | bash
```

### Port 8091 is busy
Use another port and rerun:

- Windows: `$env:MOCKCTL_WEB_PORT = 9091`
- macOS / Linux: `export MOCKCTL_WEB_PORT=9091`

Then open `http://127.0.0.1:9091/`.

---

## Links

- Full installation guide: [INSTALL.md](INSTALL.md)
- Bootstrap scripts repo: [mock-exams-win](https://github.com/FedorArbuzov/mock-exams-win)
- Local build / rebuild: [deploy/mockctl-web/README.md](deploy/mockctl-web/README.md) (`scripts/dev-mockctl-web.ps1`)
