# CTF Workshop

A Capture The Flag (CTF) workshop environment based on OWASP Juice Shop, deployed on Azure Kubernetes Service (AKS) using infrastructure as code and GitOps principles.

## Overview

This repository provides a complete environment for running OWASP Juice Shop CTF workshops using Multi-Juicer, which allows multiple participants to have isolated Juice Shop instances while sharing a single Kubernetes cluster.

**Live Instance**: https://ctf.silly.hair/balancer/score-board/

## Architecture

- **Infrastructure**: Azure Kubernetes Service (AKS) provisioned via CDKTF (Cloud Development Kit for Terraform)
- **Deployment**: GitOps with Flux CD for automated deployments
- **Application**: Multi-Juicer managing multiple OWASP Juice Shop instances
- **Networking**: Azure Virtual Network with ingress-nginx and cert-manager for TLS
- **Monitoring**: Pixie for observability and Weave GitOps for cluster management

## Components

### Infrastructure (CDKTF)
- **Resource Group**: `juice-shop-workshop` in East US
- **Virtual Network**: 10.10.0.0/20 address space
- **AKS Cluster**: Auto-scaling (1-10 nodes) with Standard_B2s_v2 VMs
- **Flux Extension**: Automated GitOps deployment

### Applications (Flux)
- **Multi-Juicer**: Manages up to 20 isolated Juice Shop instances
- **OWASP Juice Shop**: v15.1.0 with CTF-friendly configuration
- **cert-manager**: Automated TLS certificate management with Let's Encrypt
- **ingress-nginx**: Ingress controller for external access
- **Weave GitOps**: GitOps dashboard for cluster management
- **Pixie**: Kubernetes observability platform

## Prerequisites

- Azure CLI (`az`)
- Node.js >= 16.0
- CDKTF CLI
- kubectl
- Access to an Azure subscription

## Setup

### 1. Configure Azure CLI

```bash
# List available Azure accounts
az account list

# Select your subscription
az account set --subscription <subscription-id>

# Verify the active subscription
az account show
```

### 2. Deploy Infrastructure

```bash
cd cdktf

# Install dependencies
npm install

# Review planned changes
npm run synth

# Deploy infrastructure to Azure
npm run deploy
```

### 3. Connect to AKS Cluster

```bash
# Get cluster credentials
az aks get-credentials --resource-group juice-shop-workshop --name juice-shop-workshop

# Verify connection
kubectl get nodes
```

### 4. GitOps Deployment

Flux is automatically configured to sync from this repository's `main` branch. Any changes pushed to the `flux/` directory will be automatically deployed to the cluster.

## Configuration

### Multi-Juicer Settings

Located in `flux/apps/multi-juicer.yaml`:

- **Max Instances**: 20 concurrent Juice Shop instances
- **Grace Period**: 7 days of inactivity before cleanup
- **Cleanup Schedule**: Runs hourly
- **Domain**: ctf.silly.hair
- **TLS**: Let's Encrypt production certificates

### Juice Shop Configuration

- CTF mode enabled with flag notifications disabled
- Hacking Instructor enabled
- Hints enabled for challenges
- Custom branding with Multi-Juicer logo
- Resource limits: 100m-1000m CPU, 400Mi memory

## Runbook

### Restart a Juice Shop Instance

If a participant's Juice Shop instance becomes unresponsive:

```bash
# List all Juice Shop pods
kubectl get pods -l app=juice-shop

# Delete the specific pod (it will be automatically recreated)
kubectl delete pod <pod-name>
```

### View Flux Status

```bash
# Check Flux components
kubectl get pods -n flux-system

# View Flux configurations
kubectl get kustomizations -A
kubectl get helmreleases -A
```

### Monitor Cluster

```bash
# View all resources in default namespace
kubectl get all

# Check ingress status
kubectl get ingress

# View TLS certificates
kubectl get certificates -A
```

### Scale Instances

Edit `flux/apps/multi-juicer.yaml` and modify the `maxInstances` value, then commit and push. Flux will automatically apply the changes.

## Resources

- **Multi-Juicer**: https://github.com/juice-shop/multi-juicer
- **OWASP Juice Shop**: https://owasp.org/www-project-juice-shop/
- **Trainer's Guide**: https://pwning.owasp-juice.shop/appendix/trainers.html
- **CTF Extension**: https://pwning.owasp-juice.shop/part1/ctf.html

## Infrastructure Management

### Update Infrastructure

```bash
cd cdktf
# Make changes to main.ts
npm run deploy
```

### Destroy Infrastructure

```bash
cd cdktf
npm run destroy
```

**Warning**: This will delete all workshop data and resources.

## Troubleshooting

### Flux Not Syncing

```bash
# Force reconciliation
flux reconcile source git flux-system
flux reconcile kustomization flux
```

### Certificate Issues

```bash
# Check cert-manager logs
kubectl logs -n cert-manager deploy/cert-manager

# Verify ClusterIssuer
kubectl get clusterissuer
kubectl describe clusterissuer letsencrypt-production
```

### Ingress Not Working

```bash
# Check ingress-nginx controller
kubectl get pods -n ingress-nginx
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller
```

## Contributing

Changes to the infrastructure or applications should be made through pull requests. Flux will automatically deploy changes merged to the `main` branch.

## License

MPL-2.0
