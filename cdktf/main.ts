import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import {
  kubernetesCluster,
  kubernetesClusterExtension,
  kubernetesFluxConfiguration,
} from "@cdktf/provider-azurerm";
import { AzurermProvider } from "@cdktf/provider-azurerm/lib/provider";
import { VirtualNetwork } from "@cdktf/provider-azurerm/lib/virtual-network";
import { ResourceGroup } from "@cdktf/provider-azurerm/lib/resource-group";

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const name = "juice-shop-workshop";
    const location = "eastus";

    new AzurermProvider(this, "azurerm", { features: {} });

    // Resource Group
    const resourceGroup = new ResourceGroup(this, "resource-group", {
      name,
      location,
    });

    // VNET
    new VirtualNetwork(this, "vnet", {
      name,
      location,
      resourceGroupName: resourceGroup.name,
      addressSpace: ["10.10.0.0/20"],
      subnet: [
        {
          name: "default",
          addressPrefix: "10.10.0.0/23",
        },
      ],
    });

    // Kubernetes cluster
    const cluster = new kubernetesCluster.KubernetesCluster(this, "k8s", {
      name,
      dnsPrefix: name,
      location,
      resourceGroupName: resourceGroup.name,
      nodeResourceGroup: `${name}-nodes`, // The nodes need to be in a separate resource group for some reason
      kubernetesVersion: "1.27",
      automaticChannelUpgrade: "patch",
      skuTier: "Free",
      identity: {
        type: "SystemAssigned",
      },
      defaultNodePool: {
        name: "default",
        minCount: 1,
        maxCount: 10,
        vmSize: "Standard_B2s_v2",
        enableAutoScaling: true,
        temporaryNameForRotation: "rotating",
      },
      oidcIssuerEnabled: true, // Required for the Workload Identity integration
      workloadIdentityEnabled: true,
    });

    // Setup the Flux extension
    const clusterExtension =
      new kubernetesClusterExtension.KubernetesClusterExtension(this, "flux", {
        name: "flux",
        clusterId: cluster.id,
        extensionType: "microsoft.flux",
        dependsOn: [cluster],
      });

    new kubernetesFluxConfiguration.KubernetesFluxConfiguration(
      this,
      "flux-config",
      {
        name: "flux",
        clusterId: cluster.id,
        namespace: "flux-system",
        gitRepository: {
          url: "https://github.com/dbirks/juice-shop-workshop",
          referenceType: "branch",
          referenceValue: "main",
        },
        kustomizations: [{ name: "flux", path: "flux/entry" }],
        scope: "cluster",
        dependsOn: [clusterExtension],
      }
    );
  }
}

const app = new App();
new MyStack(app, "cdktf");
app.synth();
