package main

import (
	"flag"
	"fmt"
	"net/http"
	"os"

	conf "github.com/deepnetworkgmbh/security-monitor-core/pkg/config"
	"github.com/deepnetworkgmbh/security-monitor-core/pkg/dashboard"
	"github.com/sirupsen/logrus"
	_ "k8s.io/client-go/plugin/pkg/client/auth" // Required for other auth providers like GKE.
)

const (
	// Version represents the current release version of Security Monitor
	Version = "0.1.0"
)

func main() {
	// Load CLI Flags
	dashboardPort := flag.Int("dashboard-port", 8080, "Port for the dashboard webserver")
	dashboardBasePath := flag.String("dashboard-base-path", "/", "Path on which the dashboard is served")
	configPath := flag.String("config", "", "Location of dashboard configuration file")
	logLevel := flag.String("log-level", logrus.InfoLevel.String(), "Logrus log level")
	version := flag.Bool("version", false, "Prints the version of Security Monitor")

	flag.Parse()

	if *version {
		fmt.Printf("Security Monitor version %s\n", Version)
		os.Exit(0)
	}

	parsedLevel, err := logrus.ParseLevel(*logLevel)
	if err != nil {
		logrus.Errorf("log-level flag has invalid value %s", *logLevel)
	} else {
		logrus.SetLevel(parsedLevel)
	}

	c, err := conf.ParseFile(*configPath)
	if err != nil {
		logrus.Errorf("Error parsing config at %s: %v", *configPath, err)
		os.Exit(1)
	}

	startDashboardServer(c, *dashboardPort, *dashboardBasePath)
}

func startDashboardServer(c conf.Configuration, port int, basePath string) {
	router := dashboard.GetRouter(c, port, basePath)

	srv := &http.Server{
		Handler: router,
		Addr:    fmt.Sprintf(":%d", port),
	}

	logrus.Infof("Starting Security Monitor dashboard on port %d", port)
	logrus.Fatal(srv.ListenAndServe())
}
