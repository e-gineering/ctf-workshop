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

    const resourceGroup = new ResourceGroup(this, "resource-group", {
      name,
      location,
    });

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

    const cluster = new kubernetesCluster.KubernetesCluster(this, "k8s", {
      name,
      dnsPrefix: name,
      location,
      resourceGroupName: resourceGroup.name,
      kubernetesVersion: "1.27",
      automaticChannelUpgrade: "patch",
      skuTier: "Free",
      identity: {
        type: "SystemAssigned",
      },
      defaultNodePool: {
        name: "default",
        minCount: 1,
        maxCount: 3,
        vmSize: "Standard_B2s",
        enableAutoScaling: true,
      },
      // ingressApplicationGateway: {
      //   gatewayName: "home application gateway",
      //   subnetId: vnet.subnet.get(0).id,
      // },
    });

    // setup flux

    const clusterExtension =
      new kubernetesClusterExtension.KubernetesClusterExtension(this, "flux", {
        name: "flux",
        clusterId: cluster.id,
        extensionType: "microsoft.flux",
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
        kustomizations: [{ name: "flux", path: "flux" }],
        scope: "cluster",
        dependsOn: [clusterExtension],
      }
    );
  }
}

const app = new App();
new MyStack(app, "cdktf");
app.synth();
