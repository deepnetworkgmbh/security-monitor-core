// Copyright 2019 FairwindsOps Inc
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package scanners

import (
	corev1 "k8s.io/api/core/v1"
)

// AuditData contains all the data from a full Polaris audit
type AuditData struct {
	PolarisOutputVersion string
	AuditTime            string
	SourceType           string
	SourceName           string
	DisplayName          string
	ClusterSummary       ClusterSummary
	NamespacedResults    NamespacedResults
	ScanResults          ScansSummary
}

// ClusterSummary contains Polaris results as well as some high-level stats
type ClusterSummary struct {
	Results                ResultSummary
	Version                string
	Nodes                  int
	Pods                   int
	Namespaces             int
	Deployments            int
	StatefulSets           int
	DaemonSets             int
	Jobs                   int
	CronJobs               int
	ReplicationControllers int
	Score                  uint
}

// MessageType represents the type of Message
type MessageType string

const (
	// MessageTypeNoData indicates no validation data
	MessageTypeNoData MessageType = "nodata"

	// MessageTypeSuccess indicates a validation success
	MessageTypeSuccess MessageType = "success"

	// MessageTypeWarning indicates a validation warning
	MessageTypeWarning MessageType = "warning"

	// MessageTypeError indicates a validation error
	MessageTypeError MessageType = "error"
)

// NamespaceResult groups container results by parent resource.
type NamespaceResult struct {
	Name    string
	Summary *ResultSummary

	// TODO: This struct could use some love to reorganize it as just having "results"
	//       and then having methods to return filtered results by type
	//       (deploy, daemonset, etc)
	//       The way this is structured right now makes it difficult to add
	//       additional result types and potentially miss things in the metrics
	//       summary.
	DeploymentResults            []ControllerResult
	StatefulSetResults           []ControllerResult
	DaemonSetResults             []ControllerResult
	JobResults                   []ControllerResult
	CronJobResults               []ControllerResult
	ReplicationControllerResults []ControllerResult
}

// NamespacedResults is a mapping of namespace name to the validation results.
type NamespacedResults map[string]*NamespaceResult

// CountSummary provides a high level overview of success, warnings, and errors.
type CountSummary struct {
	Successes uint
	Warnings  uint
	Errors    uint
}

// GetScore returns an overall score in [0, 100] for the CountSummary
func (cs *CountSummary) GetScore() uint {
	total := (cs.Successes * 2) + cs.Warnings + (cs.Errors * 2)
	if total == 0 {
		return 100
	}
	return uint((float64(cs.Successes*2) / float64(total)) * 100)
}

// CategorySummary provides a map from category name to a CountSummary
type CategorySummary map[string]*CountSummary

// ResultSummary provides a high level overview of success, warnings, and errors.
type ResultSummary struct {
	Totals     CountSummary
	ByCategory CategorySummary
}

// ScansMap provides a map from image name to a scan result
type ScansMap map[string]ImageScanResultSummary

// ScansSummary provides a high level overview of container images scan results.
type ScansSummary struct {
	Scans     ScansMap
	NoData    uint
	Successes uint
	Warnings  uint
	Errors    uint
}

// GetScore returns an overall score in [0, 100] for the ScansSummary
func (summary *ScansSummary) GetScore() uint {
	total := (summary.Successes+summary.NoData)*2 + summary.Warnings + (summary.Errors * 2)
	if total == 0 {
		return 100
	}
	return uint((float64(summary.Successes+summary.NoData) * 2 / float64(total)) * 100)
}

// GetAllControllerResults grabs all the different types of controller results from the namespaced result as a single list for easier iteration
func (n NamespaceResult) GetAllControllerResults() []ControllerResult {
	all := []ControllerResult{}
	all = append(all, n.DeploymentResults...)
	all = append(all, n.StatefulSetResults...)
	all = append(all, n.DaemonSetResults...)
	all = append(all, n.JobResults...)
	all = append(all, n.CronJobResults...)
	all = append(all, n.ReplicationControllerResults...)

	return all
}

// ControllerResult provides a wrapper around a PodResult
type ControllerResult struct {
	Name      string
	Type      string
	PodResult PodResult
}

// ContainerResult provides a list of validation messages for each container.
type ContainerResult struct {
	Name        string
	Image       string
	Messages    []*ResultMessage
	Summary     *ResultSummary
	ScanSummary ImageScanResultSummary
}

// PodResult provides a list of validation messages for each pod.
type PodResult struct {
	Name             string
	Summary          *ResultSummary
	Messages         []*ResultMessage
	ContainerResults []ContainerResult
	podSpec          corev1.PodSpec
}

// ResultMessage contains a message and a type indicator (success, warning, or error).
type ResultMessage struct {
	ID       string
	Message  string
	Type     MessageType
	Category string
}