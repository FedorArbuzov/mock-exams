import type {EpisodeConfig} from "../../../shared/types";
import * as ep001 from "./001-what-is-go-in-30-seconds/content";
import {Reel as Ep001Reel} from "./001-what-is-go-in-30-seconds/Reel";
import * as ep002 from "./002-why-companies-hire-for-go/content";
import {Reel as Ep002Reel} from "./002-why-companies-hire-for-go/Reel";
import * as ep003 from "./003-go-vs-python-for-backends/content";
import {Reel as Ep003Reel} from "./003-go-vs-python-for-backends/Reel";
import * as ep004 from "./004-go-vs-java-csharp-mental-model/content";
import {Reel as Ep004Reel} from "./004-go-vs-java-csharp-mental-model/Reel";
import * as ep005 from "./005-compiled-binary-mindset/content";
import {Reel as Ep005Reel} from "./005-compiled-binary-mindset/Reel";
import * as ep006 from "./006-boring-technology-is-a-feature/content";
import {Reel as Ep006Reel} from "./006-boring-technology-is-a-feature/Reel";
import * as ep007 from "./007-when-go-is-a-great-fit/content";
import {Reel as Ep007Reel} from "./007-when-go-is-a-great-fit/Reel";
import * as ep008 from "./008-when-go-is-not-ideal/content";
import {Reel as Ep008Reel} from "./008-when-go-is-not-ideal/Reel";
import * as ep009 from "./009-go-proverb-clarity-over-cleverness/content";
import {Reel as Ep009Reel} from "./009-go-proverb-clarity-over-cleverness/Reel";
import * as ep010 from "./010-the-go-toolchain-is-part-of-the-language/content";
import {Reel as Ep010Reel} from "./010-the-go-toolchain-is-part-of-the-language/Reel";
import * as ep011 from "./011-myth-go-has-no-generics-so-its-useless/content";
import {Reel as Ep011Reel} from "./011-myth-go-has-no-generics-so-its-useless/Reel";
import * as ep012 from "./012-roadmap-what-junior-go-actually-means/content";
import {Reel as Ep012Reel} from "./012-roadmap-what-junior-go-actually-means/Reel";
import * as ep013 from "./013-install-go-the-clean-way/content";
import {Reel as Ep013Reel} from "./013-install-go-the-clean-way/Reel";
import * as ep014 from "./014-goroot-vs-gopath-today/content";
import {Reel as Ep014Reel} from "./014-goroot-vs-gopath-today/Reel";
import * as ep015 from "./015-your-editor-setup-for-go/content";
import {Reel as Ep015Reel} from "./015-your-editor-setup-for-go/Reel";
import * as ep016 from "./016-gopls-the-language-server/content";
import {Reel as Ep016Reel} from "./016-gopls-the-language-server/Reel";
import * as ep017 from "./017-first-file-main-package/content";
import {Reel as Ep017Reel} from "./017-first-file-main-package/Reel";
import * as ep018 from "./018-hello-world-and-why-fmt-matters/content";
import {Reel as Ep018Reel} from "./018-hello-world-and-why-fmt-matters/Reel";
import * as ep019 from "./019-go-run-vs-go-build/content";
import {Reel as Ep019Reel} from "./019-go-run-vs-go-build/Reel";
import * as ep020 from "./020-exit-codes-and-failing-fast/content";
import {Reel as Ep020Reel} from "./020-exit-codes-and-failing-fast/Reel";
import * as ep021 from "./021-comments-that-help-and-ones-that-dont/content";
import {Reel as Ep021Reel} from "./021-comments-that-help-and-ones-that-dont/Reel";
import * as ep022 from "./022-gofmt-go-fmt-non-negotiable-style/content";
import {Reel as Ep022Reel} from "./022-gofmt-go-fmt-non-negotiable-style/Reel";
import * as ep023 from "./023-go-vet-cheap-static-checks/content";
import {Reel as Ep023Reel} from "./023-go-vet-cheap-static-checks/Reel";
import * as ep024 from "./024-mini-checklist-first-go-hour/content";
import {Reel as Ep024Reel} from "./024-mini-checklist-first-go-hour/Reel";
import * as ep025 from "./025-packages-vs-modules/content";
import {Reel as Ep025Reel} from "./025-packages-vs-modules/Reel";
import * as ep026 from "./026-gomod-in-plain-words/content";
import {Reel as Ep026Reel} from "./026-gomod-in-plain-words/Reel";
import * as ep027 from "./027-go-get-go-mod-tidy/content";
import {Reel as Ep027Reel} from "./027-go-get-go-mod-tidy/Reel";
import * as ep028 from "./028-module-paths-and-import-paths/content";
import {Reel as Ep028Reel} from "./028-module-paths-and-import-paths/Reel";
import * as ep029 from "./029-internal-packages/content";
import {Reel as Ep029Reel} from "./029-internal-packages/Reel";
import * as ep030 from "./030-cmd-and-internal-layout/content";
import {Reel as Ep030Reel} from "./030-cmd-and-internal-layout/Reel";
import * as ep031 from "./031-one-package-per-folder-rule/content";
import {Reel as Ep031Reel} from "./031-one-package-per-folder-rule/Reel";
import * as ep032 from "./032-exported-vs-unexported-names/content";
import {Reel as Ep032Reel} from "./032-exported-vs-unexported-names/Reel";
import * as ep033 from "./033-doc-comments-on-exported-symbols/content";
import {Reel as Ep033Reel} from "./033-doc-comments-on-exported-symbols/Reel";
import * as ep034 from "./034-go-doc-locally/content";
import {Reel as Ep034Reel} from "./034-go-doc-locally/Reel";
import * as ep035 from "./035-replace-directives/content";
import {Reel as Ep035Reel} from "./035-replace-directives/Reel";
import * as ep036 from "./036-semantic-import-versioning/content";
import {Reel as Ep036Reel} from "./036-semantic-import-versioning/Reel";
import * as ep037 from "./037-vendoring-basics/content";
import {Reel as Ep037Reel} from "./037-vendoring-basics/Reel";
import * as ep038 from "./038-mini-checklist-healthy-go-module/content";
import {Reel as Ep038Reel} from "./038-mini-checklist-healthy-go-module/Reel";
import * as ep039 from "./039-short-declare-vs-var/content";
import {Reel as Ep039Reel} from "./039-short-declare-vs-var/Reel";
import * as ep040 from "./040-zero-values-everywhere/content";
import {Reel as Ep040Reel} from "./040-zero-values-everywhere/Reel";
import * as ep041 from "./041-basic-types/content";
import {Reel as Ep041Reel} from "./041-basic-types/Reel";
import * as ep042 from "./042-type-conversion-is-explicit/content";
import {Reel as Ep042Reel} from "./042-type-conversion-is-explicit/Reel";
import * as ep043 from "./043-constants-and-iota/content";
import {Reel as Ep043Reel} from "./043-constants-and-iota/Reel";
import * as ep044 from "./044-strings-are-immutable-byte-sequences/content";
import {Reel as Ep044Reel} from "./044-strings-are-immutable-byte-sequences/Reel";
import * as ep045 from "./045-runes-vs-bytes/content";
import {Reel as Ep045Reel} from "./045-runes-vs-bytes/Reel";
import * as ep046 from "./046-raw-string-literals/content";
import {Reel as Ep046Reel} from "./046-raw-string-literals/Reel";
import * as ep047 from "./047-pointers-without-fear/content";
import {Reel as Ep047Reel} from "./047-pointers-without-fear/Reel";
import * as ep048 from "./048-when-to-pass-pointer-vs-value/content";
import {Reel as Ep048Reel} from "./048-when-to-pass-pointer-vs-value/Reel";
import * as ep049 from "./049-new-vs-composite-literal/content";
import {Reel as Ep049Reel} from "./049-new-vs-composite-literal/Reel";
import * as ep050 from "./050-type-aliases-vs-defined-types/content";
import {Reel as Ep050Reel} from "./050-type-aliases-vs-defined-types/Reel";
import * as ep051 from "./051-named-results/content";
import {Reel as Ep051Reel} from "./051-named-results/Reel";
import * as ep052 from "./052-shadowing-bugs/content";
import {Reel as Ep052Reel} from "./052-shadowing-bugs/Reel";
import * as ep053 from "./053-any-alias-for-interface/content";
import {Reel as Ep053Reel} from "./053-any-alias-for-interface/Reel";
import * as ep054 from "./054-mini-checklist-types-without-pain/content";
import {Reel as Ep054Reel} from "./054-mini-checklist-types-without-pain/Reel";

export const golangEpisodes: EpisodeConfig[] = [
  {
    id: "golang-001-what-is-go-in-30-seconds",
    component: Ep001Reel,
    audioSrc: ep001.AUDIO_SRC,
    audioDurationInSeconds: ep001.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-002-why-companies-hire-for-go",
    component: Ep002Reel,
    audioSrc: ep002.AUDIO_SRC,
    audioDurationInSeconds: ep002.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-003-go-vs-python-for-backends",
    component: Ep003Reel,
    audioSrc: ep003.AUDIO_SRC,
    audioDurationInSeconds: ep003.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-004-go-vs-java-csharp-mental-model",
    component: Ep004Reel,
    audioSrc: ep004.AUDIO_SRC,
    audioDurationInSeconds: ep004.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-005-compiled-binary-mindset",
    component: Ep005Reel,
    audioSrc: ep005.AUDIO_SRC,
    audioDurationInSeconds: ep005.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-006-boring-technology-is-a-feature",
    component: Ep006Reel,
    audioSrc: ep006.AUDIO_SRC,
    audioDurationInSeconds: ep006.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-007-when-go-is-a-great-fit",
    component: Ep007Reel,
    audioSrc: ep007.AUDIO_SRC,
    audioDurationInSeconds: ep007.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-008-when-go-is-not-ideal",
    component: Ep008Reel,
    audioSrc: ep008.AUDIO_SRC,
    audioDurationInSeconds: ep008.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-009-go-proverb-clarity-over-cleverness",
    component: Ep009Reel,
    audioSrc: ep009.AUDIO_SRC,
    audioDurationInSeconds: ep009.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-010-the-go-toolchain-is-part-of-the-language",
    component: Ep010Reel,
    audioSrc: ep010.AUDIO_SRC,
    audioDurationInSeconds: ep010.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-011-myth-go-has-no-generics-so-its-useless",
    component: Ep011Reel,
    audioSrc: ep011.AUDIO_SRC,
    audioDurationInSeconds: ep011.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-012-roadmap-what-junior-go-actually-means",
    component: Ep012Reel,
    audioSrc: ep012.AUDIO_SRC,
    audioDurationInSeconds: ep012.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-013-install-go-the-clean-way",
    component: Ep013Reel,
    audioSrc: ep013.AUDIO_SRC,
    audioDurationInSeconds: ep013.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-014-goroot-vs-gopath-today",
    component: Ep014Reel,
    audioSrc: ep014.AUDIO_SRC,
    audioDurationInSeconds: ep014.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-015-your-editor-setup-for-go",
    component: Ep015Reel,
    audioSrc: ep015.AUDIO_SRC,
    audioDurationInSeconds: ep015.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-016-gopls-the-language-server",
    component: Ep016Reel,
    audioSrc: ep016.AUDIO_SRC,
    audioDurationInSeconds: ep016.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-017-first-file-main-package",
    component: Ep017Reel,
    audioSrc: ep017.AUDIO_SRC,
    audioDurationInSeconds: ep017.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-018-hello-world-and-why-fmt-matters",
    component: Ep018Reel,
    audioSrc: ep018.AUDIO_SRC,
    audioDurationInSeconds: ep018.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-019-go-run-vs-go-build",
    component: Ep019Reel,
    audioSrc: ep019.AUDIO_SRC,
    audioDurationInSeconds: ep019.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-020-exit-codes-and-failing-fast",
    component: Ep020Reel,
    audioSrc: ep020.AUDIO_SRC,
    audioDurationInSeconds: ep020.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-021-comments-that-help-and-ones-that-dont",
    component: Ep021Reel,
    audioSrc: ep021.AUDIO_SRC,
    audioDurationInSeconds: ep021.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-022-gofmt-go-fmt-non-negotiable-style",
    component: Ep022Reel,
    audioSrc: ep022.AUDIO_SRC,
    audioDurationInSeconds: ep022.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-023-go-vet-cheap-static-checks",
    component: Ep023Reel,
    audioSrc: ep023.AUDIO_SRC,
    audioDurationInSeconds: ep023.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-024-mini-checklist-first-go-hour",
    component: Ep024Reel,
    audioSrc: ep024.AUDIO_SRC,
    audioDurationInSeconds: ep024.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-025-packages-vs-modules",
    component: Ep025Reel,
    audioSrc: ep025.AUDIO_SRC,
    audioDurationInSeconds: ep025.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-026-gomod-in-plain-words",
    component: Ep026Reel,
    audioSrc: ep026.AUDIO_SRC,
    audioDurationInSeconds: ep026.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-027-go-get-go-mod-tidy",
    component: Ep027Reel,
    audioSrc: ep027.AUDIO_SRC,
    audioDurationInSeconds: ep027.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-028-module-paths-and-import-paths",
    component: Ep028Reel,
    audioSrc: ep028.AUDIO_SRC,
    audioDurationInSeconds: ep028.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-029-internal-packages",
    component: Ep029Reel,
    audioSrc: ep029.AUDIO_SRC,
    audioDurationInSeconds: ep029.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-030-cmd-and-internal-layout",
    component: Ep030Reel,
    audioSrc: ep030.AUDIO_SRC,
    audioDurationInSeconds: ep030.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-031-one-package-per-folder-rule",
    component: Ep031Reel,
    audioSrc: ep031.AUDIO_SRC,
    audioDurationInSeconds: ep031.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-032-exported-vs-unexported-names",
    component: Ep032Reel,
    audioSrc: ep032.AUDIO_SRC,
    audioDurationInSeconds: ep032.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-033-doc-comments-on-exported-symbols",
    component: Ep033Reel,
    audioSrc: ep033.AUDIO_SRC,
    audioDurationInSeconds: ep033.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-034-go-doc-locally",
    component: Ep034Reel,
    audioSrc: ep034.AUDIO_SRC,
    audioDurationInSeconds: ep034.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-035-replace-directives",
    component: Ep035Reel,
    audioSrc: ep035.AUDIO_SRC,
    audioDurationInSeconds: ep035.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-036-semantic-import-versioning",
    component: Ep036Reel,
    audioSrc: ep036.AUDIO_SRC,
    audioDurationInSeconds: ep036.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-037-vendoring-basics",
    component: Ep037Reel,
    audioSrc: ep037.AUDIO_SRC,
    audioDurationInSeconds: ep037.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-038-mini-checklist-healthy-go-module",
    component: Ep038Reel,
    audioSrc: ep038.AUDIO_SRC,
    audioDurationInSeconds: ep038.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-039-short-declare-vs-var",
    component: Ep039Reel,
    audioSrc: ep039.AUDIO_SRC,
    audioDurationInSeconds: ep039.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-040-zero-values-everywhere",
    component: Ep040Reel,
    audioSrc: ep040.AUDIO_SRC,
    audioDurationInSeconds: ep040.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-041-basic-types",
    component: Ep041Reel,
    audioSrc: ep041.AUDIO_SRC,
    audioDurationInSeconds: ep041.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-042-type-conversion-is-explicit",
    component: Ep042Reel,
    audioSrc: ep042.AUDIO_SRC,
    audioDurationInSeconds: ep042.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-043-constants-and-iota",
    component: Ep043Reel,
    audioSrc: ep043.AUDIO_SRC,
    audioDurationInSeconds: ep043.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-044-strings-are-immutable-byte-sequences",
    component: Ep044Reel,
    audioSrc: ep044.AUDIO_SRC,
    audioDurationInSeconds: ep044.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-045-runes-vs-bytes",
    component: Ep045Reel,
    audioSrc: ep045.AUDIO_SRC,
    audioDurationInSeconds: ep045.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-046-raw-string-literals",
    component: Ep046Reel,
    audioSrc: ep046.AUDIO_SRC,
    audioDurationInSeconds: ep046.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-047-pointers-without-fear",
    component: Ep047Reel,
    audioSrc: ep047.AUDIO_SRC,
    audioDurationInSeconds: ep047.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-048-when-to-pass-pointer-vs-value",
    component: Ep048Reel,
    audioSrc: ep048.AUDIO_SRC,
    audioDurationInSeconds: ep048.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-049-new-vs-composite-literal",
    component: Ep049Reel,
    audioSrc: ep049.AUDIO_SRC,
    audioDurationInSeconds: ep049.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-050-type-aliases-vs-defined-types",
    component: Ep050Reel,
    audioSrc: ep050.AUDIO_SRC,
    audioDurationInSeconds: ep050.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-051-named-results",
    component: Ep051Reel,
    audioSrc: ep051.AUDIO_SRC,
    audioDurationInSeconds: ep051.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-052-shadowing-bugs",
    component: Ep052Reel,
    audioSrc: ep052.AUDIO_SRC,
    audioDurationInSeconds: ep052.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-053-any-alias-for-interface",
    component: Ep053Reel,
    audioSrc: ep053.AUDIO_SRC,
    audioDurationInSeconds: ep053.AUDIO_DURATION_SECONDS,
  },
  {
    id: "golang-054-mini-checklist-types-without-pain",
    component: Ep054Reel,
    audioSrc: ep054.AUDIO_SRC,
    audioDurationInSeconds: ep054.AUDIO_DURATION_SECONDS,
  },
];
