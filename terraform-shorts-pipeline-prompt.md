# Terraform Shorts Pipeline Prompt

Use this document as the **operating guide for every new episode** under `videos-terraform/`. Future agents: read this fully before producing the next Terraform short.

Source curriculum: `terraform-shorts-ideas.md`.

**Progress (as of Jul 2026):** Remotion episodes **001–112** (full curriculum) have scripts + TTS + Remotion code. Episodes **001–006** use custom scenes; **007–112** use shared `templates/createTerraformReel`. Render locally with your own script — agents should not batch-render unless asked.

Same production lessons as Go/Kubernetes shorts (TopicBanner, ~70s scripts, large fonts, safe parallel renders, `moov` verify) apply here. Twin guides: `golang-shorts-pipeline-prompt.md`, `kubernetes-shorts-pipeline-prompt.md`.

---

## Goal

For each lesson folder, produce:

1. `script.txt` — English narration (~65–75 seconds)
2. `remotion-prompt.md` — scene-by-scene Remotion brief
3. `image-prompts.md` — optional hero image prompts (not required for render)
4. `audio/short-NNN.mp3` — TTS voice-over
5. an episode folder under the **shared** `remotion/` project: `remotion/src/series/terraform/episodes/<slug>/`
6. `terraform-reel.mp4` — final 1080×1920 render, copied back to the episode root

There is **one** Remotion project for the whole channel at `remotion/` — not one per episode. Do not copy `remotion/` into a lesson folder. See `remotion/README.md`.

Reference implementations:

- Shared chrome: `remotion/src/shared/` (`Background`, `Caption`, `CTAScene`, `BrandFooter`, `TopicBanner`, `Panel`, timings)
- Terraform pattern: `remotion/src/series/terraform/episodes/001-what-is-terraform-in-30-seconds/`
- Go TopicBanner pattern: `remotion/src/series/golang/episodes/047-pointers-without-fear/`

---

## Folder naming

```text
videos-terraform/<N> <English Title>/
```

Examples:

- `1 What is Terraform in 30 seconds`
- `8 State file - the map of reality`

Use English only. **Plain hyphen `-`, never em dash `—`.** Reuse an existing lesson folder if the number already exists.

Slug: zero-padded 3 digits + kebab-case:

`videos-terraform/1 What is Terraform in 30 seconds` → `remotion/src/series/terraform/episodes/001-what-is-terraform-in-30-seconds/`

Composition id: `terraform-<slug>` (e.g. `terraform-001-what-is-terraform-in-30-seconds`).

---

## Episode file layout

```text
videos-terraform/<N> Title/
  script.txt
  remotion-prompt.md
  image-prompts.md          # optional
  audio/
    short-0NN.mp3
  terraform-reel.mp4

remotion/
  public/audio/terraform/<slug>.mp3
  src/series/terraform/
    icons/*.tsx
    episodes/<slug>/
      content.ts
      Reel.tsx
      scenes/*.tsx
    episodes/index.ts
```

---

## Step 1 — Script (`script.txt`)

Target length: **~65–75 seconds TTS** (~160–200 words). Do **not** ship thin ~30–40s dictionary scripts.

Structure (blank line between paragraphs):

1. Hook / beginner question
2. Clear explanation with concrete Terraform facts
3. Practical angle: what to run, what breaks, what beginners get wrong
4. Optional second practical beat (plan output, state, provider)
5. One memorable rule / mental model line
6. Exact CTA:

```text
Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio.
```

(Use ASCII hyphen `-` in the CTA dash for TTS consistency.)

### Script quality rules

- Real texture, not dictionary definitions
- Prefer failure modes (state lock, drift, already exists, destroy surprises, secrets in state)
- Prefer concrete HCL / CLI cues (`terraform plan`, `resource "aws_s3_bucket"`, remote backend) over abstract theory
- One memorable closing rule the viewer can repeat

### TTS-safe phrasing

Edge TTS misreads symbols and dense HCL. Speak them out:

| Avoid in speech | Prefer |
|-----------------|--------|
| dense HCL walls | "resource aws_s3_bucket named course" |
| `terraform.tfstate` as a blob | "terraform dot tfstate" or "the state file" |
| `~>` | "pessimistic constraint" or "compatible with five" |
| `-auto-approve` | "dash auto-approve" |
| fancy em dashes | ASCII `-` |

Keep `script.txt` UTF-8, clean ASCII dashes.

---

## Step 2 — Remotion brief (`remotion-prompt.md`)

Scene-by-scene animation brief. Scene 1 must include TopicBanner. No caption duplication as big headlines. Labels 1–4 words. Persistent `exallenge.tech` footer. CTA scene uses shared `CTAScene` with headline `Master Terraform faster`.

---

## Step 3 — TTS

```powershell
cd C:\Users\arbuz\mock-exams
python .\shorts-tts\generate_tts.py `
  --input-file ".\videos-terraform\<N> Title\script.txt" `
  --output ".\videos-terraform\<N> Title\audio\short-0NN.mp3" `
  --voice "en-US-GuyNeural"
```

Copy into Remotion public:

```powershell
Copy-Item ".\videos-terraform\<N> Title\audio\short-0NN.mp3" `
  ".\remotion\public\audio\terraform\<slug>.mp3" -Force
```

Set `AUDIO_DURATION_SECONDS` in `content.ts` from the real file length (fallback only; `calculateMetadata` overrides).

---

## Step 4 — Remotion episode

1. Create `remotion/src/series/terraform/episodes/<slug>/` with `content.ts`, `Reel.tsx`, `scenes/*.tsx`.
2. Scene 1: `TopicBanner` + `TOPIC_TITLE` from `content.ts`.
3. CTA: `<CTAScene {...props} headline="Master Terraform faster" />`.
4. Register in `remotion/src/series/terraform/episodes/index.ts` (Root already merges terraformEpisodes).
5. Phone-readable type: mono **38–50**, labels **34–42**.

---

## Step 5 — Render

```powershell
cd C:\Users\arbuz\mock-exams\remotion
npm run render -- terraform-<slug> out/terraform-<slug>.mp4
```

Parallel renders **≤3–4** (or `--concurrency=2`).

Copy only after exit 0; verify dest size == source and file has `moov` atom:

```powershell
Copy-Item ".\out\terraform-<slug>.mp4" `
  "..\videos-terraform\<N> Title\terraform-reel.mp4" -Force
```

---

## Non-negotiables

1. One shared Remotion project at `remotion/`.
2. Script ~65–75s with memorable rule + exact CTA.
3. Scene 1 TopicBanner required.
4. TTS `en-US-GuyNeural`; speak symbols clearly.
5. Register every episode in `series/terraform/episodes/index.ts`.
6. Folder names: plain hyphen `-`.
7. Brand footer `exallenge.tech`; no QR.

CTA (verbatim): `Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio.`
