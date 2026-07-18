# 08. Лаба: apt и dpkg

Поставите пару утилит, найдёте, какому пакету принадлежит бинарник, и потренируетесь в «сломанном» dpkg (учебный сценарий).

## Стенд

`docker compose exec lab bash`

---

## Задание 1. update и install

```bash
sudo apt update
apt search '^jq$'
sudo apt install -y jq tree
jq --version
tree --version
```

**Что увидите:** версии установленных пакетов.

---

## Задание 2. dpkg -L и dpkg -S

```bash
dpkg -L jq | head
dpkg -S /usr/bin/jq
which jq
```

**Что увидите:** список файлов пакета и обратное соответствие путь → пакет.

---

## Задание 3. policy и версия

```bash
apt policy jq
apt show jq | head -15
```

---

## Задание 4. remove vs purge (учебно)

```bash
sudo apt install -y hello
dpkg -L hello | grep etc
sudo apt remove -y hello
sudo apt install -y hello
sudo apt purge -y hello
```

**Что увидите:** после `purge` конфиги пакета hello исчезают (если пакет их создавал).

---

## Задание 5. autoremove

```bash
sudo apt autoremove -y
```

---

## Критерии успеха

- [ ] `apt update` без ошибок
- [ ] `jq` и `tree` установлены
- [ ] `dpkg -S` нашёл пакет для `/usr/bin/jq`

Следующий урок: [09. Процессы](09-processes.md).
