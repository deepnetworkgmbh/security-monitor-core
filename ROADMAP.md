# Roadmap

## Long-term goal

Eventually the project is going to:

- Integrates multiple *scanner/audit* types
  - Container Image vulnerabilities scanners. For example, [trivy](https://github.com/aquasecurity/trivy), [clair](https://github.com/quay/clair).
  - Kubernetes objects validators. For example, [polaris](https://github.com/FairwindsOps/polaris), [cluster-lint](https://github.com/digitalocean/clusterlint).
  - Kubernetes cluster configuration validation. For example, [kube-bench.](https://github.com/aquasecurity/kube-bench)
  - Cloud infrastructure auditors. For example, [az-sk](https://github.com/azsk/DevOpsKit), [scout-suite](https://github.com/nccgroup/ScoutSuite), [security-monkey](https://github.com/Netflix/security_monkey).
  - Web application scanners. For example, [ZAProxy](https://github.com/zaproxy/zaproxy)

- Historical data
  - Persisting all scan results according to a defined retention period
  - Providing read interface to historical data

- Supports real-time configuration
  - enable/disable security check:
    - for the whole solution
    - for a subset of objects (tolerations) based on scanned object metadata
  - creating new security checks (maybe, [Open Policy Agent](https://www.openpolicyagent.org/) integration)
  - enable/disable scanner types (image, k8s-objects, k8s, cloud)
  - RBAC

- Reporting
  - send reports via email, webhooks, slack, ms-teams, and others.
  - multiple report types:
    - the current state of the system,
    - diff from the last report
  - expose a subset of data as metrics (well-known grafana dashboards, alerting)

- Create follow-up tasks based on checks results
  - Jira/Azure DevOps tasks
  - emails/slack/...

- User Interface to visualize and configure the solution.

## Iteration 1

**The main goal**: Add new scanner/audit types.

Display *isolated* kubernetes audit results at separate url path:

- `/kube-cluster` - the result from `kube-bench` scanner run [The issue #6](https://github.com/deepnetworkgmbh/security-monitor-core/issues/6);
- `/kube-objects` - the result of `polaris` audit [The issue #7](https://github.com/deepnetworkgmbh/security-monitor-core/issues/7);
- `/images` - the summary of all used docker-images vulnerabilities scan [The issue #3](https://github.com/deepnetworkgmbh/security-monitor-core/issues/3);
- `/image/{image-tag}` - a single image vulnerabilities scan details. [The issue #2](https://github.com/deepnetworkgmbh/security-monitor-core/issues/2);
- `/cve/{id}` - a single CVE detailed description [The issue #8](https://github.com/deepnetworkgmbh/security-monitor-core/issues/8);
- `/azure` - the result of `az-sk` audit [The issue #9](https://github.com/deepnetworkgmbh/security-monitor-core/issues/9).

## Iteration 2

**The main goal**: Reporting, historical data, scheduler

- Send current-state reports via email;
- Historical data querying;
- Scheduled audits.
