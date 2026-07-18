import type {EpisodeConfig} from "../../../shared/types";
import * as ep001 from "./001-what-is-kubernetes/content";
import {Reel as Ep001Reel} from "./001-what-is-kubernetes/Reel";
import * as ep002 from "./002-container-vs-pod/content";
import {Reel as Ep002Reel} from "./002-container-vs-pod/Reel";
import * as ep003 from "./003-node-vs-cluster/content";
import {Reel as Ep003Reel} from "./003-node-vs-cluster/Reel";
import * as ep004 from "./004-control-plane-in-plain-words/content";
import {Reel as Ep004Reel} from "./004-control-plane-in-plain-words/Reel";
import * as ep005 from "./005-worker-node-and-its-role/content";
import {Reel as Ep005Reel} from "./005-worker-node-and-its-role/Reel";
import * as ep006 from "./006-kubelet-who-runs-pods-on-a-node/content";
import {Reel as Ep006Reel} from "./006-kubelet-who-runs-pods-on-a-node/Reel";
import * as ep007 from "./007-api-server-the-single-control-entrypoint/content";
import {Reel as Ep007Reel} from "./007-api-server-the-single-control-entrypoint/Reel";
import * as ep008 from "./008-etcd-where-cluster-state-lives/content";
import {Reel as Ep008Reel} from "./008-etcd-where-cluster-state-lives/Reel";
import * as ep009 from "./009-scheduler-how-a-node-is-chosen/content";
import {Reel as Ep009Reel} from "./009-scheduler-how-a-node-is-chosen/Reel";
import * as ep010 from "./010-desired-state-the-core-idea-of-kubernetes/content";
import {Reel as Ep010Reel} from "./010-desired-state-the-core-idea-of-kubernetes/Reel";
import * as ep011 from "./011-when-you-do-not-need-kubernetes/content";
import {Reel as Ep011Reel} from "./011-when-you-do-not-need-kubernetes/Reel";
import * as ep012 from "./012-myth-kubernetes-equals-docker-on-steroids/content";
import {Reel as Ep012Reel} from "./012-myth-kubernetes-equals-docker-on-steroids/Reel";
import * as ep013 from "./013-minikube-kind-k3s-what-a-beginner-should-pick/content";
import {Reel as Ep013Reel} from "./013-minikube-kind-k3s-what-a-beginner-should-pick/Reel";
import * as ep014 from "./014-first-cluster-in-5-minutes-with-kind/content";
import {Reel as Ep014Reel} from "./014-first-cluster-in-5-minutes-with-kind/Reel";
import * as ep015 from "./015-kubeconfig-in-plain-words/content";
import {Reel as Ep015Reel} from "./015-kubeconfig-in-plain-words/Reel";
import * as ep016 from "./016-contexts-switching-between-clusters/content";
import {Reel as Ep016Reel} from "./016-contexts-switching-between-clusters/Reel";
import * as ep017 from "./017-do-not-break-prod-separate-contexts/content";
import {Reel as Ep017Reel} from "./017-do-not-break-prod-separate-contexts/Reel";
import * as ep018 from "./018-image-registry-where-a-pod-gets-its-image/content";
import {Reel as Ep018Reel} from "./018-image-registry-where-a-pod-gets-its-image/Reel";
import * as ep019 from "./019-imagepullsecrets-private-registry/content";
import {Reel as Ep019Reel} from "./019-imagepullsecrets-private-registry/Reel";
import * as ep020 from "./020-why-you-should-not-use-latest/content";
import {Reel as Ep020Reel} from "./020-why-you-should-not-use-latest/Reel";
import * as ep021 from "./021-imagepullpolicy-when-a-new-image-is-pulled/content";
import {Reel as Ep021Reel} from "./021-imagepullpolicy-when-a-new-image-is-pulled/Reel";
import * as ep022 from "./022-docker-compose-to-kubernetes-mental-mapping/content";
import {Reel as Ep022Reel} from "./022-docker-compose-to-kubernetes-mental-mapping/Reel";
import * as ep023 from "./023-deployment-the-right-way-to-run-an-app/content";
import {Reel as Ep023Reel} from "./023-deployment-the-right-way-to-run-an-app/Reel";
import * as ep024 from "./024-replicaset-what-is-under-a-deployment/content";
import {Reel as Ep024Reel} from "./024-replicaset-what-is-under-a-deployment/Reel";
import * as ep025 from "./025-statefulset-when-you-need-it-for-stateful-apps/content";
import {Reel as Ep025Reel} from "./025-statefulset-when-you-need-it-for-stateful-apps/Reel";
import * as ep026 from "./026-daemonset-one-pod-on-every-node/content";
import {Reel as Ep026Reel} from "./026-daemonset-one-pod-on-every-node/Reel";
import * as ep027 from "./027-job-a-one-shot-task/content";
import {Reel as Ep027Reel} from "./027-job-a-one-shot-task/Reel";
import * as ep028 from "./028-cronjob-a-scheduled-task/content";
import {Reel as Ep028Reel} from "./028-cronjob-a-scheduled-task/Reel";
import * as ep029 from "./029-namespace-how-to-separate-environments/content";
import {Reel as Ep029Reel} from "./029-namespace-how-to-separate-environments/Reel";
import * as ep030 from "./030-labels-basic-resource-organization/content";
import {Reel as Ep030Reel} from "./030-labels-basic-resource-organization/Reel";
import * as ep031 from "./031-selectors-how-objects-find-each-other/content";
import {Reel as Ep031Reel} from "./031-selectors-how-objects-find-each-other/Reel";
import * as ep032 from "./032-annotations-operational-metadata/content";
import {Reel as Ep032Reel} from "./032-annotations-operational-metadata/Reel";
import * as ep033 from "./033-configmap-external-configuration/content";
import {Reel as Ep033Reel} from "./033-configmap-external-configuration/Reel";
import * as ep034 from "./034-secret-sensitive-data/content";
import {Reel as Ep034Reel} from "./034-secret-sensitive-data/Reel";
import * as ep035 from "./035-serviceaccount-identity-for-a-pod/content";
import {Reel as Ep035Reel} from "./035-serviceaccount-identity-for-a-pod/Reel";
import * as ep036 from "./036-service-stable-networking-for-pods/content";
import {Reel as Ep036Reel} from "./036-service-stable-networking-for-pods/Reel";
import * as ep037 from "./037-ingress-inbound-http-and-https-traffic/content";
import {Reel as Ep037Reel} from "./037-ingress-inbound-http-and-https-traffic/Reel";
import * as ep038 from "./038-yaml-without-pain-apiversion-kind-metadata-spec/content";
import {Reel as Ep038Reel} from "./038-yaml-without-pain-apiversion-kind-metadata-spec/Reel";
import * as ep039 from "./039-declarative-vs-imperative-approach/content";
import {Reel as Ep039Reel} from "./039-declarative-vs-imperative-approach/Reel";
import * as ep040 from "./040-kubectl-get-a-beginners-first-command/content";
import {Reel as Ep040Reel} from "./040-kubectl-get-a-beginners-first-command/Reel";
import * as ep041 from "./041-kubectl-get-all-why-it-is-not-everything/content";
import {Reel as Ep041Reel} from "./041-kubectl-get-all-why-it-is-not-everything/Reel";
import * as ep042 from "./042-kubectl-describe-best-first-diagnostic-step/content";
import {Reel as Ep042Reel} from "./042-kubectl-describe-best-first-diagnostic-step/Reel";
import * as ep043 from "./043-kubectl-logs-and-previous/content";
import {Reel as Ep043Reel} from "./043-kubectl-logs-and-previous/Reel";
import * as ep044 from "./044-kubectl-exec-targeted-debug-inside-a-container/content";
import {Reel as Ep044Reel} from "./044-kubectl-exec-targeted-debug-inside-a-container/Reel";
import * as ep045 from "./045-kubectl-port-forward-local-access-to-a-service/content";
import {Reel as Ep045Reel} from "./045-kubectl-port-forward-local-access-to-a-service/Reel";
import * as ep046 from "./046-kubectl-apply-vs-create/content";
import {Reel as Ep046Reel} from "./046-kubectl-apply-vs-create/Reel";
import * as ep047 from "./047-kubectl-delete-what-to-delete-correctly/content";
import {Reel as Ep047Reel} from "./047-kubectl-delete-what-to-delete-correctly/Reel";
import * as ep048 from "./048-kubectl-edit-emergency-cluster-edits/content";
import {Reel as Ep048Reel} from "./048-kubectl-edit-emergency-cluster-edits/Reel";
import * as ep049 from "./049-kubectl-patch-surgical-changes/content";
import {Reel as Ep049Reel} from "./049-kubectl-patch-surgical-changes/Reel";
import * as ep050 from "./050-kubectl-diff-preview-changes-before-apply/content";
import {Reel as Ep050Reel} from "./050-kubectl-diff-preview-changes-before-apply/Reel";
import * as ep051 from "./051-kubectl-explain-docs-right-in-the-cli/content";
import {Reel as Ep051Reel} from "./051-kubectl-explain-docs-right-in-the-cli/Reel";
import * as ep052 from "./052-kubectl-api-resources-which-resources-exist/content";
import {Reel as Ep052Reel} from "./052-kubectl-api-resources-which-resources-exist/Reel";
import * as ep053 from "./053-kubectl-get-o-wide-wider-overview/content";
import {Reel as Ep053Reel} from "./053-kubectl-get-o-wide-wider-overview/Reel";
import * as ep054 from "./054-kubectl-get-pods-a-search-all-namespaces/content";
import {Reel as Ep054Reel} from "./054-kubectl-get-pods-a-search-all-namespaces/Reel";
import * as ep055 from "./055-kubectl-cp-copy-files-to-and-from-a-pod/content";
import {Reel as Ep055Reel} from "./055-kubectl-cp-copy-files-to-and-from-a-pod/Reel";
import * as ep056 from "./056-kubectl-wait-waits-in-automation/content";
import {Reel as Ep056Reel} from "./056-kubectl-wait-waits-in-automation/Reel";
import * as ep057 from "./057-mini-routine-5-morning-commands/content";
import {Reel as Ep057Reel} from "./057-mini-routine-5-morning-commands/Reel";
import * as ep058 from "./058-how-to-read-the-pod-status-column/content";
import {Reel as Ep058Reel} from "./058-how-to-read-the-pod-status-column/Reel";
import * as ep059 from "./059-containercreating-vs-pending/content";
import {Reel as Ep059Reel} from "./059-containercreating-vs-pending/Reel";
import * as ep060 from "./060-errimagepull-and-imagepullbackoff/content";
import {Reel as Ep060Reel} from "./060-errimagepull-and-imagepullbackoff/Reel";
import * as ep061 from "./061-createcontainerconfigerror/content";
import {Reel as Ep061Reel} from "./061-createcontainerconfigerror/Reel";
import * as ep062 from "./062-crashloopbackoff-vs-plain-error/content";
import {Reel as Ep062Reel} from "./062-crashloopbackoff-vs-plain-error/Reel";
import * as ep063 from "./063-runcontainererror/content";
import {Reel as Ep063Reel} from "./063-runcontainererror/Reel";
import * as ep064 from "./064-job-completed-is-normal/content";
import {Reel as Ep064Reel} from "./064-job-completed-is-normal/Reel";
import * as ep065 from "./065-why-restarts-keeps-growing/content";
import {Reel as Ep065Reel} from "./065-why-restarts-keeps-growing/Reel";
import * as ep066 from "./066-events-vs-logs-what-to-check-first/content";
import {Reel as Ep066Reel} from "./066-events-vs-logs-what-to-check-first/Reel";
import * as ep067 from "./067-kubectl-get-events-sorted-by-time/content";
import {Reel as Ep067Reel} from "./067-kubectl-get-events-sorted-by-time/Reel";
import * as ep068 from "./068-kubectl-top-and-metrics-server/content";
import {Reel as Ep068Reel} from "./068-kubectl-top-and-metrics-server/Reel";
import * as ep069 from "./069-kubectl-debug-and-ephemeral-containers/content";
import {Reel as Ep069Reel} from "./069-kubectl-debug-and-ephemeral-containers/Reel";
import * as ep070 from "./070-breakdown-why-a-pod-is-pending/content";
import {Reel as Ep070Reel} from "./070-breakdown-why-a-pod-is-pending/Reel";
import * as ep071 from "./071-breakdown-service-with-no-endpoints/content";
import {Reel as Ep071Reel} from "./071-breakdown-service-with-no-endpoints/Reel";
import * as ep072 from "./072-checklist-60-seconds-into-an-incident/content";
import {Reel as Ep072Reel} from "./072-checklist-60-seconds-into-an-incident/Reel";

export const kubernetesEpisodes: EpisodeConfig[] = [
  {
    id: "kubernetes-001-what-is-kubernetes",
    component: Ep001Reel,
    audioSrc: ep001.AUDIO_SRC,
    audioDurationInSeconds: ep001.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-002-container-vs-pod",
    component: Ep002Reel,
    audioSrc: ep002.AUDIO_SRC,
    audioDurationInSeconds: ep002.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-003-node-vs-cluster",
    component: Ep003Reel,
    audioSrc: ep003.AUDIO_SRC,
    audioDurationInSeconds: ep003.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-004-control-plane-in-plain-words",
    component: Ep004Reel,
    audioSrc: ep004.AUDIO_SRC,
    audioDurationInSeconds: ep004.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-005-worker-node-and-its-role",
    component: Ep005Reel,
    audioSrc: ep005.AUDIO_SRC,
    audioDurationInSeconds: ep005.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-006-kubelet-who-runs-pods-on-a-node",
    component: Ep006Reel,
    audioSrc: ep006.AUDIO_SRC,
    audioDurationInSeconds: ep006.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-007-api-server-the-single-control-entrypoint",
    component: Ep007Reel,
    audioSrc: ep007.AUDIO_SRC,
    audioDurationInSeconds: ep007.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-008-etcd-where-cluster-state-lives",
    component: Ep008Reel,
    audioSrc: ep008.AUDIO_SRC,
    audioDurationInSeconds: ep008.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-009-scheduler-how-a-node-is-chosen",
    component: Ep009Reel,
    audioSrc: ep009.AUDIO_SRC,
    audioDurationInSeconds: ep009.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-010-desired-state-the-core-idea-of-kubernetes",
    component: Ep010Reel,
    audioSrc: ep010.AUDIO_SRC,
    audioDurationInSeconds: ep010.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-011-when-you-do-not-need-kubernetes",
    component: Ep011Reel,
    audioSrc: ep011.AUDIO_SRC,
    audioDurationInSeconds: ep011.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-012-myth-kubernetes-equals-docker-on-steroids",
    component: Ep012Reel,
    audioSrc: ep012.AUDIO_SRC,
    audioDurationInSeconds: ep012.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-013-minikube-kind-k3s-what-a-beginner-should-pick",
    component: Ep013Reel,
    audioSrc: ep013.AUDIO_SRC,
    audioDurationInSeconds: ep013.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-014-first-cluster-in-5-minutes-with-kind",
    component: Ep014Reel,
    audioSrc: ep014.AUDIO_SRC,
    audioDurationInSeconds: ep014.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-015-kubeconfig-in-plain-words",
    component: Ep015Reel,
    audioSrc: ep015.AUDIO_SRC,
    audioDurationInSeconds: ep015.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-016-contexts-switching-between-clusters",
    component: Ep016Reel,
    audioSrc: ep016.AUDIO_SRC,
    audioDurationInSeconds: ep016.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-017-do-not-break-prod-separate-contexts",
    component: Ep017Reel,
    audioSrc: ep017.AUDIO_SRC,
    audioDurationInSeconds: ep017.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-018-image-registry-where-a-pod-gets-its-image",
    component: Ep018Reel,
    audioSrc: ep018.AUDIO_SRC,
    audioDurationInSeconds: ep018.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-019-imagepullsecrets-private-registry",
    component: Ep019Reel,
    audioSrc: ep019.AUDIO_SRC,
    audioDurationInSeconds: ep019.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-020-why-you-should-not-use-latest",
    component: Ep020Reel,
    audioSrc: ep020.AUDIO_SRC,
    audioDurationInSeconds: ep020.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-021-imagepullpolicy-when-a-new-image-is-pulled",
    component: Ep021Reel,
    audioSrc: ep021.AUDIO_SRC,
    audioDurationInSeconds: ep021.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-022-docker-compose-to-kubernetes-mental-mapping",
    component: Ep022Reel,
    audioSrc: ep022.AUDIO_SRC,
    audioDurationInSeconds: ep022.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-023-deployment-the-right-way-to-run-an-app",
    component: Ep023Reel,
    audioSrc: ep023.AUDIO_SRC,
    audioDurationInSeconds: ep023.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-024-replicaset-what-is-under-a-deployment",
    component: Ep024Reel,
    audioSrc: ep024.AUDIO_SRC,
    audioDurationInSeconds: ep024.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-025-statefulset-when-you-need-it-for-stateful-apps",
    component: Ep025Reel,
    audioSrc: ep025.AUDIO_SRC,
    audioDurationInSeconds: ep025.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-026-daemonset-one-pod-on-every-node",
    component: Ep026Reel,
    audioSrc: ep026.AUDIO_SRC,
    audioDurationInSeconds: ep026.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-027-job-a-one-shot-task",
    component: Ep027Reel,
    audioSrc: ep027.AUDIO_SRC,
    audioDurationInSeconds: ep027.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-028-cronjob-a-scheduled-task",
    component: Ep028Reel,
    audioSrc: ep028.AUDIO_SRC,
    audioDurationInSeconds: ep028.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-029-namespace-how-to-separate-environments",
    component: Ep029Reel,
    audioSrc: ep029.AUDIO_SRC,
    audioDurationInSeconds: ep029.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-030-labels-basic-resource-organization",
    component: Ep030Reel,
    audioSrc: ep030.AUDIO_SRC,
    audioDurationInSeconds: ep030.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-031-selectors-how-objects-find-each-other",
    component: Ep031Reel,
    audioSrc: ep031.AUDIO_SRC,
    audioDurationInSeconds: ep031.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-032-annotations-operational-metadata",
    component: Ep032Reel,
    audioSrc: ep032.AUDIO_SRC,
    audioDurationInSeconds: ep032.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-033-configmap-external-configuration",
    component: Ep033Reel,
    audioSrc: ep033.AUDIO_SRC,
    audioDurationInSeconds: ep033.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-034-secret-sensitive-data",
    component: Ep034Reel,
    audioSrc: ep034.AUDIO_SRC,
    audioDurationInSeconds: ep034.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-035-serviceaccount-identity-for-a-pod",
    component: Ep035Reel,
    audioSrc: ep035.AUDIO_SRC,
    audioDurationInSeconds: ep035.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-036-service-stable-networking-for-pods",
    component: Ep036Reel,
    audioSrc: ep036.AUDIO_SRC,
    audioDurationInSeconds: ep036.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-037-ingress-inbound-http-and-https-traffic",
    component: Ep037Reel,
    audioSrc: ep037.AUDIO_SRC,
    audioDurationInSeconds: ep037.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-038-yaml-without-pain-apiversion-kind-metadata-spec",
    component: Ep038Reel,
    audioSrc: ep038.AUDIO_SRC,
    audioDurationInSeconds: ep038.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-039-declarative-vs-imperative-approach",
    component: Ep039Reel,
    audioSrc: ep039.AUDIO_SRC,
    audioDurationInSeconds: ep039.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-040-kubectl-get-a-beginners-first-command",
    component: Ep040Reel,
    audioSrc: ep040.AUDIO_SRC,
    audioDurationInSeconds: ep040.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-041-kubectl-get-all-why-it-is-not-everything",
    component: Ep041Reel,
    audioSrc: ep041.AUDIO_SRC,
    audioDurationInSeconds: ep041.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-042-kubectl-describe-best-first-diagnostic-step",
    component: Ep042Reel,
    audioSrc: ep042.AUDIO_SRC,
    audioDurationInSeconds: ep042.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-043-kubectl-logs-and-previous",
    component: Ep043Reel,
    audioSrc: ep043.AUDIO_SRC,
    audioDurationInSeconds: ep043.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-044-kubectl-exec-targeted-debug-inside-a-container",
    component: Ep044Reel,
    audioSrc: ep044.AUDIO_SRC,
    audioDurationInSeconds: ep044.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-045-kubectl-port-forward-local-access-to-a-service",
    component: Ep045Reel,
    audioSrc: ep045.AUDIO_SRC,
    audioDurationInSeconds: ep045.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-046-kubectl-apply-vs-create",
    component: Ep046Reel,
    audioSrc: ep046.AUDIO_SRC,
    audioDurationInSeconds: ep046.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-047-kubectl-delete-what-to-delete-correctly",
    component: Ep047Reel,
    audioSrc: ep047.AUDIO_SRC,
    audioDurationInSeconds: ep047.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-048-kubectl-edit-emergency-cluster-edits",
    component: Ep048Reel,
    audioSrc: ep048.AUDIO_SRC,
    audioDurationInSeconds: ep048.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-049-kubectl-patch-surgical-changes",
    component: Ep049Reel,
    audioSrc: ep049.AUDIO_SRC,
    audioDurationInSeconds: ep049.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-050-kubectl-diff-preview-changes-before-apply",
    component: Ep050Reel,
    audioSrc: ep050.AUDIO_SRC,
    audioDurationInSeconds: ep050.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-051-kubectl-explain-docs-right-in-the-cli",
    component: Ep051Reel,
    audioSrc: ep051.AUDIO_SRC,
    audioDurationInSeconds: ep051.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-052-kubectl-api-resources-which-resources-exist",
    component: Ep052Reel,
    audioSrc: ep052.AUDIO_SRC,
    audioDurationInSeconds: ep052.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-053-kubectl-get-o-wide-wider-overview",
    component: Ep053Reel,
    audioSrc: ep053.AUDIO_SRC,
    audioDurationInSeconds: ep053.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-054-kubectl-get-pods-a-search-all-namespaces",
    component: Ep054Reel,
    audioSrc: ep054.AUDIO_SRC,
    audioDurationInSeconds: ep054.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-055-kubectl-cp-copy-files-to-and-from-a-pod",
    component: Ep055Reel,
    audioSrc: ep055.AUDIO_SRC,
    audioDurationInSeconds: ep055.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-056-kubectl-wait-waits-in-automation",
    component: Ep056Reel,
    audioSrc: ep056.AUDIO_SRC,
    audioDurationInSeconds: ep056.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-057-mini-routine-5-morning-commands",
    component: Ep057Reel,
    audioSrc: ep057.AUDIO_SRC,
    audioDurationInSeconds: ep057.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-058-how-to-read-the-pod-status-column",
    component: Ep058Reel,
    audioSrc: ep058.AUDIO_SRC,
    audioDurationInSeconds: ep058.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-059-containercreating-vs-pending",
    component: Ep059Reel,
    audioSrc: ep059.AUDIO_SRC,
    audioDurationInSeconds: ep059.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-060-errimagepull-and-imagepullbackoff",
    component: Ep060Reel,
    audioSrc: ep060.AUDIO_SRC,
    audioDurationInSeconds: ep060.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-061-createcontainerconfigerror",
    component: Ep061Reel,
    audioSrc: ep061.AUDIO_SRC,
    audioDurationInSeconds: ep061.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-062-crashloopbackoff-vs-plain-error",
    component: Ep062Reel,
    audioSrc: ep062.AUDIO_SRC,
    audioDurationInSeconds: ep062.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-063-runcontainererror",
    component: Ep063Reel,
    audioSrc: ep063.AUDIO_SRC,
    audioDurationInSeconds: ep063.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-064-job-completed-is-normal",
    component: Ep064Reel,
    audioSrc: ep064.AUDIO_SRC,
    audioDurationInSeconds: ep064.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-065-why-restarts-keeps-growing",
    component: Ep065Reel,
    audioSrc: ep065.AUDIO_SRC,
    audioDurationInSeconds: ep065.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-066-events-vs-logs-what-to-check-first",
    component: Ep066Reel,
    audioSrc: ep066.AUDIO_SRC,
    audioDurationInSeconds: ep066.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-067-kubectl-get-events-sorted-by-time",
    component: Ep067Reel,
    audioSrc: ep067.AUDIO_SRC,
    audioDurationInSeconds: ep067.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-068-kubectl-top-and-metrics-server",
    component: Ep068Reel,
    audioSrc: ep068.AUDIO_SRC,
    audioDurationInSeconds: ep068.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-069-kubectl-debug-and-ephemeral-containers",
    component: Ep069Reel,
    audioSrc: ep069.AUDIO_SRC,
    audioDurationInSeconds: ep069.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-070-breakdown-why-a-pod-is-pending",
    component: Ep070Reel,
    audioSrc: ep070.AUDIO_SRC,
    audioDurationInSeconds: ep070.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-071-breakdown-service-with-no-endpoints",
    component: Ep071Reel,
    audioSrc: ep071.AUDIO_SRC,
    audioDurationInSeconds: ep071.AUDIO_DURATION_SECONDS,
  },
  {
    id: "kubernetes-072-checklist-60-seconds-into-an-incident",
    component: Ep072Reel,
    audioSrc: ep072.AUDIO_SRC,
    audioDurationInSeconds: ep072.AUDIO_DURATION_SECONDS,
  },
];
