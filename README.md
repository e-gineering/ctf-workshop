# CTF Workshop

A fully automated CTF (Capture The Flag) workshop platform powered by [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/) and [Multi-Juicer](https://github.com/juice-shop/multi-juicer), deployed on Azure Kubernetes Service using Infrastructure as Code.

## Overview

This repository provides a complete, production-ready setup for running security training workshops and CTF competitions. It leverages:

- **OWASP Juice Shop** - A deliberately insecure web application for security training
- **Multi-Juicer** - Platform for running multiple isolated Juice Shop instances
- **Azure Kubernetes Service (AKS)** - Managed Kubernetes hosting
- **CDKTF** - Infrastructure as Code using TypeScript
- **Flux** - GitOps continuous delivery
- **Cert-Manager** - Automated TLS certificate management
- **NGINX Ingress** - HTTP/HTTPS routing

**Live Instance:** https://ctf.silly.hair/balancer/score-board/

## Features

- Supports up to 20 concurrent Juice Shop instances
- Auto-scaling AKS cluster (1-10 nodes)
- Automatic TLS certificates via Let's Encrypt
- GitOps-based deployment with Flux
- Automatic cleanup of unused instances after 7 days
- Built-in metrics and monitoring support
- CTF scoreboard and team management

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Azure Subscription                                 │
│  ┌───────────────────────────────────────────────┐  │
│  │  Resource Group: juice-shop-workshop          │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │  AKS Cluster (Kubernetes 1.27.7)        │  │  │
│  │  │  ┌───────────────────────────────────┐  │  │  │
│  │  │  │  Flux (GitOps)                    │  │  │  │
│  │  │  │  ├─ Cert-Manager                  │  │  │  │
│  │  │  │  ├─ NGINX Ingress                 │  │  │  │
│  │  │  │  └─ Multi-Juicer                  │  │  │  │
│  │  │  │     ├─ Balancer (Team Management) │  │  │  │
│  │  │  │     └─ Juice Shop Instances (20x) │  │  │  │
│  │  │  └───────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Prerequisites

- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- [Node.js](https://nodejs.org/) (>= 16.0)
- [npm](https://www.npmjs.com/)
- Azure subscription with appropriate permissions
- [kubectl](https://kubernetes.io/docs/tasks/tools/) (for cluster management)

## Quick Start

### 1. Azure Authentication

```bash
# Login to Azure
az login

# List available subscriptions
az account list

# Set the target subscription
az account set --subscription <subscription-id>

# Verify the active subscription
az account show
```

### 2. Deploy Infrastructure

```bash
# Navigate to CDKTF directory
cd cdktf

# Install dependencies
npm install

# Initialize CDKTF (first time only)
npx cdktf-cli init --template typescript

# Deploy the infrastructure
npm run deploy
```

This will provision:
- Azure Resource Group
- Virtual Network (10.10.0.0/20)
- AKS Cluster with auto-scaling
- Flux GitOps extension
- Flux configuration pointing to this repository

### 3. Configure kubectl

```bash
# Get AKS credentials
az aks get-credentials --resource-group juice-shop-workshop --name juice-shop-workshop

# Verify cluster access
kubectl get nodes
```

### 4. Monitor Deployment

Flux will automatically deploy all applications defined in the `flux/` directory:

```bash
# Watch Flux synchronization
kubectl get kustomizations -n flux-system -w

# Check Multi-Juicer deployment
kubectl get pods -n default

# View all Helm releases
kubectl get helmreleases -n flux-system
```

## Application Access

Once deployed, the workshop is accessible at:

- **Balancer/Scoreboard:** https://ctf.silly.hair/balancer/score-board/
- **Team Registration:** https://ctf.silly.hair/

Participants can create teams and receive their own isolated Juice Shop instance.

## Configuration

### Multi-Juicer Settings

Edit `flux/apps/multi-juicer.yaml` to customize:

- Maximum instances
- Resource limits
- CTF settings
- Cleanup policies
- Ingress domain

### Infrastructure Settings

Edit `cdktf/main.ts` to modify:

- Kubernetes version
- Node pool size (min/max)
- VM size
- Network configuration
- Location/region

After making changes, run `npm run deploy` from the `cdktf` directory.

## Runbook

### Restart a Juice Shop Instance

If a participant's instance becomes unresponsive:

```bash
# List all Juice Shop pods
kubectl get pods | grep juiceshop

# Delete the problematic pod (it will be automatically recreated)
kubectl delete pod <pod-name>
```

### View Logs

```bash
# Multi-Juicer balancer logs
kubectl logs -l app.kubernetes.io/name=multi-juicer-balancer -f

# Specific Juice Shop instance logs
kubectl logs <juiceshop-pod-name> -f
```

### Scale the Cluster

The cluster auto-scales between 1-10 nodes based on demand. To modify:

```bash
# Edit cdktf/main.ts and update:
# minCount: 1
# maxCount: 10

# Then redeploy
cd cdktf && npm run deploy
```

### Force Flux Reconciliation

```bash
# Trigger immediate reconciliation
flux reconcile kustomization flux --with-source

# Reconcile specific Helm release
flux reconcile helmrelease multi-juicer -n flux-system
```

### Update Multi-Juicer Version

Edit `flux/apps/multi-juicer.yaml` and update the version:

```yaml
version: "7.2.2"  # Update this
```

Commit and push. Flux will automatically apply the update.

## Monitoring and Metrics

Multi-Juicer includes built-in metrics support. Dashboards are automatically created for Grafana integration.

```bash
# View metrics endpoint
kubectl port-forward svc/multi-juicer-balancer 9090:9090
```

## Cleanup

To destroy all resources:

```bash
cd cdktf
npm run destroy
```

**Warning:** This will delete the entire AKS cluster and all associated resources.

## Resources

- [OWASP Juice Shop Documentation](https://pwning.owasp-juice.shop/)
- [Trainer's Guide](https://pwning.owasp-juice.shop/appendix/trainers.html)
- [Multi-Juicer GitHub](https://github.com/juice-shop/multi-juicer)
- [Flux Documentation](https://fluxcd.io/docs/)
- [CDKTF Documentation](https://developer.hashicorp.com/terraform/cdktf)

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status and events
kubectl describe pod <pod-name>

# Check resource availability
kubectl top nodes
```

### Certificate Issues

```bash
# Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager -f

# Verify certificate status
kubectl get certificates -A
```

### Flux Not Syncing

```bash
# Check Flux status
flux get all

# View Flux logs
kubectl logs -n flux-system -l app=source-controller -f
```

## Contributing

This infrastructure is managed through GitOps. To make changes:

1. Create a feature branch
2. Modify configurations in `flux/` or `cdktf/`
3. Create a pull request
4. After merge to `main`, Flux will automatically apply changes

## License

This project is licensed under the MPL-2.0 License.
