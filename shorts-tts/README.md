# shorts-tts (Python)

Python TTS-шаг для пайплайна шортсов (совместим с Python 3.14).
Использует `edge-tts` и генерирует аудио напрямую из текста.

## 1) Установка

```powershell
cd C:\Users\arbuz\mock-exams\shorts-tts
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

## 2) Быстрый запуск

Из файла:

```powershell
python .\generate_tts.py --input-file ..\scripts\short-001.txt --output ..\output\audio\short-001.mp3
```

Из строки:

```powershell
python .\generate_tts.py --text "Kubernetes manages containers at scale." --output ..\output\audio\demo.mp3
```

## 3) Голоса

Показать список доступных моделей:

```powershell
python .\generate_tts.py --list-voices --output .\dummy.mp3
```

Выбрать голос явно:

```powershell
python .\generate_tts.py --input-file ..\scripts\short-001.txt --output ..\output\audio\short-001.mp3 --voice "en-US-GuyNeural"
```

Скорость и громкость:

```powershell
python .\generate_tts.py --input-file ..\scripts\short-001.txt --output ..\output\audio\short-001.mp3 --voice "en-US-AriaNeural" --rate "+10%" --volume "+0%"
```

## 4) Как встроить в твой пайплайн

Рекомендуемая схема:

1. Храни тексты в `scripts/*.txt`.
2. Генерируй MP3 в `output/audio/*.mp3`.
3. Подключай MP3 в Remotion-композиции.
4. После рендера видео публикуй Shorts.

Пример командного шага перед рендером:

```powershell
python .\shorts-tts\generate_tts.py --input-file .\scripts\short-001.txt --output .\output\audio\short-001.mp3
```

## 5) Важно

- Текущий дефолт-голос: `en-US-GuyNeural`.
- Для прод-пайплайна закрепляй один `--voice`, чтобы звук был стабильным между роликами.
- Если нужен WAV, можно добавить шаг конвертации через ffmpeg.
