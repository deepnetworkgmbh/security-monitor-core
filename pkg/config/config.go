package config

import (
	"bytes"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"strings"

	packr "github.com/gobuffalo/packr/v2"
	"k8s.io/apimachinery/pkg/util/yaml"
)

// Configuration contains all of the config for the validation checks.
type Configuration struct {
	DisplayName string   `json:"displayName"`
	Services    Services `json:"services"`
}

// Services represents addresses of used external services
type Services struct {
	ScannersUrl string `json:"scannersUrl"`
}

// ParseFile parses config from a file.
func ParseFile(path string) (Configuration, error) {
	var rawBytes []byte
	var err error
	if path == "" {
		configBox := packr.New("Config", "../../examples")
		rawBytes, err = configBox.Find("config.yaml")
	} else if strings.HasPrefix(path, "https://") || strings.HasPrefix(path, "http://") {
		//path is a url
		response, err2 := http.Get(path)
		if err2 != nil {
			return Configuration{}, err2
		}
		rawBytes, err = ioutil.ReadAll(response.Body)
	} else {
		//path is local
		rawBytes, err = ioutil.ReadFile(path)
	}
	if err != nil {
		return Configuration{}, err
	}
	return Parse(rawBytes)
}

// Parse parses config from a byte array.
func Parse(rawBytes []byte) (Configuration, error) {
	reader := bytes.NewReader(rawBytes)
	conf := Configuration{}
	d := yaml.NewYAMLOrJSONDecoder(reader, 4096)
	for {
		if err := d.Decode(&conf); err != nil {
			if err == io.EOF {
				return conf, nil
			}
			return conf, fmt.Errorf("Decoding config failed: %v", err)
		}
	}
}
