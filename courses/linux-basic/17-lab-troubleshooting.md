# 17. Лаба: диагностика по чек-листу

Симулируем мини-инцидент: «сервис не отвечает» — пройдите шаги из урока 17, не перезапуская контейнер вслепую.

## Стенд

lab; при необходимости srv1.

---

## Задание 1. Снимок ресурсов

```bash
uptime
free -h
df -h
df -i /
```

Запишите load, свободную RAM, занятость `/`.

---

## Задание 2. nginx как «подопытный»

```bash
sudo apt install -y nginx
systemctl is-active nginx
ss -tlnp | grep ':80'
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1/
```

---

## Задание 3. Сломать и починить

```bash
sudo nginx -t
echo 'invalid directive here;' | sudo tee -a /etc/nginx/nginx.conf
sudo systemctl restart nginx
systemctl status nginx --no-pager | head -15
journalctl -u nginx --no-pager -n 15
```

Откатите последнюю строку (vim/sed) или:

```bash
sudo sed -i '$ d' /etc/nginx/nginx.conf
sudo nginx -t && sudo systemctl restart nginx
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1/
```

**Что увидите:** failed → лог с syntax error → после отката снова 200.

---

## Задание 4. Топ процессов

```bash
ps aux --sort=-%cpu | head -6
ps aux --sort=-%mem | head -6
```

---

## Задание 5. Сеть до srv1

```bash
ping -c2 172.28.0.11
curl -s -o /dev/null -w "%{http_code}\n" --connect-timeout 2 http://172.28.0.11/ || echo "curl failed"
```

---

## Критерии успеха

- [ ] Собран снимок uptime/df/free
- [ ] Намеренно сломан nginx и восстановлен по логам
- [ ] `nginx -t` использован до restart

Следующий урок: [18. Финальный проект](18-final-project.md).
