# 04. Lab: containerd and kubeadm packages

Create role `k8s_common` in **`~/kuber-bootstrap`** (the folder from lesson 02). After this playbook, `kubelet` is installed and **not** Ready — there is no cluster yet.

You do **not** copy files from `courses-en`.

## Task 1. Vars and role files

`~/kuber-bootstrap/group_vars/k8s.yml`:

```yaml
k8s_minor: "1.31"
k8s_advertise_address: "192.168.56.10"
pod_network_cidr: "10.244.0.0/16"
```

`~/kuber-bootstrap/roles/k8s_common/handlers/main.yml`:

```yaml
---
- name: Reload sysctl
  ansible.builtin.command: sysctl --system
  changed_when: false

- name: Restart containerd
  ansible.builtin.service:
    name: containerd
    state: restarted
```

`~/kuber-bootstrap/roles/k8s_common/tasks/main.yml`:

```yaml
---
- name: Swap off now
  ansible.builtin.command: swapoff -a
  changed_when: false
  when: ansible_swaptotal_mb | int > 0

- name: Comment swap in fstab
  ansible.builtin.replace:
    path: /etc/fstab
    regexp: '^([^#].*\s+swap\s+)'
    replace: '# \1'

- name: Kernel modules persist
  ansible.builtin.copy:
    dest: /etc/modules-load.d/k8s.conf
    mode: "0644"
    content: |
      overlay
      br_netfilter

- name: Load overlay
  ansible.builtin.command: modprobe overlay
  changed_when: false

- name: Load br_netfilter
  ansible.builtin.command: modprobe br_netfilter
  changed_when: false

- name: Sysctl persist
  ansible.builtin.copy:
    dest: /etc/sysctl.d/99-k8s.conf
    mode: "0644"
    content: |
      net.bridge.bridge-nf-call-iptables = 1
      net.bridge.bridge-nf-call-ip6tables = 1
      net.ipv4.ip_forward = 1

- name: Apply sysctl now
  ansible.builtin.command: sysctl --system
  changed_when: false

- name: Packages for CRI and tools
  ansible.builtin.apt:
    name:
      - apt-transport-https
      - ca-certificates
      - curl
      - gpg
      - containerd
    state: present
    update_cache: true

- name: containerd config directory
  ansible.builtin.file:
    path: /etc/containerd
    state: directory
    mode: "0755"

- name: Default containerd config
  ansible.builtin.command: containerd config default
  register: containerd_default
  changed_when: false

- name: Write containerd config with systemd cgroup
  ansible.builtin.copy:
    dest: /etc/containerd/config.toml
    mode: "0644"
    content: "{{ containerd_default.stdout | regex_replace('SystemdCgroup = false', 'SystemdCgroup = true') }}"
  notify: Restart containerd

- name: Restart containerd if config changed
  ansible.builtin.meta: flush_handlers

- name: Enable containerd
  ansible.builtin.service:
    name: containerd
    state: started
    enabled: true

- name: Keyrings directory
  ansible.builtin.file:
    path: /etc/apt/keyrings
    state: directory
    mode: "0755"

- name: Kubernetes apt key
  ansible.builtin.get_url:
    url: "https://pkgs.k8s.io/core:/stable:/v{{ k8s_minor }}/deb/Release.key"
    dest: /tmp/kubernetes-apt-keyring.key
    mode: "0644"

- name: Dearmor Kubernetes key
  ansible.builtin.command: gpg --batch --yes --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg /tmp/kubernetes-apt-keyring.key
  args:
    creates: /etc/apt/keyrings/kubernetes-apt-keyring.gpg

- name: Kubernetes apt repo
  ansible.builtin.apt_repository:
    repo: "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v{{ k8s_minor }}/deb/ /"
    filename: kubernetes
    state: present

- name: kubeadm kubelet kubectl
  ansible.builtin.apt:
    name:
      - kubelet
      - kubeadm
      - kubectl
    state: present
    update_cache: true

- name: Hold kube packages
  ansible.builtin.dpkg_selections:
    name: "{{ item }}"
    selection: hold
  loop:
    - kubelet
    - kubeadm
    - kubectl

- name: Enable kubelet
  ansible.builtin.service:
    name: kubelet
    enabled: true
```

Inventory group `k8s` = cp + workers (from lesson 02).

## Task 2. Play

`~/kuber-bootstrap/site.yml`:

```yaml
- hosts: k8s
  become: true
  roles:
    - k8s_common
```

```bash
cd ~/kuber-bootstrap
ansible-playbook site.yml
```

Second run should be mostly `ok`, not `changed`.

## Task 3. Verify on a node

```bash
vagrant ssh cp -- 'containerd --version; kubeadm version; kubelet --version'
vagrant ssh cp -- 'sysctl net.ipv4.ip_forward'
vagrant ssh cp -- 'swapon --show'
vagrant ssh cp -- 'systemctl is-enabled kubelet'
```

`swapon --show` empty. `systemctl status kubelet` may be **failed/activating** — no `/etc/kubernetes/kubelet.conf` yet. That is lesson 06.

## Success criteria

- [ ] You typed the role in `~/kuber-bootstrap`  
- [ ] Ping still works  
- [ ] `kubeadm`, `kubelet`, `kubectl` report **1.31.x** on all three  
- [ ] swap is off; `ip_forward` is 1  
- [ ] Re-running the playbook does not reinstall packages every time (`apt` hold)

Next: [05. What kubeadm does](05-kubeadm-init.md).
