package dashboard

import (
	"github.com/deepnetworkgmbh/security-monitor-core/pkg/config"
	"github.com/deepnetworkgmbh/security-monitor-core/pkg/scanners"
	"html/template"
	"strings"
)

// templateData is passed to the dashboard HTML template
type templateData struct {
	BasePath  string
	Config    config.Configuration
	AuditData scanners.AuditData
	JSON      template.JS
}

// scanTemplateData is passed to the image-scan-details HTML template
type scanTemplateData struct {
	BasePath    string
	Config      config.Configuration
	ImageTag    string
	ScanResult  string
	Description string
	UsedIn      []imageUsage
	ScanTargets []imageScanTarget
}

type scanOverviewData struct {
	BasePath     string
	Config       config.Configuration
	Results      []scanners.ContainerImageScanResult
	ImagesGroups []ImagesGroup
	JSON         template.JS
}

type kubeOverviewData struct {
	BasePath     string
	Config       config.Configuration

	Cluster             scanners.ClusterSum  	 `json:"cluster"`
	CheckGroupSummary   []scanners.ResultSum 	 `json:"checkGroupSummary"`
	NamespaceSummary    []scanners.ResultSum	 `json:"namespaceSummary"`
	CheckResultsSummary scanners.ResultSum		 `json:"checkResultsSummary"`
	Checks              []scanners.Check         `json:"checks"`

	JSON         template.JS
}

type ImagesGroup struct {
	Count       int
	Title       string
	Description string
}

type imageUsage struct {

}

type imageScanTarget struct {
	Name string
	VulnerabilitiesGroups []vulnerabilitiesGroup
}

type vulnerabilitiesGroup struct {
	Severity string
	Count int
	CVEs []cveDetails
}

type cveDetails struct {
	Id               string
	PackageName      string
	InstalledVersion string
	FixedVersion     string
	Title            string
	Description      string
	References       []string
}

type bySeverity []string

func (s bySeverity) Len() int {
	return len(s)
}
func (s bySeverity) Swap(i, j int) {
	s[i], s[j] = s[j], s[i]
}
func (s bySeverity) Less(i, j int) bool {
	return severityWeigh(s[i]) < severityWeigh(s[j])
}

func severityWeigh(s string) int {
	switch strings.ToUpper(s) {
	case "CRITICAL":
		return 0
	case "HIGH":
		return 20
	case "MEDIUM":
		return 40
	case "LOW":
		return 60
	case "UNKNOWN":
		return 80
	default:
		return 1000
	}
}

func calculateImageSummaries(scanResults []scanners.ContainerImageScanResult) []ImagesGroup {
	// array to enforce ordering
	counters := [4]int{0, 0, 0, 0}

	for _, s := range scanResults {
		switch s.ScanResult {
		case "Succeeded":
			if len(s.Counters) != 0 {
				isCritical := false;
				for _, counter := range s.Counters {
					if counter.Severity == "CRITICAL" || counter.Severity == "HIGH" {
						isCritical = true
						break
					}
				}

				if isCritical {
					counters[0]++
				} else {
					counters[1]++
				}
			} else {
				counters[2]++
			}
		default:
			counters[3]++
		}
	}

	result := make([]ImagesGroup, 0)

	if counters[0] > 0 {
		result = append(result, ImagesGroup{
			Count:       counters[0],
			Title:       "CRITICAL",
			Description: "with critical/high severity issues",
		})
	}
	if counters[1] > 0 {
		result = append(result, ImagesGroup{
			Count:       counters[1],
			Title:       "MEDIUM",
			Description: "with medium/low severity issues",
		})
	}
	if counters[2] > 0 {
		result = append(result, ImagesGroup{
			Count:       counters[2],
			Title:       "NOISSUES",
			Description: "without issues",
		})
	}
	if counters[3] > 0 {
		result = append(result, ImagesGroup{
			Count:       counters[3],
			Title:       "NODATA",
			Description: "no data",
		})
	}

	return result
}