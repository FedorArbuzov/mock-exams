# Kubernetes Shorts Pipeline Prompt

Use this document as the **operating guide for every new episode** under `videos/`. Future agents: read this fully before producing the next Kubernetes short.

Source curriculum: `kubernetes-shorts-ideas.md` (and `kubernetes-shorts-ideas.ru.md` for the Russian outline). English scripts/renders are the publishing standard.

**Progress (as of Jul 2026):** Remotion episodes **001–003** are in the shared project with `kubernetes-reel.mp4`. Many `videos/<N>/script.txt` files exist for later lessons — continue from **4** (or the first folder without a reel / Remotion slug).

Same production lessons as Go shorts (TopicBanner, ~70s scripts, large fonts, safe parallel renders, `moov` verify) apply here. Go guide: `golang-shorts-pipeline-prompt.md`.

---

## Goal

For each lesson folder, produce:

1. `script.txt` — English narration (~65–75 seconds)
2. `remotion-prompt.md` — scene-by-scene Remotion brief
3. `image-prompts.md` — optional hero image prompts (not required for render)
4. `audio/short-NNN.mp3` — TTS voice-over
5. an episode folder under the **shared** `remotion/` project: `remotion/src/series/kubernetes/episodes/<slug>/`
6. `kubernetes-reel.mp4` — final 1080×1920 render, copied back to the episode root

There is **one** Remotion project for the whole channel (Kubernetes + Go + any future series), at `remotion/` (repo root) — not one per episode. Do not copy `remotion/` into a new episode folder. See `remotion/README.md`.

Reference implementations:

- Shared chrome: `remotion/src/shared/` (`Background`, `Caption`, `CTAScene`, `BrandFooter`, `TopicBanner`, `Panel`, `Arrow`, `Checkmark`, timings)
- K8s pattern: `remotion/src/series/kubernetes/episodes/003-node-vs-cluster/`
- Go pattern with TopicBanner (newer): `remotion/src/series/golang/episodes/047-pointers-without-fear/` — **new K8s episodes must also use TopicBanner**

---

## Folder naming

```text
videos/<N> <English Title>/
```

Examples:

- `1 What is Kubernetes in 30 seconds`
- `3 Node vs Cluster`
- `60 ErrImagePull and ImagePullBackOff`

Use English only for folder names.

**Use a plain hyphen `-`, never an em dash `—`.** Mixing the two has produced duplicate lesson folders. If a folder for this lesson number already exists, reuse it.

Slug: zero-padded 3 digits + kebab-case:

`videos/3 Node vs Cluster` → `remotion/src/series/kubernetes/episodes/003-node-vs-cluster/`

Composition id: `kubernetes-<slug>` (e.g. `kubernetes-003-node-vs-cluster`).

---

## Episode file layout

```text
videos/<N> Title/
  script.txt
  remotion-prompt.md
  image-prompts.md          # optional
  audio/
    short-0NN.mp3
  kubernetes-reel.mp4

remotion/
  public/audio/kubernetes/<slug>.mp3
  src/series/kubernetes/
    icons/*.tsx
    episodes/<slug>/
      content.ts            # TOPIC_TITLE, SCENE_SCRIPTS, AUDIO_*, HIGHLIGHT_WORDS
      Reel.tsx
      scenes/*.tsx
    episodes/index.ts       # register every episode here
```

---

## Step 1 — Script (`script.txt`)

Target length: **~65–75 seconds TTS** (~160–200 words). Do **not** ship thin ~30–40s dictionary scripts.

Structure (blank line between paragraphs):

1. Hook / beginner question
2. Clear explanation with concrete Kubernetes facts
3. Practical angle: what to check, what breaks, what beginners get wrong
4. Optional second practical beat (commands, STATUS, failure modes)
5. One memorable rule / mental model line
6. Exact CTA:

```text
Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
```

(Use ASCII hyphen `-` in the CTA dash for TTS consistency.)

### Script quality rules

- Real texture, not dictionary definitions
- Prefer failure modes (`CrashLoopBackOff`, `ImagePullBackOff`, empty Endpoints, Pending scheduling, etc.)
- Prefer concrete `kubectl` / YAML cues over abstract theory
- One memorable closing rule the viewer can repeat

### TTS-safe phrasing

Edge TTS misreads symbols and dense YAML. Speak them out:

| Avoid in speech | Prefer |
|-----------------|--------|
| dense YAML walls | "kind Deployment, metadata name …" |
| `kubectl get pods -A` as symbols | "kubectl get pods dash A" or "across all namespaces" |
| `==` / `!=` style ops | "equals" / "not equal" |
| fancy em dashes | ASCII `-` |

Keep `script.txt` UTF-8, clean ASCII dashes.

---

## Step 2 — Remotion prompt (`remotion-prompt.md`)

Required style block (copy every time):

```text
Style:
- Modern motion graphics.
- Dark background (#0B1020) with blue and cyan accents.
- Clean, minimal UI inspired by Kubernetes dashboards, kubectl output, and cluster diagrams.
- Smooth animations with subtle glow.
- Premium SaaS aesthetic (same series family as Go shorts).
- No stock footage or real people.
- Use simple vector icons and isometric illustrations (nodes, pods, services, control plane).
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
  - Headline: `Master Kubernetes Faster`
  - Subtitle: `Theory • Hands-on Labs • Interview Questions`
  - Footer: `Link in Bio`
  - Domain: `exallenge.tech`
  - EXALLENGE logo fade-in
  - No QR code
- **No text duplication:** captions already show full narration. On-screen labels = 1–4 words or short phone-readable command/YAML — never a second headline paraphrasing the narrator
- YAML/command inserts: **large type**, 1 short command or ≤6 YAML lines, never a dense manifest wall
- Export: 1080×1920 @ 30 FPS

---

## Step 3 — Audio (TTS)

```powershell
cd C:\Users\arbuz\mock-exams\shorts-tts
.\.venv\Scripts\python.exe .\generate_tts.py `
  --input-file "..\videos\<N> Title\script.txt" `
  --output "..\videos\<N> Title\audio\short-0NN.mp3" `
  --voice "en-US-GuyNeural"

Copy-Item -Force `
  "..\videos\<N> Title\audio\short-0NN.mp3" `
  "..\remotion\public\audio\kubernetes\<slug>.mp3"
```

Voice standard: `en-US-GuyNeural`.

After TTS, set `AUDIO_DURATION_SECONDS` in `content.ts` to the real duration. `calculateMetadata` overrides at render time, but the fallback should be accurate.

---

## Step 4 — Remotion episode (shared project)

Do **not** create a second `remotion/` under `videos/`.

### `content.ts` must export

```ts
export const TOPIC_TITLE = "Node vs Cluster"; // short punchy title for TopicBanner
export const AUDIO_SRC = "audio/kubernetes/<slug>.mp3";
export const AUDIO_DURATION_SECONDS = 70.0; // real TTS duration
export const HIGHLIGHT_WORDS = ["node", "cluster", "control plane", ...] as const;
export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "..." },
  // ... one paragraph per scene, matching script.txt blanks
  { id: "cta", text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio." },
];
```

- `SCENE_SCRIPTS` texts must match `script.txt` paragraphs 1:1
- `HIGHLIGHT_WORDS`: topic keywords only — CTA/brand words are added automatically

### Scene 1 — TopicBanner (required for new episodes)

Every new `Scene1Question` must show the topic **large at the top**:

```tsx
import {TopicBanner} from "../../../../../shared/components/TopicBanner";
import {TOPIC_TITLE} from "../content";

<TopicBanner title={TOPIC_TITLE} durationInFrames={durationInFrames} />
```

Component: `remotion/src/shared/components/TopicBanner.tsx`.

Titles: short and punchy — `"Node vs Cluster"`, `"CrashLoopBackOff"`, `"Service Endpoints"`.

(Older episodes 001–003 may lack TopicBanner; **do not skip it on new work**. Optionally backfill when re-rendering.)

### Phone-readable typography (hard rule)

| Element | Target fontSize |
|---------|-----------------|
| Mono command / YAML lines | **38–50** |
| Short labels (1–4 words) | **34–42** |
| Hook mark on scene 1 | **~54** |
| Captions (`Caption.tsx`) | **46** (shared) |

Prefer fewer, bigger lines. Widen panel / increase line spacing if large mono overflows.

### Shared building blocks — reuse, do not duplicate

- Chrome: `Background`, `Caption`, `CTAScene`, `BrandFooter`, `TopicBanner`, `Panel`, `Arrow`, `Checkmark`
- Icons: `remotion/src/series/kubernetes/icons/` — add only if missing
- Timing: `buildSceneTimings` in `shared/timings.ts`

### Register in `episodes/index.ts`

Add import + entry: `id: "kubernetes-<slug>"`, `component`, `audioSrc`, `audioDurationInSeconds`.

### Render

```powershell
cd C:\Users\arbuz\mock-exams\remotion
npm run render -- kubernetes-<slug> out/kubernetes-<slug>.mp4
```

For a stuck/hung render, re-run **alone** with lower concurrency:

```powershell
npm run render -- kubernetes-<slug> out/kubernetes-<slug>.mp4 --concurrency=2
```

---

## Step 5 — Final video (copy safely)

**Never copy mid-write.** Wait until Remotion prints the final line and `exit_code: 0`.

```powershell
Copy-Item -Force "remotion\out\kubernetes-<slug>.mp4" "videos\<N> Title\kubernetes-reel.mp4"
```

Then verify:

1. Destination size **equals** source size
2. File contains a `moov` atom (truncated copies without `moov` are unplayable)

Deliverable for publishing: episode-root `kubernetes-reel.mp4`.

---

## Batch / parallel render rules

- **Do not** launch 8 full Remotion renders at once — bundling can hang at `Bundling 100%`.
- Prefer batches of **3–4** parallel renders, or `--concurrency=2` when batching more.
- If one hangs: kill that process, re-render that episode alone.
- TTS for many episodes can run sequentially in one loop (fine). Remotion is the bottleneck.

---

## Brand / CTA checklist

- [ ] Scene 1: large `TopicBanner` with `TOPIC_TITLE` (required on new episodes)
- [ ] Persistent footer: `exallenge.tech` on every scene
- [ ] Final CTA: headline + subtitle + Link in Bio + `exallenge.tech` + EXALLENGE mark
- [ ] No QR code
- [ ] Dark/cyan SaaS look (same family as Go shorts)
- [ ] Commands/YAML large enough for phone
- [ ] Captions not duplicated as on-screen headlines
- [ ] Audio ~65–75s, script has a memorable closing rule
- [ ] `kubernetes-reel.mp4` size matches `out/` and has `moov`

---

## Curriculum alignment

1. Follow module order in `kubernetes-shorts-ideas.md`
2. Use lesson **Hook** + **Core** as script seed
3. Keep shared CTA verbatim (English publishing CTA above — not the placeholder `your-site.com` line in older outline drafts)
4. Diagnostic lessons (STATUS, ImagePull, CrashLoop, empty Endpoints): show one minimal repro + fix on screen

---

## Agent instruction (copy/paste)

When asked to produce the next Kubernetes chapter(s), do this in order:

1. Read this file + the matching lesson(s) in `kubernetes-shorts-ideas.md`
2. Write/expand `script.txt` to ~65–75s with TTS-safe phrasing + memorable rule + exact CTA
3. Write `remotion-prompt.md` (+ optional `image-prompts.md`)
4. Generate TTS → copy to `remotion/public/audio/kubernetes/<slug>.mp3` → set real `AUDIO_DURATION_SECONDS`
5. Create `content.ts` (with `TOPIC_TITLE`) + `scenes/*.tsx` (Scene1 uses `TopicBanner`) + `Reel.tsx`; register in `episodes/index.ts`
6. Use large fonts (command/YAML 38–50); reuse shared chrome and k8s icons
7. Render (batch ≤3–4 parallel, or `--concurrency=2` if more)
8. After successful exit: copy mp4, verify size + `moov`
9. Report paths for audio, Remotion folder, and final video

**Do not:** invent a different CTA; skip `exallenge.tech` footer; skip TopicBanner on new episodes; create a second `remotion/` under `videos/`; ship thin ~40s scripts; use tiny unreadably small YAML; copy mp4 before render finishes.
