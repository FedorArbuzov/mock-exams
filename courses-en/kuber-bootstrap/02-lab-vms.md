# 02. Lab: three VMs and Ansible ping

You create the stand yourself. Do **not** install Kubernetes yet. You do **not** need the `courses-en` tree.

**Path B (16 GB rented VM + LXD):** finish [ENVIRONMENT.md](ENVIRONMENT.md) Path B first. Skip Tasks 1–3 here. You already have `ansible.cfg` + `inventory/lab.ini` from **B5**. Jump to **Task 4**.

## Prep (Path A)

[ENVIRONMENT.md](ENVIRONMENT.md) Path A — VirtualBox + Vagrant on the host; Ansible on Linux/macOS or **WSL2**.

```powershell
New-Item -ItemType Directory -Force -Path "$HOME\kuber-bootstrap\inventory" | Out-Null
Set-Location $HOME\kuber-bootstrap
```

```bash
mkdir -p ~/kuber-bootstrap/inventory
cd ~/kuber-bootstrap
```

Windows: run **`vagrant` in PowerShell** in this folder. Run **`ansible` in WSL** in the same folder (`/mnt/c/Users/YOU/kuber-bootstrap` if the home is on `C:`).

## Task 1. Vagrantfile

Create **`~/kuber-bootstrap/Vagrantfile`**:

```ruby
# frozen_string_literal: true

Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/jammy64"
  config.vm.box_check_update = false

  nodes = {
    "cp" => { ip: "192.168.56.10", cpus: 2, memory: 2048 },
    "w1" => { ip: "192.168.56.11", cpus: 1, memory: 1536 },
    "w2" => { ip: "192.168.56.12", cpus: 1, memory: 1536 }
  }

  nodes.each do |name, opts|
    config.vm.define name do |n|
      n.vm.hostname = name
      n.vm.network "private_network", ip: opts[:ip]
      n.vm.provider "virtualbox" do |vb|
        vb.name = "kuber-bootstrap-#{name}"
        vb.memory = opts[:memory]
        vb.cpus = opts[:cpus]
        vb.customize ["modifyvm", :id, "--natdnshostresolver1", "on"]
      end
    end
  end
end
```

## Task 2. Ansible config + inventory

Create **`~/kuber-bootstrap/ansible.cfg`**:

```ini
[defaults]
inventory = inventory/lab.ini
host_key_checking = False
retry_files_enabled = False
interpreter_python = auto_silent
timeout = 30

[privilege_escalation]
become = True
become_method = sudo
```

Create **`~/kuber-bootstrap/inventory/lab.ini`**. Keys appear after `vagrant up` under `.vagrant/machines/`:

```ini
[k8s_cp]
cp ansible_host=192.168.56.10 ansible_ssh_private_key_file=.vagrant/machines/cp/virtualbox/private_key

[k8s_workers]
w1 ansible_host=192.168.56.11 ansible_ssh_private_key_file=.vagrant/machines/w1/virtualbox/private_key
w2 ansible_host=192.168.56.12 ansible_ssh_private_key_file=.vagrant/machines/w2/virtualbox/private_key

[k8s:children]
k8s_cp
k8s_workers

[all:vars]
ansible_user=vagrant
ansible_ssh_common_args=-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null
```

## Task 3. `vagrant up`

From `~/kuber-bootstrap`:

```powershell
vagrant up
vagrant status
```

Three VMs `running`. First time downloads the Ubuntu box.

```powershell
vagrant ssh cp -- hostname
vagrant ssh w1 -- hostname
```

## Task 4. Ping from Ansible

Same directory (WSL on Windows):

```bash
cd ~/kuber-bootstrap
ansible all -m ping
ansible-inventory --graph
```

Every host: `pong`. Groups `k8s_cp` and `k8s_workers` in the graph.

If `UNREACHABLE`:

| Symptom | Try |
|---------|-----|
| Permission denied | key path in inventory; `vagrant ssh-config` |
| No route to 192.168.56.10 from WSL | mirrored networking, or Ansible on `cp` |
| `vagrant` not found in WSL | Vagrant is a Windows app — PowerShell |

## Task 5. Facts (sanity)

```bash
ansible all -m setup -a "filter=ansible_memory_mb"
```

`cp` ~2 GB; workers ~1.5 GB. If much less, the hypervisor overcommitted.

## Success criteria

- [ ] You wrote `Vagrantfile`, `ansible.cfg`, `inventory/lab.ini` (not copied from this repo)
- [ ] `vagrant status` — 3 × running
- [ ] `ansible all -m ping` — 3 × pong
- [ ] `--graph` shows `k8s_cp` and `k8s_workers`

Do not `destroy`. Next: [03. Node baseline](03-node-baseline.md).
