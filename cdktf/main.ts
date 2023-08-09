import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import { kubernetesCluster } from "@cdktf/provider-azurerm";
import { AzurermProvider } from "@cdktf/provider-azurerm/lib/provider";
import { VirtualNetwork } from "@cdktf/provider-azurerm/lib/virtual-network";

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const name = "juice-shop-workshop";

    const resourceGroupName = name;
    const location = "eastus";

    new AzurermProvider(this, "azurerm", { features: {} });

    new VirtualNetwork(this, "vnet", {
      name,
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

    new kubernetesCluster.KubernetesCluster(this, "k8s", {
      name,
      dnsPrefix: name,
      location,
      resourceGroupName,
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
  }
}

const app = new App();
new MyStack(app, "cdktf");
app.synth();
