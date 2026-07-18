# Shared Remotion project (exallenge.tech Shorts)

One Remotion v4 project for every episode, across every series (Kubernetes, Go, ...). Install `node_modules` once here — do **not** copy this project into an episode folder under `videos/` or `videos-go/`.

## Structure

```
src/
  index.ts                        registerRoot
  Root.tsx                        registers one <Composition> per episode (from the registries below)
  shared/                         generic engine + chrome, reused by every series
    constants.ts                  FPS/WIDTH/HEIGHT/COLORS/FONTS/SPACING/ANIM/BASE_HIGHLIGHT_WORDS
    types.ts                      SceneScript/SceneTiming/ReelProps/EpisodeConfig
    timings.ts                    buildSceneTimings/getTotalFramesFromAudio/buildCaptionCues
    HighlightWords.tsx            HighlightWordsProvider/useHighlightWords (episode keywords + base CTA words)
    components/                   Background, Caption, CTA, BrandFooter, Arrow, Checkmark
    utils/animations.ts
  series/
    kubernetes/
      icons/                      Cluster, Container, KubernetesLogo, LoadBalancer, Pod, TrafficGraph, YamlEditor
      episodes/
        <NNN-slug>/
          content.ts               SCENE_SCRIPTS, AUDIO_SRC, AUDIO_DURATION_SECONDS fallback, HIGHLIGHT_WORDS
          Reel.tsx                 SCENE_MAP + Sequence/Audio/Background/BrandFooter wiring
          scenes/*.tsx
        index.ts                  kubernetesEpisodes registry — add new episodes here
    golang/
      icons/                      empty until the first Go episode needs one
      episodes/index.ts           golangEpisodes registry — empty until the first Go episode ships
public/
  audio/<series>/<slug>.mp3
out/                              render output (gitignored)
```

## Adding a new episode

1. Write `content.ts` (scene scripts + audio path + episode-specific highlight keywords — CTA/branding words are added automatically).
2. Write `scenes/*.tsx` (one component per scene) and `Reel.tsx` (copy the pattern from an existing episode in the same series).
3. Copy the episode's TTS mp3 into `public/audio/<series>/<slug>.mp3`.
4. Add a new icon under `series/<series>/icons/` only if the topic needs a visual nobody has drawn yet — otherwise reuse what's there.
5. Register the episode in `series/<series>/episodes/index.ts`.

No other file needs to change — `Root.tsx` and the render command are generic across all episodes and series.

## Run

```powershell
cd C:\Users\arbuz\mock-exams\remotion
npm install
npm run dev
```

## Render

```powershell
npm run render -- <composition-id> out/<composition-id>.mp4
# e.g. npm run render -- kubernetes-001-what-is-kubernetes out/kubernetes-001.mp4
```

List available composition ids:

```powershell
npm run list
```

Then copy the output back to the episode's root folder (`videos/<N> Title/kubernetes-reel.mp4` or `videos-go/<N> Title/golang-reel.mp4`).

## Timing model

Scene durations are proportional to narration text length (`shared/timings.ts: buildSceneTimings`). Total frames come from the actual audio duration via `calculateMetadata` + `@remotion/media-utils` — never hardcode frame ranges in an episode.
