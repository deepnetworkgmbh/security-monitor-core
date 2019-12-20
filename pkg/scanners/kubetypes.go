package scanners

type KubeOverview struct {
    Cluster             ClusterSum      `json:"cluster"`
    CheckGroupSummary   []ResultSum     `json:"checkGroupSummary"`
    NamespaceSummary    []ResultSum     `json:"namespaceSummary"`
    CheckResultsSummary ResultSum       `json:"checkResultsSummary"`
    Checks              []Check         `json:"checks"`
}

type Check struct {
    Id               string      `json:"id"`
    GroupName        string      `json:"group"`
    ResourceCategory string      `json:"category"`
    ResourceFullName string      `json:"resourceName"`
    Description      string      `json:"description"`
    Result           CheckResult `json:"result"`
}

type CheckResult string

type ClusterSum struct {
    Name        string      `json:"name"`
    Version     string      `json:"version"`
    Grade       string      `json:"grade"`
    Score       int         `json:"score"`
    Nodes       int         `json:"nodes"`
    Namespaces  int         `json:"namespaces"`
    Pods        int         `json:"pods"`
}

type ResultSum struct {
    Name        string      `json:"resultName"`
    Successes   int         `json:"Successes"`
    Warnings    int         `json:"Warnings"`
    Errors      int         `json:"Errors"`
    NoDatas     int         `json:"NoDatas"`
}