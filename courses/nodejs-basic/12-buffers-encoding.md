# 12. Buffers и кодировки

## Сценарий с работы

Микросервис читает CSV-выгрузку из 1С и отдаёт её в HTTP-ответ. На staging (Linux) кириллица в названиях товаров корректна; на ноутбуке Windows QA видит «РџСЂРёРЅС‚» вместо «Принтер». Разработчик вызвал `readFile` без кодировки, получил `Buffer`, сделал `.toString()` без аргумента — Node использовал UTF-8, а файл был в **Windows-1251**. Второй баг: `writeFile` записал JSON, но другой сервис не парсит — в начале файла **BOM** `EF BB BF`.

В Node.js бинарные данные представлены **`Buffer`** — массивоподобный объект байтов. Текст на диске и в сети — всегда байты; **кодировка** определяет, как символы ↔ байты. Для shop-каталога и HTTP-тела курс стандартизирует **UTF-8**.

## Что вы узнаете

- Что такое `Buffer` и когда `readFile` возвращает его
- Явное указание `"utf8"` / `"utf-8"`
- `Buffer.from`, `buf.toString(encoding)`
- BOM и проблемы Windows-редакторов
- Сравнение буферов, длина в байтах vs символах
- Связь Buffer ↔ streams ([13-streams.md](13-streams.md))

---

## Buffer в Node.js

`Buffer` — выделенная память вне V8 heap для I/O:

```javascript
import { readFile } from "node:fs/promises";

// без кодировки — Buffer
const buf = await readFile("data/catalog.json");
console.log(Buffer.isBuffer(buf)); // true
console.log(buf.length);           // размер в БАЙТАХ

// с utf8 — string
const text = await readFile("data/catalog.json", "utf8");
console.log(typeof text); // string
```

| API | Результат |
|-----|-----------|
| `readFile(path)` | `Buffer` |
| `readFile(path, "utf8")` | `string` (UTF-8 decode внутри) |
| `writeFile(path, string, "utf8")` | строка → UTF-8 байты на диск |
| `writeFile(path, buffer)` | байты как есть |

---

## Создание и преобразование

```javascript
const buf1 = Buffer.from("Привет", "utf8");
const buf2 = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]);

console.log(buf1.toString("utf8")); // Привет
console.log(buf2.toString("utf8")); // Hello

const hex = buf1.toString("hex");
console.log(hex); // d09f0440043504350442...
```

**Важно:** длина строки в символах ≠ длина Buffer в байтах для не-ASCII:

```javascript
const s = "€";
console.log(s.length);                    // 1 (один символ)
console.log(Buffer.from(s, "utf8").length); // 3 байта в UTF-8
```

---

## UTF-8 как стандарт курса

JSON, HTTP JSON, FastAPI `:8090` — **UTF-8** без BOM:

```javascript
await writeFile(
  "catalog.json",
  JSON.stringify(data, null, 2) + "\n",
  "utf8"
);
```

Заголовок HTTP ([15-http-module.md](15-http-module.md)):

```javascript
res.setHeader("Content-Type", "application/json; charset=utf-8");
```

---

## Проблемы кодировок на Windows

### UTF-16 и Notepad

Старый Notepad сохранял «Unicode» как **UTF-16 LE** с BOM `FF FE`. `JSON.parse` на таком файле:

```text
SyntaxError: Unexpected token '' ...
```

**Решение:** VS Code / `writeFile(..., "utf8")`; при чтении чужих файлов — detect или договорённость UTF-8.

### UTF-8 BOM

Некоторые редакторы добавляют BOM `EF BB BF` в начало UTF-8. `JSON.parse` может упасть на первом символе `{`.

```javascript
function stripBom(text) {
  if (text.charCodeAt(0) === 0xfeff) {
    return text.slice(1);
  }
  return text;
}

const catalog = JSON.parse(stripBom(raw));
```

### CP1251 / legacy CSV

Если источник явно Windows-1251:

```javascript
import { readFile } from "node:fs/promises";
// Node не декодирует cp1251 в readFile напрямую — нужен Buffer + iconv-lite
// или конвертация на этапе экспорта в UTF-8
const buf = await readFile("export.csv");
const text = buf.toString("utf8"); // НЕВЕРНО для cp1251
```

На практике: **договоритесь об UTF-8 на границе систем**; для legacy — пакет `iconv-lite` (в intermediate-курсе).

### `toString()` без аргумента

```javascript
buffer.toString(); // эквивалент utf8
```

Если байты не UTF-8 — «кракозябры» без throw. Явно указывайте кодировку и валидируйте источник.

---

## Buffer и HTTP-тело

При работе с `http` модулем ([15-http-module.md](15-http-module.md)) тело запроса собирают из chunks:

```javascript
const chunks = [];
for await (const chunk of req) {
  chunks.push(chunk); // chunk — Buffer
}
const body = Buffer.concat(chunks).toString("utf8");
```

Для JSON API проверяйте `Content-Type` и лимит размера тела.

---

## Сравнение и копирование

```javascript
const a = Buffer.from("abc");
const b = Buffer.from("abc");
const c = Buffer.from("abd");

console.log(a.equals(b)); // true — безопасное сравнение содержимого
console.log(a.equals(c)); // false

const copy = Buffer.from(a); // копия
```

Не сравнивайте секреты через `===` на строках с timing attack в auth-коде — для лаб fs достаточно `equals`.

---

## `TextEncoder` / `TextDecoder` (Web API в Node)

Альтернатива Buffer для UTF-8:

```javascript
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

const bytes = encoder.encode("shop");
const text = decoder.decode(bytes);
```

Удобно при interop с `fetch` и TypedArray; для fs курс использует `"utf8"` в `readFile`/`writeFile`.

---

## Связь с предыдущими уроками

| Урок | Связь |
|------|-------|
| [10-fs-path.md](10-fs-path.md) | `"utf8"` при read/write JSON |
| [11-lab-fs.md](11-lab-fs.md) | сохранение catalog без BOM |
| [13-streams.md](13-streams.md) | chunks как Buffer в потоках |

---

## Типичные ошибки

- **`readFile` без кодировки** + `JSON.parse(buf)` — parse ожидает string; неявное приведение ломается.
- **Редактор сохранил UTF-16** — SyntaxError при JSON.parse.
- **BOM в начале JSON** — strip или настройка редактора.
- **Смешение cp1251 и utf8** — mojibake в названиях товаров.
- **Путаница `length`** — байты Buffer vs символы строки для Unicode.

---

## Резюме

- `readFile` без второго аргумента → **Buffer**; для текста указывайте **`"utf8"`**.
- Курс и FastAPI — **UTF-8**; избегайте UTF-16 и BOM в JSON.
- На Windows проверяйте кодировку в редакторе и пайплайне экспорта CSV.
- В streams и HTTP chunks приходят как **Buffer** — декодируйте явно.

## Чек-лист

- Когда `readFile` возвращает Buffer, а когда string?
- Сколько байт занимает символ «€» в UTF-8?
- Что такое BOM и почему он ломает JSON.parse?
- Зачем `buffer.toString("utf8")` с явной кодировкой?
- Чем `Buffer.concat(chunks)` полезен при чтении HTTP body?
- Какой charset указывать в `Content-Type` для JSON API?

Следующий урок: [13. Streams: Readable, Writable, pipeline](13-streams.md).
