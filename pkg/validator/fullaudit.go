package validator

import (
	"time"

	conf "github.com/deepnetworkgmbh/security-monitor-core/pkg/config"
	"github.com/deepnetworkgmbh/security-monitor-core/pkg/kube"
	"github.com/deepnetworkgmbh/security-monitor-core/pkg/scanner"
)

// RunAudit runs a full Polaris audit and returns an AuditData object
func RunAudit(config conf.Configuration, kubeResources *kube.ResourceProvider) (AuditData, error) {
	kubeScanner := scanner.NewScanner(config.Images.ScannerUrl)
	go kubeScanner.Scan(kubeResources.GetAllImageTags())

	scans, _ := kubeScanner.GetAll(kubeResources.GetAllImageTags())

	scanResults := ScansSummary{}
	scanResults.calculateResults(scans)

	nsResults := NamespacedResults{}
	ValidateControllers(config, kubeResources, &nsResults, &scanResults)

	clusterResults := ResultSummary{}

	// Aggregate all summary counts to get a clusterwide count
	for _, result := range nsResults.GetAllControllerResults() {
		clusterResults.appendResults(*result.PodResult.Summary)
	}

	displayName := config.DisplayName
	if displayName == "" {
		displayName = kubeResources.SourceName
	}

	auditData := AuditData{
		PolarisOutputVersion: PolarisOutputVersion,
		AuditTime:            kubeResources.CreationTime.Format(time.RFC3339),
		SourceType:           kubeResources.SourceType,
		SourceName:           kubeResources.SourceName,
		DisplayName:          displayName,
		ClusterSummary: ClusterSummary{
			Version:                kubeResources.ServerVersion,
			Nodes:                  len(kubeResources.Nodes),
			Pods:                   len(kubeResources.Pods),
			Namespaces:             len(kubeResources.Namespaces),
			Deployments:            len(kubeResources.Deployments),
			StatefulSets:           len(kubeResources.StatefulSets),
			DaemonSets:             len(kubeResources.DaemonSets),
			Jobs:                   len(kubeResources.Jobs),
			CronJobs:               len(kubeResources.CronJobs),
			ReplicationControllers: len(kubeResources.ReplicationControllers),
			Results:                clusterResults,
			Score:                  clusterResults.Totals.GetScore(),
		},
		NamespacedResults: nsResults,
		ScanResults:       scanResults,
	}
	return auditData, nil
}
