# 15. Лаба: tar и rsync на srv1

Скопируете каталог на второй контейнер — как мини-бэкап конфигов.

## Стенд

lab + доступ по SSH к **172.28.0.11** (course/course).

---

## Задание 1. tar локально

```bash
sudo mkdir -p /tmp/backup-demo/etc-sample
echo "config v1" | sudo tee /tmp/backup-demo/etc-sample/app.conf
tar -czvf /tmp/backup-demo.tar.gz -C /tmp/backup-demo .
tar -tzvf /tmp/backup-demo.tar.gz
```

---

## Задание 2. rsync по SSH

```bash
rsync -avz -e ssh /tmp/backup-demo/ course@172.28.0.11:/tmp/backup-from-lab/
ssh course@172.28.0.11 'ls -la /tmp/backup-from-lab/'
```

**Что увидите:** те же файлы на srv1.

---

## Задание 3. dry-run с --delete

```bash
mkdir -p /tmp/rsync-src /tmp/rsync-dst
echo a > /tmp/rsync-src/a.txt
cp -a /tmp/rsync-src/. /tmp/rsync-dst/
echo b > /tmp/rsync-src/b.txt
rm /tmp/rsync-src/a.txt
rsync -av --delete --dry-run /tmp/rsync-src/ /tmp/rsync-dst/
```

Прочитайте вывод: что **было бы** удалено/скопировано.

---

## Задание 4. Уборка

```bash
ssh course@172.28.0.11 'rm -rf /tmp/backup-from-lab'
rm -rf /tmp/backup-demo /tmp/backup-demo.tar.gz /tmp/rsync-src /tmp/rsync-dst
```

---

## Критерии успеха

- [ ] Архив создан и просмотрен через `-t`
- [ ] rsync на srv1 прошёл
- [ ] `--dry-run` показал план без изменений dst

Следующий урок: [16. SSH](16-ssh.md).
