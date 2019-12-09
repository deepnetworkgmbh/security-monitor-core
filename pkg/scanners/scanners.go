package scanners

import (
	"encoding/json"
	"fmt"
	"github.com/sirupsen/logrus"
	"net/http"
	"net/url"
)

// Scanners base struct
type Scanners struct {
	ServiceURL string
}

// NewScanners returns a new scanner instance.
func NewScanners(url string) *Scanners {
	return &Scanners{ServiceURL: url}
}

// GetKubeObjectsAudit returns Kube Audit result
func (s *Scanners) GetKubeObjectsAudit() (auditData AuditData, err error) {
	auditResultURL := fmt.Sprintf("%s/", s.ServiceURL)

	resp, err := http.Get(auditResultURL)
	if err != nil {
		logrus.Errorf("Error requesting kube audit data %v", err)
		return
	}

	defer resp.Body.Close()

	json.NewDecoder(resp.Body).Decode(&auditData)

	return
}

// GetImageScanResult returns detailed single image scan result
func (s *Scanners) GetImageScanResult(image string) (scanResult ImageScanResult, err error) {
	scanResultURL := fmt.Sprintf("%s/image/%s", s.ServiceURL, url.QueryEscape(image))

	resp, err := http.Get(scanResultURL)
	if err != nil {
		logrus.Errorf("Error requesting image scan result %v", err)
		return
	}

	defer resp.Body.Close()

	json.NewDecoder(resp.Body).Decode(&scanResult)

	return
}
