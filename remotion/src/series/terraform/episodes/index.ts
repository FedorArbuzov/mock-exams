import type {EpisodeConfig} from "../../../shared/types";

import * as ep001 from "./001-what-is-terraform-in-30-seconds/content";
import {Reel as Ep001Reel} from "./001-what-is-terraform-in-30-seconds/Reel";
import * as ep002 from "./002-why-iac-beats-clickops/content";
import {Reel as Ep002Reel} from "./002-why-iac-beats-clickops/Reel";
import * as ep003 from "./003-declarative-desired-state/content";
import {Reel as Ep003Reel} from "./003-declarative-desired-state/Reel";
import * as ep004 from "./004-hcl-in-plain-words/content";
import {Reel as Ep004Reel} from "./004-hcl-in-plain-words/Reel";
import * as ep005 from "./005-providers-plugins-that-talk-to-clouds/content";
import {Reel as Ep005Reel} from "./005-providers-plugins-that-talk-to-clouds/Reel";
import * as ep006 from "./006-resources-vs-data-sources/content";
import {Reel as Ep006Reel} from "./006-resources-vs-data-sources/Reel";
import * as ep007 from "./007-plan-then-apply-mental-model/content";
import {Reel as Ep007Reel} from "./007-plan-then-apply-mental-model/Reel";
import * as ep008 from "./008-state-file-the-map-of-reality/content";
import {Reel as Ep008Reel} from "./008-state-file-the-map-of-reality/Reel";
import * as ep009 from "./009-when-you-do-not-need-terraform/content";
import {Reel as Ep009Reel} from "./009-when-you-do-not-need-terraform/Reel";
import * as ep010 from "./010-myth-terraform-is-only-for-aws/content";
import {Reel as Ep010Reel} from "./010-myth-terraform-is-only-for-aws/Reel";
import * as ep011 from "./011-terraform-vs-cloudformation-vs-pulumi/content";
import {Reel as Ep011Reel} from "./011-terraform-vs-cloudformation-vs-pulumi/Reel";
import * as ep012 from "./012-mini-checklist-first-terraform-hour/content";
import {Reel as Ep012Reel} from "./012-mini-checklist-first-terraform-hour/Reel";
import * as ep013 from "./013-install-terraform-the-clean-way/content";
import {Reel as Ep013Reel} from "./013-install-terraform-the-clean-way/Reel";
import * as ep014 from "./014-terraform-version-and-required-version/content";
import {Reel as Ep014Reel} from "./014-terraform-version-and-required-version/Reel";
import * as ep015 from "./015-project-layout-one-folder-many-tf-files/content";
import {Reel as Ep015Reel} from "./015-project-layout-one-folder-many-tf-files/Reel";
import * as ep016 from "./016-terraform-init-what-it-downloads/content";
import {Reel as Ep016Reel} from "./016-terraform-init-what-it-downloads/Reel";
import * as ep017 from "./017-terraform-fmt-free-style-consistency/content";
import {Reel as Ep017Reel} from "./017-terraform-fmt-free-style-consistency/Reel";
import * as ep018 from "./018-terraform-validate-catch-syntax-early/content";
import {Reel as Ep018Reel} from "./018-terraform-validate-catch-syntax-early/Reel";
import * as ep019 from "./019-first-resource-aws-s3-bucket-or-local-mock/content";
import {Reel as Ep019Reel} from "./019-first-resource-aws-s3-bucket-or-local-mock/Reel";
import * as ep020 from "./020-terraform-plan-reading-the-diff/content";
import {Reel as Ep020Reel} from "./020-terraform-plan-reading-the-diff/Reel";
import * as ep021 from "./021-terraform-apply-and-confirmation/content";
import {Reel as Ep021Reel} from "./021-terraform-apply-and-confirmation/Reel";
import * as ep022 from "./022-terraform-destroy-without-drama/content";
import {Reel as Ep022Reel} from "./022-terraform-destroy-without-drama/Reel";
import * as ep023 from "./023-no-changes-idempotency-win/content";
import {Reel as Ep023Reel} from "./023-no-changes-idempotency-win/Reel";
import * as ep024 from "./024-mini-checklist-healthy-first-project/content";
import {Reel as Ep024Reel} from "./024-mini-checklist-healthy-first-project/Reel";
import * as ep025 from "./025-provider-aws-region-and-defaults/content";
import {Reel as Ep025Reel} from "./025-provider-aws-region-and-defaults/Reel";
import * as ep026 from "./026-credentials-env-vars-vs-shared-config/content";
import {Reel as Ep026Reel} from "./026-credentials-env-vars-vs-shared-config/Reel";
import * as ep027 from "./027-assume-role-patterns-high-level/content";
import {Reel as Ep027Reel} from "./027-assume-role-patterns-high-level/Reel";
import * as ep028 from "./028-multiple-providers-aliases/content";
import {Reel as Ep028Reel} from "./028-multiple-providers-aliases/Reel";
import * as ep029 from "./029-required-providers-lock-file/content";
import {Reel as Ep029Reel} from "./029-required-providers-lock-file/Reel";
import * as ep030 from "./030-provider-version-constraints-5-0/content";
import {Reel as Ep030Reel} from "./030-provider-version-constraints-5-0/Reel";
import * as ep031 from "./031-localstack-tflocal-for-safe-practice/content";
import {Reel as Ep031Reel} from "./031-localstack-tflocal-for-safe-practice/Reel";
import * as ep032 from "./032-endpoint-overrides-for-local-apis/content";
import {Reel as Ep032Reel} from "./032-endpoint-overrides-for-local-apis/Reel";
import * as ep033 from "./033-default-tags-on-the-provider/content";
import {Reel as Ep033Reel} from "./033-default-tags-on-the-provider/Reel";
import * as ep034 from "./034-myth-terraform-stores-your-aws-keys-in-state-nuance/content";
import {Reel as Ep034Reel} from "./034-myth-terraform-stores-your-aws-keys-in-state-nuance/Reel";
import * as ep035 from "./035-never-hardcode-secrets-in-tf/content";
import {Reel as Ep035Reel} from "./035-never-hardcode-secrets-in-tf/Reel";
import * as ep036 from "./036-mini-checklist-safe-provider-setup/content";
import {Reel as Ep036Reel} from "./036-mini-checklist-safe-provider-setup/Reel";
import * as ep037 from "./037-what-lives-inside-terraform-tfstate/content";
import {Reel as Ep037Reel} from "./037-what-lives-inside-terraform-tfstate/Reel";
import * as ep038 from "./038-why-local-state-is-dangerous-for-teams/content";
import {Reel as Ep038Reel} from "./038-why-local-state-is-dangerous-for-teams/Reel";
import * as ep039 from "./039-remote-backend-s3/content";
import {Reel as Ep039Reel} from "./039-remote-backend-s3/Reel";
import * as ep040 from "./040-state-locking-with-dynamodb/content";
import {Reel as Ep040Reel} from "./040-state-locking-with-dynamodb/Reel";
import * as ep041 from "./041-terraform-state-list/content";
import {Reel as Ep041Reel} from "./041-terraform-state-list/Reel";
import * as ep042 from "./042-terraform-state-show/content";
import {Reel as Ep042Reel} from "./042-terraform-state-show/Reel";
import * as ep043 from "./043-terraform-refresh-refresh-only/content";
import {Reel as Ep043Reel} from "./043-terraform-refresh-refresh-only/Reel";
import * as ep044 from "./044-drift-console-changed-it-terraform-notices/content";
import {Reel as Ep044Reel} from "./044-drift-console-changed-it-terraform-notices/Reel";
import * as ep045 from "./045-terraform-import-when-you-inherit-clickops/content";
import {Reel as Ep045Reel} from "./045-terraform-import-when-you-inherit-clickops/Reel";
import * as ep046 from "./046-terraform-state-mv-rm-careful-surgery/content";
import {Reel as Ep046Reel} from "./046-terraform-state-mv-rm-careful-surgery/Reel";
import * as ep047 from "./047-partial-apply-risk-and-targeting-target/content";
import {Reel as Ep047Reel} from "./047-partial-apply-risk-and-targeting-target/Reel";
import * as ep048 from "./048-workspaces-vs-separate-state-files/content";
import {Reel as Ep048Reel} from "./048-workspaces-vs-separate-state-files/Reel";
import * as ep049 from "./049-backend-migrate-without-panic/content";
import {Reel as Ep049Reel} from "./049-backend-migrate-without-panic/Reel";
import * as ep050 from "./050-mini-checklist-state-you-can-trust/content";
import {Reel as Ep050Reel} from "./050-mini-checklist-state-you-can-trust/Reel";
import * as ep051 from "./051-input-variables-basics/content";
import {Reel as Ep051Reel} from "./051-input-variables-basics/Reel";
import * as ep052 from "./052-terraform-tfvars-and-auto-tfvars/content";
import {Reel as Ep052Reel} from "./052-terraform-tfvars-and-auto-tfvars/Reel";
import * as ep053 from "./053-variable-types-and-validation/content";
import {Reel as Ep053Reel} from "./053-variable-types-and-validation/Reel";
import * as ep054 from "./054-sensitive-variables/content";
import {Reel as Ep054Reel} from "./054-sensitive-variables/Reel";
import * as ep055 from "./055-locals-for-dry-expressions/content";
import {Reel as Ep055Reel} from "./055-locals-for-dry-expressions/Reel";
import * as ep056 from "./056-outputs-for-humans-and-other-stacks/content";
import {Reel as Ep056Reel} from "./056-outputs-for-humans-and-other-stacks/Reel";
import * as ep057 from "./057-dash-var-and-dash-var-file-on-the-cli/content";
import {Reel as Ep057Reel} from "./057-dash-var-and-dash-var-file-on-the-cli/Reel";
import * as ep058 from "./058-environment-naming-with-variables/content";
import {Reel as Ep058Reel} from "./058-environment-naming-with-variables/Reel";
import * as ep059 from "./059-count-vs-for-each-preview/content";
import {Reel as Ep059Reel} from "./059-count-vs-for-each-preview/Reel";
import * as ep060 from "./060-depends-on-vs-implicit-dependencies/content";
import {Reel as Ep060Reel} from "./060-depends-on-vs-implicit-dependencies/Reel";
import * as ep061 from "./061-terraform-console-for-expressions/content";
import {Reel as Ep061Reel} from "./061-terraform-console-for-expressions/Reel";
import * as ep062 from "./062-conditional-expressions-carefully/content";
import {Reel as Ep062Reel} from "./062-conditional-expressions-carefully/Reel";
import * as ep063 from "./063-dynamic-blocks-when-yaml-would-explode/content";
import {Reel as Ep063Reel} from "./063-dynamic-blocks-when-yaml-would-explode/Reel";
import * as ep064 from "./064-mini-checklist-clean-inputs-outputs/content";
import {Reel as Ep064Reel} from "./064-mini-checklist-clean-inputs-outputs/Reel";
import * as ep065 from "./065-iam-role-policy-attachments/content";
import {Reel as Ep065Reel} from "./065-iam-role-policy-attachments/Reel";
import * as ep066 from "./066-least-privilege-for-terraform-itself/content";
import {Reel as Ep066Reel} from "./066-least-privilege-for-terraform-itself/Reel";
import * as ep067 from "./067-s3-bucket-versioning-encryption/content";
import {Reel as Ep067Reel} from "./067-s3-bucket-versioning-encryption/Reel";
import * as ep068 from "./068-bucket-public-access-blocks/content";
import {Reel as Ep068Reel} from "./068-bucket-public-access-blocks/Reel";
import * as ep069 from "./069-dynamodb-table-basics/content";
import {Reel as Ep069Reel} from "./069-dynamodb-table-basics/Reel";
import * as ep070 from "./070-lambda-function-packaging-high-level/content";
import {Reel as Ep070Reel} from "./070-lambda-function-packaging-high-level/Reel";
import * as ep071 from "./071-api-gateway-sketch/content";
import {Reel as Ep071Reel} from "./071-api-gateway-sketch/Reel";
import * as ep072 from "./072-vpc-mental-model-in-terraform/content";
import {Reel as Ep072Reel} from "./072-vpc-mental-model-in-terraform/Reel";
import * as ep073 from "./073-security-groups-as-code/content";
import {Reel as Ep073Reel} from "./073-security-groups-as-code/Reel";
import * as ep074 from "./074-rds-instance-caveats-state-destroy/content";
import {Reel as Ep074Reel} from "./074-rds-instance-caveats-state-destroy/Reel";
import * as ep075 from "./075-ecr-repository/content";
import {Reel as Ep075Reel} from "./075-ecr-repository/Reel";
import * as ep076 from "./076-ecs-eks-pointers-when-not-to-start-here/content";
import {Reel as Ep076Reel} from "./076-ecs-eks-pointers-when-not-to-start-here/Reel";
import * as ep077 from "./077-cloudwatch-log-groups/content";
import {Reel as Ep077Reel} from "./077-cloudwatch-log-groups/Reel";
import * as ep078 from "./078-sns-sqs-wiring/content";
import {Reel as Ep078Reel} from "./078-sns-sqs-wiring/Reel";
import * as ep079 from "./079-tags-everywhere-for-cost-and-ownership/content";
import {Reel as Ep079Reel} from "./079-tags-everywhere-for-cost-and-ownership/Reel";
import * as ep080 from "./080-resource-naming-conventions/content";
import {Reel as Ep080Reel} from "./080-resource-naming-conventions/Reel";
import * as ep081 from "./081-lifecycle-prevent-destroy/content";
import {Reel as Ep081Reel} from "./081-lifecycle-prevent-destroy/Reel";
import * as ep082 from "./082-lifecycle-ignore-changes/content";
import {Reel as Ep082Reel} from "./082-lifecycle-ignore-changes/Reel";
import * as ep083 from "./083-create-before-destroy/content";
import {Reel as Ep083Reel} from "./083-create-before-destroy/Reel";
import * as ep084 from "./084-mini-checklist-aws-resources-without-landmines/content";
import {Reel as Ep084Reel} from "./084-mini-checklist-aws-resources-without-landmines/Reel";
import * as ep085 from "./085-why-modules-exist/content";
import {Reel as Ep085Reel} from "./085-why-modules-exist/Reel";
import * as ep086 from "./086-module-sources-local-path/content";
import {Reel as Ep086Reel} from "./086-module-sources-local-path/Reel";
import * as ep087 from "./087-module-sources-registry/content";
import {Reel as Ep087Reel} from "./087-module-sources-registry/Reel";
import * as ep088 from "./088-module-inputs-and-outputs/content";
import {Reel as Ep088Reel} from "./088-module-inputs-and-outputs/Reel";
import * as ep089 from "./089-version-pinning-modules/content";
import {Reel as Ep089Reel} from "./089-version-pinning-modules/Reel";
import * as ep090 from "./090-root-module-vs-child-modules/content";
import {Reel as Ep090Reel} from "./090-root-module-vs-child-modules/Reel";
import * as ep091 from "./091-don-t-module-everything-on-day-one/content";
import {Reel as Ep091Reel} from "./091-don-t-module-everything-on-day-one/Reel";
import * as ep092 from "./092-refactoring-into-a-module-safely/content";
import {Reel as Ep092Reel} from "./092-refactoring-into-a-module-safely/Reel";
import * as ep093 from "./093-module-composition-patterns/content";
import {Reel as Ep093Reel} from "./093-module-composition-patterns/Reel";
import * as ep094 from "./094-publishing-an-internal-module-idea/content";
import {Reel as Ep094Reel} from "./094-publishing-an-internal-module-idea/Reel";
import * as ep095 from "./095-anti-pattern-god-module/content";
import {Reel as Ep095Reel} from "./095-anti-pattern-god-module/Reel";
import * as ep096 from "./096-mini-checklist-modules-that-help/content";
import {Reel as Ep096Reel} from "./096-mini-checklist-modules-that-help/Reel";
import * as ep097 from "./097-pr-review-read-the-plan-artifact/content";
import {Reel as Ep097Reel} from "./097-pr-review-read-the-plan-artifact/Reel";
import * as ep098 from "./098-terraform-plan-in-ci/content";
import {Reel as Ep098Reel} from "./098-terraform-plan-in-ci/Reel";
import * as ep099 from "./099-terraform-apply-from-ci-with-guards/content";
import {Reel as Ep099Reel} from "./099-terraform-apply-from-ci-with-guards/Reel";
import * as ep100 from "./100-oidc-to-cloud-no-long-lived-keys/content";
import {Reel as Ep100Reel} from "./100-oidc-to-cloud-no-long-lived-keys/Reel";
import * as ep101 from "./101-separate-states-per-env/content";
import {Reel as Ep101Reel} from "./101-separate-states-per-env/Reel";
import * as ep102 from "./102-policy-as-code-opa-sentinel-idea/content";
import {Reel as Ep102Reel} from "./102-policy-as-code-opa-sentinel-idea/Reel";
import * as ep103 from "./103-cost-estimation-hooks/content";
import {Reel as Ep103Reel} from "./103-cost-estimation-hooks/Reel";
import * as ep104 from "./104-breaking-changes-and-upgrades/content";
import {Reel as Ep104Reel} from "./104-breaking-changes-and-upgrades/Reel";
import * as ep105 from "./105-terraform-providers-lock/content";
import {Reel as Ep105Reel} from "./105-terraform-providers-lock/Reel";
import * as ep106 from "./106-debugging-tf-log/content";
import {Reel as Ep106Reel} from "./106-debugging-tf-log/Reel";
import * as ep107 from "./107-common-errors-already-exists/content";
import {Reel as Ep107Reel} from "./107-common-errors-already-exists/Reel";
import * as ep108 from "./108-common-errors-access-denied/content";
import {Reel as Ep108Reel} from "./108-common-errors-access-denied/Reel";
import * as ep109 from "./109-common-errors-state-lock-held/content";
import {Reel as Ep109Reel} from "./109-common-errors-state-lock-held/Reel";
import * as ep110 from "./110-runbooks-for-failed-apply/content";
import {Reel as Ep110Reel} from "./110-runbooks-for-failed-apply/Reel";
import * as ep111 from "./111-interview-explain-plan-vs-apply-vs-state/content";
import {Reel as Ep111Reel} from "./111-interview-explain-plan-vs-apply-vs-state/Reel";
import * as ep112 from "./112-what-next-after-the-course/content";
import {Reel as Ep112Reel} from "./112-what-next-after-the-course/Reel";

export const terraformEpisodes: EpisodeConfig[] = [
  {
    id: "terraform-001-what-is-terraform-in-30-seconds",
    component: Ep001Reel,
    audioSrc: ep001.AUDIO_SRC,
    audioDurationInSeconds: ep001.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-002-why-iac-beats-clickops",
    component: Ep002Reel,
    audioSrc: ep002.AUDIO_SRC,
    audioDurationInSeconds: ep002.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-003-declarative-desired-state",
    component: Ep003Reel,
    audioSrc: ep003.AUDIO_SRC,
    audioDurationInSeconds: ep003.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-004-hcl-in-plain-words",
    component: Ep004Reel,
    audioSrc: ep004.AUDIO_SRC,
    audioDurationInSeconds: ep004.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-005-providers-plugins-that-talk-to-clouds",
    component: Ep005Reel,
    audioSrc: ep005.AUDIO_SRC,
    audioDurationInSeconds: ep005.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-006-resources-vs-data-sources",
    component: Ep006Reel,
    audioSrc: ep006.AUDIO_SRC,
    audioDurationInSeconds: ep006.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-007-plan-then-apply-mental-model",
    component: Ep007Reel,
    audioSrc: ep007.AUDIO_SRC,
    audioDurationInSeconds: ep007.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-008-state-file-the-map-of-reality",
    component: Ep008Reel,
    audioSrc: ep008.AUDIO_SRC,
    audioDurationInSeconds: ep008.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-009-when-you-do-not-need-terraform",
    component: Ep009Reel,
    audioSrc: ep009.AUDIO_SRC,
    audioDurationInSeconds: ep009.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-010-myth-terraform-is-only-for-aws",
    component: Ep010Reel,
    audioSrc: ep010.AUDIO_SRC,
    audioDurationInSeconds: ep010.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-011-terraform-vs-cloudformation-vs-pulumi",
    component: Ep011Reel,
    audioSrc: ep011.AUDIO_SRC,
    audioDurationInSeconds: ep011.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-012-mini-checklist-first-terraform-hour",
    component: Ep012Reel,
    audioSrc: ep012.AUDIO_SRC,
    audioDurationInSeconds: ep012.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-013-install-terraform-the-clean-way",
    component: Ep013Reel,
    audioSrc: ep013.AUDIO_SRC,
    audioDurationInSeconds: ep013.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-014-terraform-version-and-required-version",
    component: Ep014Reel,
    audioSrc: ep014.AUDIO_SRC,
    audioDurationInSeconds: ep014.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-015-project-layout-one-folder-many-tf-files",
    component: Ep015Reel,
    audioSrc: ep015.AUDIO_SRC,
    audioDurationInSeconds: ep015.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-016-terraform-init-what-it-downloads",
    component: Ep016Reel,
    audioSrc: ep016.AUDIO_SRC,
    audioDurationInSeconds: ep016.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-017-terraform-fmt-free-style-consistency",
    component: Ep017Reel,
    audioSrc: ep017.AUDIO_SRC,
    audioDurationInSeconds: ep017.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-018-terraform-validate-catch-syntax-early",
    component: Ep018Reel,
    audioSrc: ep018.AUDIO_SRC,
    audioDurationInSeconds: ep018.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-019-first-resource-aws-s3-bucket-or-local-mock",
    component: Ep019Reel,
    audioSrc: ep019.AUDIO_SRC,
    audioDurationInSeconds: ep019.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-020-terraform-plan-reading-the-diff",
    component: Ep020Reel,
    audioSrc: ep020.AUDIO_SRC,
    audioDurationInSeconds: ep020.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-021-terraform-apply-and-confirmation",
    component: Ep021Reel,
    audioSrc: ep021.AUDIO_SRC,
    audioDurationInSeconds: ep021.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-022-terraform-destroy-without-drama",
    component: Ep022Reel,
    audioSrc: ep022.AUDIO_SRC,
    audioDurationInSeconds: ep022.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-023-no-changes-idempotency-win",
    component: Ep023Reel,
    audioSrc: ep023.AUDIO_SRC,
    audioDurationInSeconds: ep023.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-024-mini-checklist-healthy-first-project",
    component: Ep024Reel,
    audioSrc: ep024.AUDIO_SRC,
    audioDurationInSeconds: ep024.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-025-provider-aws-region-and-defaults",
    component: Ep025Reel,
    audioSrc: ep025.AUDIO_SRC,
    audioDurationInSeconds: ep025.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-026-credentials-env-vars-vs-shared-config",
    component: Ep026Reel,
    audioSrc: ep026.AUDIO_SRC,
    audioDurationInSeconds: ep026.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-027-assume-role-patterns-high-level",
    component: Ep027Reel,
    audioSrc: ep027.AUDIO_SRC,
    audioDurationInSeconds: ep027.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-028-multiple-providers-aliases",
    component: Ep028Reel,
    audioSrc: ep028.AUDIO_SRC,
    audioDurationInSeconds: ep028.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-029-required-providers-lock-file",
    component: Ep029Reel,
    audioSrc: ep029.AUDIO_SRC,
    audioDurationInSeconds: ep029.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-030-provider-version-constraints-5-0",
    component: Ep030Reel,
    audioSrc: ep030.AUDIO_SRC,
    audioDurationInSeconds: ep030.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-031-localstack-tflocal-for-safe-practice",
    component: Ep031Reel,
    audioSrc: ep031.AUDIO_SRC,
    audioDurationInSeconds: ep031.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-032-endpoint-overrides-for-local-apis",
    component: Ep032Reel,
    audioSrc: ep032.AUDIO_SRC,
    audioDurationInSeconds: ep032.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-033-default-tags-on-the-provider",
    component: Ep033Reel,
    audioSrc: ep033.AUDIO_SRC,
    audioDurationInSeconds: ep033.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-034-myth-terraform-stores-your-aws-keys-in-state-nuance",
    component: Ep034Reel,
    audioSrc: ep034.AUDIO_SRC,
    audioDurationInSeconds: ep034.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-035-never-hardcode-secrets-in-tf",
    component: Ep035Reel,
    audioSrc: ep035.AUDIO_SRC,
    audioDurationInSeconds: ep035.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-036-mini-checklist-safe-provider-setup",
    component: Ep036Reel,
    audioSrc: ep036.AUDIO_SRC,
    audioDurationInSeconds: ep036.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-037-what-lives-inside-terraform-tfstate",
    component: Ep037Reel,
    audioSrc: ep037.AUDIO_SRC,
    audioDurationInSeconds: ep037.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-038-why-local-state-is-dangerous-for-teams",
    component: Ep038Reel,
    audioSrc: ep038.AUDIO_SRC,
    audioDurationInSeconds: ep038.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-039-remote-backend-s3",
    component: Ep039Reel,
    audioSrc: ep039.AUDIO_SRC,
    audioDurationInSeconds: ep039.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-040-state-locking-with-dynamodb",
    component: Ep040Reel,
    audioSrc: ep040.AUDIO_SRC,
    audioDurationInSeconds: ep040.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-041-terraform-state-list",
    component: Ep041Reel,
    audioSrc: ep041.AUDIO_SRC,
    audioDurationInSeconds: ep041.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-042-terraform-state-show",
    component: Ep042Reel,
    audioSrc: ep042.AUDIO_SRC,
    audioDurationInSeconds: ep042.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-043-terraform-refresh-refresh-only",
    component: Ep043Reel,
    audioSrc: ep043.AUDIO_SRC,
    audioDurationInSeconds: ep043.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-044-drift-console-changed-it-terraform-notices",
    component: Ep044Reel,
    audioSrc: ep044.AUDIO_SRC,
    audioDurationInSeconds: ep044.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-045-terraform-import-when-you-inherit-clickops",
    component: Ep045Reel,
    audioSrc: ep045.AUDIO_SRC,
    audioDurationInSeconds: ep045.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-046-terraform-state-mv-rm-careful-surgery",
    component: Ep046Reel,
    audioSrc: ep046.AUDIO_SRC,
    audioDurationInSeconds: ep046.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-047-partial-apply-risk-and-targeting-target",
    component: Ep047Reel,
    audioSrc: ep047.AUDIO_SRC,
    audioDurationInSeconds: ep047.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-048-workspaces-vs-separate-state-files",
    component: Ep048Reel,
    audioSrc: ep048.AUDIO_SRC,
    audioDurationInSeconds: ep048.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-049-backend-migrate-without-panic",
    component: Ep049Reel,
    audioSrc: ep049.AUDIO_SRC,
    audioDurationInSeconds: ep049.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-050-mini-checklist-state-you-can-trust",
    component: Ep050Reel,
    audioSrc: ep050.AUDIO_SRC,
    audioDurationInSeconds: ep050.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-051-input-variables-basics",
    component: Ep051Reel,
    audioSrc: ep051.AUDIO_SRC,
    audioDurationInSeconds: ep051.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-052-terraform-tfvars-and-auto-tfvars",
    component: Ep052Reel,
    audioSrc: ep052.AUDIO_SRC,
    audioDurationInSeconds: ep052.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-053-variable-types-and-validation",
    component: Ep053Reel,
    audioSrc: ep053.AUDIO_SRC,
    audioDurationInSeconds: ep053.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-054-sensitive-variables",
    component: Ep054Reel,
    audioSrc: ep054.AUDIO_SRC,
    audioDurationInSeconds: ep054.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-055-locals-for-dry-expressions",
    component: Ep055Reel,
    audioSrc: ep055.AUDIO_SRC,
    audioDurationInSeconds: ep055.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-056-outputs-for-humans-and-other-stacks",
    component: Ep056Reel,
    audioSrc: ep056.AUDIO_SRC,
    audioDurationInSeconds: ep056.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-057-dash-var-and-dash-var-file-on-the-cli",
    component: Ep057Reel,
    audioSrc: ep057.AUDIO_SRC,
    audioDurationInSeconds: ep057.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-058-environment-naming-with-variables",
    component: Ep058Reel,
    audioSrc: ep058.AUDIO_SRC,
    audioDurationInSeconds: ep058.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-059-count-vs-for-each-preview",
    component: Ep059Reel,
    audioSrc: ep059.AUDIO_SRC,
    audioDurationInSeconds: ep059.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-060-depends-on-vs-implicit-dependencies",
    component: Ep060Reel,
    audioSrc: ep060.AUDIO_SRC,
    audioDurationInSeconds: ep060.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-061-terraform-console-for-expressions",
    component: Ep061Reel,
    audioSrc: ep061.AUDIO_SRC,
    audioDurationInSeconds: ep061.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-062-conditional-expressions-carefully",
    component: Ep062Reel,
    audioSrc: ep062.AUDIO_SRC,
    audioDurationInSeconds: ep062.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-063-dynamic-blocks-when-yaml-would-explode",
    component: Ep063Reel,
    audioSrc: ep063.AUDIO_SRC,
    audioDurationInSeconds: ep063.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-064-mini-checklist-clean-inputs-outputs",
    component: Ep064Reel,
    audioSrc: ep064.AUDIO_SRC,
    audioDurationInSeconds: ep064.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-065-iam-role-policy-attachments",
    component: Ep065Reel,
    audioSrc: ep065.AUDIO_SRC,
    audioDurationInSeconds: ep065.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-066-least-privilege-for-terraform-itself",
    component: Ep066Reel,
    audioSrc: ep066.AUDIO_SRC,
    audioDurationInSeconds: ep066.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-067-s3-bucket-versioning-encryption",
    component: Ep067Reel,
    audioSrc: ep067.AUDIO_SRC,
    audioDurationInSeconds: ep067.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-068-bucket-public-access-blocks",
    component: Ep068Reel,
    audioSrc: ep068.AUDIO_SRC,
    audioDurationInSeconds: ep068.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-069-dynamodb-table-basics",
    component: Ep069Reel,
    audioSrc: ep069.AUDIO_SRC,
    audioDurationInSeconds: ep069.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-070-lambda-function-packaging-high-level",
    component: Ep070Reel,
    audioSrc: ep070.AUDIO_SRC,
    audioDurationInSeconds: ep070.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-071-api-gateway-sketch",
    component: Ep071Reel,
    audioSrc: ep071.AUDIO_SRC,
    audioDurationInSeconds: ep071.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-072-vpc-mental-model-in-terraform",
    component: Ep072Reel,
    audioSrc: ep072.AUDIO_SRC,
    audioDurationInSeconds: ep072.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-073-security-groups-as-code",
    component: Ep073Reel,
    audioSrc: ep073.AUDIO_SRC,
    audioDurationInSeconds: ep073.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-074-rds-instance-caveats-state-destroy",
    component: Ep074Reel,
    audioSrc: ep074.AUDIO_SRC,
    audioDurationInSeconds: ep074.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-075-ecr-repository",
    component: Ep075Reel,
    audioSrc: ep075.AUDIO_SRC,
    audioDurationInSeconds: ep075.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-076-ecs-eks-pointers-when-not-to-start-here",
    component: Ep076Reel,
    audioSrc: ep076.AUDIO_SRC,
    audioDurationInSeconds: ep076.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-077-cloudwatch-log-groups",
    component: Ep077Reel,
    audioSrc: ep077.AUDIO_SRC,
    audioDurationInSeconds: ep077.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-078-sns-sqs-wiring",
    component: Ep078Reel,
    audioSrc: ep078.AUDIO_SRC,
    audioDurationInSeconds: ep078.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-079-tags-everywhere-for-cost-and-ownership",
    component: Ep079Reel,
    audioSrc: ep079.AUDIO_SRC,
    audioDurationInSeconds: ep079.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-080-resource-naming-conventions",
    component: Ep080Reel,
    audioSrc: ep080.AUDIO_SRC,
    audioDurationInSeconds: ep080.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-081-lifecycle-prevent-destroy",
    component: Ep081Reel,
    audioSrc: ep081.AUDIO_SRC,
    audioDurationInSeconds: ep081.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-082-lifecycle-ignore-changes",
    component: Ep082Reel,
    audioSrc: ep082.AUDIO_SRC,
    audioDurationInSeconds: ep082.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-083-create-before-destroy",
    component: Ep083Reel,
    audioSrc: ep083.AUDIO_SRC,
    audioDurationInSeconds: ep083.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-084-mini-checklist-aws-resources-without-landmines",
    component: Ep084Reel,
    audioSrc: ep084.AUDIO_SRC,
    audioDurationInSeconds: ep084.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-085-why-modules-exist",
    component: Ep085Reel,
    audioSrc: ep085.AUDIO_SRC,
    audioDurationInSeconds: ep085.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-086-module-sources-local-path",
    component: Ep086Reel,
    audioSrc: ep086.AUDIO_SRC,
    audioDurationInSeconds: ep086.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-087-module-sources-registry",
    component: Ep087Reel,
    audioSrc: ep087.AUDIO_SRC,
    audioDurationInSeconds: ep087.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-088-module-inputs-and-outputs",
    component: Ep088Reel,
    audioSrc: ep088.AUDIO_SRC,
    audioDurationInSeconds: ep088.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-089-version-pinning-modules",
    component: Ep089Reel,
    audioSrc: ep089.AUDIO_SRC,
    audioDurationInSeconds: ep089.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-090-root-module-vs-child-modules",
    component: Ep090Reel,
    audioSrc: ep090.AUDIO_SRC,
    audioDurationInSeconds: ep090.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-091-don-t-module-everything-on-day-one",
    component: Ep091Reel,
    audioSrc: ep091.AUDIO_SRC,
    audioDurationInSeconds: ep091.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-092-refactoring-into-a-module-safely",
    component: Ep092Reel,
    audioSrc: ep092.AUDIO_SRC,
    audioDurationInSeconds: ep092.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-093-module-composition-patterns",
    component: Ep093Reel,
    audioSrc: ep093.AUDIO_SRC,
    audioDurationInSeconds: ep093.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-094-publishing-an-internal-module-idea",
    component: Ep094Reel,
    audioSrc: ep094.AUDIO_SRC,
    audioDurationInSeconds: ep094.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-095-anti-pattern-god-module",
    component: Ep095Reel,
    audioSrc: ep095.AUDIO_SRC,
    audioDurationInSeconds: ep095.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-096-mini-checklist-modules-that-help",
    component: Ep096Reel,
    audioSrc: ep096.AUDIO_SRC,
    audioDurationInSeconds: ep096.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-097-pr-review-read-the-plan-artifact",
    component: Ep097Reel,
    audioSrc: ep097.AUDIO_SRC,
    audioDurationInSeconds: ep097.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-098-terraform-plan-in-ci",
    component: Ep098Reel,
    audioSrc: ep098.AUDIO_SRC,
    audioDurationInSeconds: ep098.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-099-terraform-apply-from-ci-with-guards",
    component: Ep099Reel,
    audioSrc: ep099.AUDIO_SRC,
    audioDurationInSeconds: ep099.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-100-oidc-to-cloud-no-long-lived-keys",
    component: Ep100Reel,
    audioSrc: ep100.AUDIO_SRC,
    audioDurationInSeconds: ep100.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-101-separate-states-per-env",
    component: Ep101Reel,
    audioSrc: ep101.AUDIO_SRC,
    audioDurationInSeconds: ep101.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-102-policy-as-code-opa-sentinel-idea",
    component: Ep102Reel,
    audioSrc: ep102.AUDIO_SRC,
    audioDurationInSeconds: ep102.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-103-cost-estimation-hooks",
    component: Ep103Reel,
    audioSrc: ep103.AUDIO_SRC,
    audioDurationInSeconds: ep103.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-104-breaking-changes-and-upgrades",
    component: Ep104Reel,
    audioSrc: ep104.AUDIO_SRC,
    audioDurationInSeconds: ep104.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-105-terraform-providers-lock",
    component: Ep105Reel,
    audioSrc: ep105.AUDIO_SRC,
    audioDurationInSeconds: ep105.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-106-debugging-tf-log",
    component: Ep106Reel,
    audioSrc: ep106.AUDIO_SRC,
    audioDurationInSeconds: ep106.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-107-common-errors-already-exists",
    component: Ep107Reel,
    audioSrc: ep107.AUDIO_SRC,
    audioDurationInSeconds: ep107.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-108-common-errors-access-denied",
    component: Ep108Reel,
    audioSrc: ep108.AUDIO_SRC,
    audioDurationInSeconds: ep108.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-109-common-errors-state-lock-held",
    component: Ep109Reel,
    audioSrc: ep109.AUDIO_SRC,
    audioDurationInSeconds: ep109.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-110-runbooks-for-failed-apply",
    component: Ep110Reel,
    audioSrc: ep110.AUDIO_SRC,
    audioDurationInSeconds: ep110.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-111-interview-explain-plan-vs-apply-vs-state",
    component: Ep111Reel,
    audioSrc: ep111.AUDIO_SRC,
    audioDurationInSeconds: ep111.AUDIO_DURATION_SECONDS,
  },
  {
    id: "terraform-112-what-next-after-the-course",
    component: Ep112Reel,
    audioSrc: ep112.AUDIO_SRC,
    audioDurationInSeconds: ep112.AUDIO_DURATION_SECONDS,
  },
];
