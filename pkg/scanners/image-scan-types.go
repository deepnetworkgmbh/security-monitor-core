package scanners

// ImageScanResult contains details about all the found vulnerabilities
type ImageScanResult struct {
	Image       string            `json:"image"`
	ScanResult  string            `json:"scanResult"`
	Description string            `json:"description"`
	Targets     []TrivyScanTarget `json:"targets"`
}

type TrivyScanTarget struct {
	Target          string                     `json:"Target"`
	Vulnerabilities []VulnerabilityDescription `json:"Vulnerabilities"`
}

type VulnerabilityDescription struct {
	CVE              string   `json:"VulnerabilityID"`
	Package          string   `json:"PkgName"`
	InstalledVersion string   `json:"InstalledVersion"`
	FixedVersion     string   `json:"FixedVersion"`
	Title            string   `json:"Title"`
	Description      string   `json:"Description"`
	Severity         string   `json:"Severity"`
	References       []string `json:"References"`
}

// ImageScanResultSummary contains vulnerabilities summary
type ImageScanResultSummary struct {
	Image       string                 `json:"image"`
	ScanResult  string                 `json:"scanResult"`
	Description string                 `json:"description"`
	Counters    []VulnerabilityCounter `json:"counters"`
}

// VulnerabilityCounter represents amount of issues with specified severity
type VulnerabilityCounter struct {
	Severity string `json:"severity"`
	Count    int    `json:"count"`
}
