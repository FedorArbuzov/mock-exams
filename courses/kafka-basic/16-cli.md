# 16. CLI: kafka-topics, consumer-groups, describe

## Введение: «в UI всё красное, а что делать в SSH?»

On-call без доступа к Confluent Cloud UI — только bastion и **kafka-*.sh** (или обёртки вроде `kcat`). Оператор должен за минуты ответить: topic существует? сколько partition? **кто** в группе? какой **lag**? Эта глава — шпаргалка команд на стенде `mock-kafka` с путями `/opt/kafka/bin/`.

## Что вы узнаете

- **kafka-topics.sh**: list, create, describe, alter, delete.
- **kafka-console-producer/consumer.sh** — быстрые тесты.
- **kafka-consumer-groups.sh**: list, describe, delete, reset offsets (осторожно).
- **kafka-get-offsets.sh** / describe для log end.

## Bootstrap

| Контекст | Адрес |
|----------|--------|
| `docker exec mock-kafka …` | `localhost:9092` |
| хост | `localhost:9094` |

Переменная в shell контейнера:

```bash
export BS=localhost:9092
```

## kafka-topics.sh

```bash
# список
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server $BS --list

# создать
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server $BS \
  --create --topic demo.cli \
  --partitions 3 --replication-factor 1

# детали (leader, ISR)
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server $BS --describe --topic demo.cli

# изменить partition (только увеличение)
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server $BS --alter --topic demo.cli --partitions 6

# удалить
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server $BS --delete --topic demo.cli
```

## kafka-consumer-groups.sh

```bash
# все группы
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server $BS --list

# lag и назначения
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server $BS --group lab-workers --describe

# состояние группы
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server $BS --group lab-workers --describe --state

# удалить группу (метаданные offset)
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server $BS --group lab-workers --delete
```

### Reset offsets (осторожно)

Только на **учебном** стенде:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server $BS \
  --group lab-workers \
  --reset-offsets --to-earliest \
  --topic orders.events --execute
```

Сначала **dry-run** без `--execute` покажет план.

## kafka-get-offsets.sh

Log end offset по topic:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-get-offsets.sh \
  --bootstrap-server $BS \
  --topic orders.events
```

Вывод вида `orders.events:0:12345` — partition 0, end offset 12345.

## kafka-configs.sh

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-configs.sh \
  --bootstrap-server $BS \
  --entity-type topics --entity-name orders.events --describe
```

## Console producer/consumer (напоминание)

```bash
docker exec -it mock-kafka /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server $BS --topic demo.cli

docker exec -it mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server $BS --topic demo.cli --from-beginning
```

## На стенде: диагностический чеклист

После инцидента «consumer не читает»:

```bash
export BS=localhost:9092

docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server $BS --describe --topic <topic>
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh --bootstrap-server $BS --list
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh --bootstrap-server $BS --group <group> --describe
docker exec mock-kafka /opt/kafka/bin/kafka-get-offsets.sh --bootstrap-server $BS --topic <topic>
```

## Типичные ошибки

| Ошибка | Последствие |
|--------|-------------|
| `--bootstrap-server` с хоста `9092` с laptop | connection refused — нужен **9094** |
| `--delete` topic на prod без бэкапа | потеря данных |
| `--reset-offsets --execute` без согласования | массовая переобработка |
| Путать **log end** и **committed** | неверный lag вручную |

## В продакшене

- ACL: отдельные учётки **read-only** для describe/list.
- Автоматизация: Terraform `kafka_topic`, GitOps.
- `kcat -L`, `kcat -Q` — быстрые проверки с CI.
- Полный runbook — в kafka-intermediate (ACL, quotas, rack awareness).

## Резюме

**topics** — топология; **consumer-groups** — кто читает и lag; **get-offsets** — хвост лога. Все лабы курса используют `/opt/kafka/bin/kafka-*.sh` внутри `mock-kafka`.

## Чек-лист

- Команда describe topic?
- Как увидеть lag группы?
- Чем отличается `--list` topics от `--list` groups?
- Когда нужен `--execute` при reset?

Следующий урок: [17. Лаба: CLI](17-lab-cli.md).
