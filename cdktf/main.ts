import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import { kubernetesCluster } from "@cdktf/provider-azurerm";
import { AzurermProvider } from "@cdktf/provider-azurerm/lib/provider";
import { VirtualNetwork } from "@cdktf/provider-azurerm/lib/virtual-network";

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const resourceGroupName = "personal";
    const location = "eastus";

    new AzurermProvider(this, "azurerm", { features: {} });

    new VirtualNetwork(this, "vnet", {
      name: "personal",
      location,
      resourceGroupName,
      addressSpace: ["10.10.0.0/20"],
      subnet: [
        {
          name: "default",
          addressPrefix: "10.10.0.0/23",
        },
      ],
    });

    // TODO: Re-enable this when my subscription can create spot instances
    // new KubernetesClusterNodePool(this, "spot-node-pool", {
    //   name: "spot",
    //   kubernetesClusterId: k8sCluster.id,
    //   vmSize: "Standard_B2s",
    //   nodeCount: 1,
    //   minCount: 1,
    //   maxCount: 3,
    //   priority: "Spot",
    //   evictionPolicy: "Delete",
    //   enableAutoScaling: true,
    //   nodeLabels: {
    //     "kubernetes.azure.com/scalesetpriority": "spot",
    //   },
    //   nodeTaints: ["kubernetes.azure.com/scalesetpriority=spot:NoSchedule"],
    // });

    // TODO: Configure flux automatically here when this PR is merged:
    // https://github.com/hashicorp/terraform-provider-azurerm/issues/15011

    new kubernetesCluster.KubernetesCluster(this, "k8s", {
      name: "home",
      dnsPrefix: "home", // prefix of the hostname of the publicly exposed cluster api
      // privateDnsZoneId: privateDns.id,
      location: "eastus",
      resourceGroupName,
      kubernetesVersion: "1.26",
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
  }
}

const app = new App();
new MyStack(app, "cdktf");
app.synth();
