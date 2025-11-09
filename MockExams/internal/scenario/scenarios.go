package scenario

import (
	"context"
	"fmt"

	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

const (
	namespaceScenarioID   = "namespace-basic"
	namespaceScenarioName = "mockexams-namespace"

	podScenarioID        = "pod-basic"
	podScenarioNamespace = "mockexams-pod"
	podScenarioName      = "web-pod"
	podScenarioImage     = "nginx:1.25.3"

	replicaSetScenarioID        = "replicaset-basic"
	replicaSetScenarioNamespace = "mockexams-replicaset"
	replicaSetScenarioName      = "web-rs"
	replicaSetScenarioReplicas  = int32(2)

	deploymentScenarioID        = "deployment-basic"
	deploymentScenarioNamespace = "mockexams-deployment"
	deploymentScenarioName      = "web-deploy"
	deploymentScenarioReplicas  = int32(3)
	deploymentScenarioImage     = "nginx:1.25.3"
)

func registerDefaultScenarios(m *Manager) {
	m.Register(namespaceScenario())
	m.Register(podScenario())
	m.Register(replicaSetScenario())
	m.Register(deploymentScenario())
}

func namespaceScenario() *Scenario {
	return &Scenario{
		ID:          namespaceScenarioID,
		Title:       "Namespace creation",
		Description: fmt.Sprintf("Создайте namespace `%s`.", namespaceScenarioName),
		SetupFunc: func(ctx context.Context) error {
			client, err := getClientset()
			if err != nil {
				return err
			}
			return deleteNamespace(ctx, client, namespaceScenarioName)
		},
		CheckFunc: func(ctx context.Context) ([]CheckResult, error) {
			client, err := getClientset()
			if err != nil {
				return nil, err
			}
			ns, err := client.CoreV1().Namespaces().Get(ctx, namespaceScenarioName, metav1.GetOptions{})
			if apierrors.IsNotFound(err) {
				return []CheckResult{{
					Name:    "namespace-exists",
					Passed:  false,
					Message: "Namespace не найден. Создайте его командой kubectl.",
				}}, nil
			}
			if err != nil {
				return nil, err
			}
			return []CheckResult{{
				Name:    "namespace-exists",
				Passed:  true,
				Message: fmt.Sprintf("Namespace найден. Status=%s", ns.Status.Phase),
			}}, nil
		},
		ResetFunc: func(ctx context.Context) error {
			client, err := getClientset()
			if err != nil {
				return err
			}
			return deleteNamespace(ctx, client, namespaceScenarioName)
		},
	}
}

func podScenario() *Scenario {
	return &Scenario{
		ID:          podScenarioID,
		Title:       "Pod creation",
		Description: fmt.Sprintf("В namespace `%s` создайте pod `%s` с образом `%s`.", podScenarioNamespace, podScenarioName, podScenarioImage),
		SetupFunc: func(ctx context.Context) error {
			client, err := getClientset()
			if err != nil {
				return err
			}
			if err := ensureNamespace(ctx, client, podScenarioNamespace); err != nil {
				return err
			}
			return deletePod(ctx, client, podScenarioNamespace, podScenarioName)
		},
		CheckFunc: func(ctx context.Context) ([]CheckResult, error) {
			client, err := getClientset()
			if err != nil {
				return nil, err
			}
			pod, err := client.CoreV1().Pods(podScenarioNamespace).Get(ctx, podScenarioName, metav1.GetOptions{})
			if apierrors.IsNotFound(err) {
				return []CheckResult{{
					Name:    "pod-exists",
					Passed:  false,
					Message: "Pod не найден. Создайте его в указанном namespace.",
				}}, nil
			}
			if err != nil {
				return nil, err
			}

			results := []CheckResult{
				{
					Name:    "pod-exists",
					Passed:  true,
					Message: "Pod найден.",
				},
			}

			imageCheck := CheckResult{
				Name:   "container-image",
				Passed: false,
			}
			for _, c := range pod.Spec.Containers {
				if c.Image == podScenarioImage {
					imageCheck.Passed = true
					imageCheck.Message = fmt.Sprintf("Контейнер %s использует требуемый образ.", c.Name)
					break
				}
			}
			if !imageCheck.Passed {
				imageCheck.Message = fmt.Sprintf("Требуется образ %s.", podScenarioImage)
			}
			results = append(results, imageCheck)

			statusCheck := CheckResult{
				Name:   "pod-running",
				Passed: pod.Status.Phase == corev1.PodRunning,
			}
			if statusCheck.Passed {
				statusCheck.Message = "Pod находится в состоянии Running."
			} else {
				statusCheck.Message = fmt.Sprintf("Текущий статус pod: %s.", pod.Status.Phase)
			}
			results = append(results, statusCheck)

			return results, nil
		},
		ResetFunc: func(ctx context.Context) error {
			client, err := getClientset()
			if err != nil {
				return err
			}
			return deletePod(ctx, client, podScenarioNamespace, podScenarioName)
		},
	}
}

func replicaSetScenario() *Scenario {
	return &Scenario{
		ID:          replicaSetScenarioID,
		Title:       "ReplicaSet creation",
		Description: fmt.Sprintf("В namespace `%s` создайте ReplicaSet `%s` с %d репликами nginx.", replicaSetScenarioNamespace, replicaSetScenarioName, replicaSetScenarioReplicas),
		SetupFunc: func(ctx context.Context) error {
			client, err := getClientset()
			if err != nil {
				return err
			}
			if err := ensureNamespace(ctx, client, replicaSetScenarioNamespace); err != nil {
				return err
			}
			return deleteReplicaSet(ctx, client, replicaSetScenarioNamespace, replicaSetScenarioName)
		},
		CheckFunc: func(ctx context.Context) ([]CheckResult, error) {
			client, err := getClientset()
			if err != nil {
				return nil, err
			}
			rs, err := client.AppsV1().ReplicaSets(replicaSetScenarioNamespace).Get(ctx, replicaSetScenarioName, metav1.GetOptions{})
			if apierrors.IsNotFound(err) {
				return []CheckResult{{
					Name:    "replicaset-exists",
					Passed:  false,
					Message: "ReplicaSet не найден. Создайте ресурс с требуемым именем.",
				}}, nil
			}
			if err != nil {
				return nil, err
			}

			results := []CheckResult{
				{
					Name:    "replicaset-exists",
					Passed:  true,
					Message: "ReplicaSet найден.",
				},
			}

			specCount := int32(0)
			if rs.Spec.Replicas != nil {
				specCount = *rs.Spec.Replicas
			}
			replicasMatch := CheckResult{
				Name:    "replicaset-spec-replicas",
				Passed:  specCount == replicaSetScenarioReplicas,
				Message: fmt.Sprintf("Ожидается %d реплик, указано %d.", replicaSetScenarioReplicas, specCount),
			}
			if replicasMatch.Passed {
				replicasMatch.Message = fmt.Sprintf("ReplicaSet настроен на %d реплик.", specCount)
			}
			results = append(results, replicasMatch)

			ready := rs.Status.ReadyReplicas
			readyCheck := CheckResult{
				Name:    "replicaset-ready-replicas",
				Passed:  ready >= replicaSetScenarioReplicas,
				Message: fmt.Sprintf("Готово %d из %d реплик.", ready, replicaSetScenarioReplicas),
			}
			if readyCheck.Passed {
				readyCheck.Message = fmt.Sprintf("Готово %d реплик.", ready)
			}
			results = append(results, readyCheck)

			return results, nil
		},
		ResetFunc: func(ctx context.Context) error {
			client, err := getClientset()
			if err != nil {
				return err
			}
			return deleteReplicaSet(ctx, client, replicaSetScenarioNamespace, replicaSetScenarioName)
		},
	}
}

func deploymentScenario() *Scenario {
	return &Scenario{
		ID:          deploymentScenarioID,
		Title:       "Deployment creation",
		Description: fmt.Sprintf("В namespace `%s` создайте Deployment `%s` с %d репликами образа `%s`.", deploymentScenarioNamespace, deploymentScenarioName, deploymentScenarioReplicas, deploymentScenarioImage),
		SetupFunc: func(ctx context.Context) error {
			client, err := getClientset()
			if err != nil {
				return err
			}
			if err := ensureNamespace(ctx, client, deploymentScenarioNamespace); err != nil {
				return err
			}
			return deleteDeployment(ctx, client, deploymentScenarioNamespace, deploymentScenarioName)
		},
		CheckFunc: func(ctx context.Context) ([]CheckResult, error) {
			client, err := getClientset()
			if err != nil {
				return nil, err
			}
			deploy, err := client.AppsV1().Deployments(deploymentScenarioNamespace).Get(ctx, deploymentScenarioName, metav1.GetOptions{})
			if apierrors.IsNotFound(err) {
				return []CheckResult{{
					Name:    "deployment-exists",
					Passed:  false,
					Message: "Deployment не найден. Создайте ресурс с указанным именем.",
				}}, nil
			}
			if err != nil {
				return nil, err
			}

			results := []CheckResult{
				{
					Name:    "deployment-exists",
					Passed:  true,
					Message: "Deployment найден.",
				},
			}

			specReplicas := int32(1)
			if deploy.Spec.Replicas != nil {
				specReplicas = *deploy.Spec.Replicas
			}
			replicaCheck := CheckResult{
				Name:    "deployment-spec-replicas",
				Passed:  specReplicas == deploymentScenarioReplicas,
				Message: fmt.Sprintf("Ожидается %d реплик, указано %d.", deploymentScenarioReplicas, specReplicas),
			}
			if replicaCheck.Passed {
				replicaCheck.Message = fmt.Sprintf("Deployment настроен на %d реплик.", specReplicas)
			}
			results = append(results, replicaCheck)

			imageCheck := CheckResult{
				Name:   "deployment-image",
				Passed: false,
			}
			containers := deploy.Spec.Template.Spec.Containers
			for _, c := range containers {
				if c.Image == deploymentScenarioImage {
					imageCheck.Passed = true
					imageCheck.Message = fmt.Sprintf("Контейнер %s использует образ %s.", c.Name, deploymentScenarioImage)
					break
				}
			}
			if !imageCheck.Passed {
				imageCheck.Message = fmt.Sprintf("Deployment должен использовать образ %s.", deploymentScenarioImage)
			}
			results = append(results, imageCheck)

			ready := deploy.Status.ReadyReplicas
			readyCheck := CheckResult{
				Name:    "deployment-ready-replicas",
				Passed:  ready >= deploymentScenarioReplicas,
				Message: fmt.Sprintf("Готово %d из %d реплик.", ready, deploymentScenarioReplicas),
			}
			if readyCheck.Passed {
				readyCheck.Message = fmt.Sprintf("Готово %d реплик.", ready)
			}
			results = append(results, readyCheck)

			return results, nil
		},
		ResetFunc: func(ctx context.Context) error {
			client, err := getClientset()
			if err != nil {
				return err
			}
			return deleteDeployment(ctx, client, deploymentScenarioNamespace, deploymentScenarioName)
		},
	}
}

