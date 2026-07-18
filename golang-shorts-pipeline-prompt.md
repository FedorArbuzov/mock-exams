# Golang Shorts Pipeline Prompt

Use this document as the **operating guide for every new episode** under `videos-go/`. Future agents: read this fully before producing the next Go short.

Source curriculum: `golang-shorts-ideas.md` (220 lessons, modules 0–14).

**Progress (as of Jul 2026):** episodes **1–54** are rendered. Next in queue starts at **55**.

---

## Goal

For each lesson folder, produce:

1. `script.txt` — English narration (~65–75 seconds)
2. `remotion-prompt.md` — scene-by-scene Remotion brief
3. `image-prompts.md` — optional hero image prompts (not required for render)
4. `audio/short-NNN.mp3` — TTS voice-over
5. an episode folder under the **shared** `remotion/` project: `remotion/src/series/golang/episodes/<slug>/`
6. `golang-reel.mp4` — final 1080×1920 render, copied back to the episode root

There is **one** Remotion project for the whole channel (Kubernetes + Go + any future series), at `remotion/` (repo root) — not one per episode, not one per series. Do not copy `remotion/` into a new episode folder. See `remotion/README.md` for the project layout.

Reference implementations:

- Shared chrome: `remotion/src/shared/` (`Background`, `Caption`, `CTAScene`, `BrandFooter`, `TopicBanner`, `Panel`, `Arrow`, `Checkmark`, timings)
- Recent Go episode pattern: `remotion/src/series/golang/episodes/047-pointers-without-fear/` (TopicBanner + large fonts)
- Expanded script style: `videos-go/47 Pointers without fear/script.txt`

---

## Folder naming

```text
videos-go/<N> <English Title>/
```

Examples:

- `47 Pointers without fear`
- `52 Shadowing bugs with =`

Use English only for folder names. Match the lesson number from `golang-shorts-ideas.md`.

**Use a plain hyphen `-`, never an em dash `—`.** Mixing the two has already produced duplicate lesson folders (e.g. two `119 ...` and two `130 ...` folders). If a folder for this lesson number already exists, reuse it; do not create a second one with a different dash.

Slug inside Remotion: zero-padded 3 digits + kebab-case:

`videos-go/47 Pointers without fear` → `remotion/src/series/golang/episodes/047-pointers-without-fear/`

Composition id: `golang-<slug>` (e.g. `golang-047-pointers-without-fear`).

---

## Episode file layout

```text
videos-go/<N> Title/
  script.txt
  remotion-prompt.md
  image-prompts.md          # optional
  audio/
    short-0NN.mp3
  golang-reel.mp4

remotion/
  public/audio/golang/<slug>.mp3
  src/series/golang/
    icons/*.tsx
    episodes/<slug>/
      content.ts            # TOPIC_TITLE, SCENE_SCRIPTS, AUDIO_*, HIGHLIGHT_WORDS
      Reel.tsx
      scenes/*.tsx
    episodes/index.ts       # register every episode here
```

---

## Step 1 — Script (`script.txt`)

Target length: **~65–75 seconds TTS** (~160–200 words). Do **not** ship thin ~40s scripts — viewers found them too short / shallow.

Structure (blank line between paragraphs):

1. Hook / beginner question
2. Clear explanation with concrete Go facts
3. Practical angle: what breaks, what beginners get wrong
4. Optional second practical beat
5. One memorable rule / checklist line
6. Exact CTA:

```text
Master Go faster. Theory, hands-on labs, and interview questions - link in bio.
```

(Use ASCII hyphen `-` in the CTA dash for TTS consistency; avoid fancy em dashes that corrupt in some editors.)

### Script quality rules

- Real texture, not dictionary definitions
- Prefer failure modes (`nil` map write, shadowed `err`, ignored error, etc.)
- Prefer stdlib examples over framework magic unless the lesson is about HTTP/tooling
- One memorable closing rule the viewer can repeat

### TTS-safe phrasing

Edge TTS misreads symbols. Speak them out:

| Avoid in speech | Prefer |
|-----------------|--------|
| `:=` | "short declaration" or "colon-equals" once, then "short declaration" |
| `&` / `*` | "address-of" / "star" |
| `s[0] = 'A'` | "change index zero" / "assign to the first byte" |
| dense punctuation / backticks walls | spoken descriptions |
| Cyrillic letters alone | "the Cyrillic letter ye" |

Keep `script.txt` UTF-8, clean ASCII dashes.

---

## Step 2 — Remotion prompt (`remotion-prompt.md`)

Required style block (copy every time):

```text
Style:
- Modern motion graphics.
- Dark background (#0B1020) with blue and cyan accents.
- Clean, minimal UI inspired by terminals, Go toolchain output, and IDE panels.
- Smooth animations with subtle glow.
- Premium SaaS aesthetic (same series family as Kubernetes shorts).
- No stock footage or real people.
- Use simple vector icons and isometric illustrations (packages, goroutines, structs, channels).
- Every animation should synchronize with the narration.
- Add animated captions with highlighted keywords.
- Duration should match the voice-over automatically.
- Persistent brand footer: keep `exallenge.tech` visible for the entire video — small, quiet type under the captions / lower safe area on every scene. No QR code.
- Scene 1 MUST show a large TopicBanner with the episode topic title so the viewer instantly knows what the reel is about.
```

Scene rules:

- Split narration into 5–7 scenes (usually: hook + 4 body + CTA)
- Each scene: Narration + Animation bullets
- Final scene is always the CTA card
- CTA must include:
  - Headline: `Master Go Faster`
  - Subtitle: `Theory • Hands-on Labs • Interview Questions`
  - Footer: `Link in Bio`
  - Domain: `exallenge.tech`
  - EXALLENGE logo fade-in
  - No QR code
- **No text duplication:** captions already show full narration. On-screen labels = 1–4 words or short phone-readable code — never a second headline paraphrasing the narrator
- Code inserts: **large type**, 1 short command or ≤6 Go lines, never a dense file wall
- Export: 1080×1920 @ 30 FPS

---

## Step 3 — Audio (TTS)

```powershell
cd C:\Users\arbuz\mock-exams\shorts-tts
.\.venv\Scripts\python.exe .\generate_tts.py `
  --input-file "..\videos-go\<N> Title\script.txt" `
  --output "..\videos-go\<N> Title\audio\short-0NN.mp3" `
  --voice "en-US-GuyNeural"

Copy-Item -Force `
  "..\videos-go\<N> Title\audio\short-0NN.mp3" `
  "..\remotion\public\audio\golang\<slug>.mp3"
```

Voice standard: `en-US-GuyNeural`.

After TTS, set `AUDIO_DURATION_SECONDS` in `content.ts` to the real duration (from mutagen/ffprobe). `calculateMetadata` overrides at render time, but the fallback should be accurate.

---

## Step 4 — Remotion episode (shared project)

Do **not** create a second `remotion/` under `videos-go/`.

### `content.ts` must export

```ts
export const TOPIC_TITLE = "Pointers"; // short punchy title for TopicBanner
export const AUDIO_SRC = "audio/golang/<slug>.mp3";
export const AUDIO_DURATION_SECONDS = 70.0; // real TTS duration
export const HIGHLIGHT_WORDS = ["pointer", "nil", ...] as const;
export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "..." },
  // ... one paragraph per scene, matching script.txt blanks
  { id: "cta", text: "Master Go faster. Theory, hands-on labs, and interview questions - link in bio." },
];
```

- `SCENE_SCRIPTS` texts must match `script.txt` paragraphs 1:1 (same scene count as `Reel.tsx` `SCENE_MAP`)
- `HIGHLIGHT_WORDS`: topic keywords only — CTA/brand words are added automatically by `shared/HighlightWords.tsx`

### Scene 1 — TopicBanner (required)

Every `Scene1Question` must show the topic **large at the top** before the panel visual:

```tsx
import {TopicBanner} from "../../../../../shared/components/TopicBanner";
import {TOPIC_TITLE} from "../content";

// inside AbsoluteFill, first child:
<TopicBanner title={TOPIC_TITLE} durationInFrames={durationInFrames} />
```

Component: `remotion/src/shared/components/TopicBanner.tsx`.

Titles should be short and punchy: `"Pointers"`, `"Defined Types"`, `"Variable Shadowing"`, `"Types Checklist"`.

### Phone-readable typography (hard rule)

Viewers complained small code was unreadable. Minimums for on-screen text in Go episodes:

| Element | Target fontSize |
|---------|-----------------|
| Mono code chips / lines | **38–50** |
| Short labels (1–4 words) | **34–42** |
| Hook mark on scene 1 | **~54** |
| Captions (`Caption.tsx`) | **46** (shared; already bumped) |

Prefer fewer, bigger lines over dense walls. Widen panel / increase line spacing if large mono overflows.

### Shared building blocks — reuse, do not duplicate

- Chrome: `Background`, `Caption`, `CTAScene`, `BrandFooter`, `TopicBanner`, `Panel`, `Arrow`, `Checkmark`
- Timing: `buildSceneTimings` in `shared/timings.ts`
- Icons: `remotion/src/series/golang/icons/` — add only if missing

### Register in `episodes/index.ts`

Add import + entry: `id: "golang-<slug>"`, `component`, `audioSrc`, `audioDurationInSeconds`.

### Render

```powershell
cd C:\Users\arbuz\mock-exams\remotion
npm run render -- golang-<slug> out/golang-<slug>.mp4
```

For a stuck/hung render, re-run **alone** with lower concurrency:

```powershell
npm run render -- golang-<slug> out/golang-<slug>.mp4 --concurrency=2
```

---

## Step 5 — Final video (copy safely)

**Never copy mid-write.** Wait until Remotion prints the final line and `exit_code: 0`.

```powershell
Copy-Item -Force "remotion\out\golang-<slug>.mp4" "videos-go\<N> Title\golang-reel.mp4"
```

Then verify:

1. Destination size **equals** source size
2. File contains a `moov` atom (truncated copies without `moov` are unplayable — this already bit us once)

Deliverable for publishing: episode-root `golang-reel.mp4`.

---

## Batch / parallel render rules

Learned the hard way:

- **Do not** launch 8 full Remotion renders at once on one machine — bundling can hang forever at `Bundling 100%` (episode 048 hung this way).
- Prefer batches of **3–4** parallel renders, or lower `--concurrency=2` when batching more.
- If one hangs: kill that shell/node process, re-render that episode alone.
- TTS for many episodes can run sequentially in one loop (fine). Remotion is the bottleneck.

---

## Brand / CTA checklist

- [ ] Scene 1: large `TopicBanner` with `TOPIC_TITLE`
- [ ] Persistent footer: `exallenge.tech` on every scene
- [ ] Final CTA: headline + subtitle + Link in Bio + `exallenge.tech` + EXALLENGE mark
- [ ] No QR code
- [ ] Dark/cyan SaaS look
- [ ] Code/labels large enough for phone
- [ ] Captions not duplicated as on-screen headlines
- [ ] Audio ~65–75s, script has a memorable closing rule
- [ ] `golang-reel.mp4` size matches `out/` and has `moov`

---

## Curriculum alignment

1. Follow module order in `golang-shorts-ideas.md` (module 0 → 14)
2. Use lesson **Hook** + **Core** as script seed
3. Keep shared CTA verbatim
4. Diagnostic lessons: one minimal repro + fix on screen

---

## Agent instruction (copy/paste)

When asked to produce the next Go chapter(s), do this in order:

1. Read this file + the matching lesson(s) in `golang-shorts-ideas.md`
2. Write/expand `script.txt` to ~65–75s with TTS-safe phrasing + memorable rule + exact CTA
3. Write `remotion-prompt.md` (+ optional `image-prompts.md`)
4. Generate TTS → copy to `remotion/public/audio/golang/<slug>.mp3` → set real `AUDIO_DURATION_SECONDS`
5. Create `content.ts` (with `TOPIC_TITLE`) + `scenes/*.tsx` (Scene1 uses `TopicBanner`) + `Reel.tsx`; register in `episodes/index.ts`
6. Use large fonts (code 38–50); reuse shared chrome
7. Render (batch ≤3–4 parallel, or `--concurrency=2` if more)
8. After successful exit: copy mp4, verify size + `moov`
9. Report paths for audio, Remotion folder, and final video

**Do not:** invent a different CTA; skip `exallenge.tech` footer; skip TopicBanner; create a second `remotion/` under `videos-go/`; ship ~40s thin scripts; use tiny unreadably small code; copy mp4 before render finishes.
