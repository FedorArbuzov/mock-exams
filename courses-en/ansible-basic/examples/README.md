# Ansible-basic examples

Copy snippets into `~/ansible-lab` on the **`lab`** container. Do not commit real vault passwords.

| Path | Purpose |
|------|---------|
| [ansible.cfg](ansible.cfg) | defaults |
| [inventory/lab.ini](inventory/lab.ini) | stand inventory |
| [group_vars/app.yml](group_vars/app.yml) | shared app-tier vars (lab 07) |
| [group_vars/all/vars.yml](group_vars/all/vars.yml) | `db_password` mapping for Vault (finale; pair with encrypted `vault.yml`) |
| [host_vars/srv1.yml](host_vars/srv1.yml) | staging override for srv1 |
| [host_vars/web.yml](host_vars/web.yml) | nginx `server_name` for web |
| [roles/nginx/templates/ansible-lab.conf.j2](roles/nginx/templates/ansible-lab.conf.j2) | sample vhost (finale uses `proxy_pass`) |
| [roles/app/templates/nimbus-app.service.j2](roles/app/templates/nimbus-app.service.j2) | final project systemd unit |
| [site.yml.example](site.yml.example) | final project skeleton |

Final verification: [../scripts/verify-final.sh](../scripts/verify-final.sh).
