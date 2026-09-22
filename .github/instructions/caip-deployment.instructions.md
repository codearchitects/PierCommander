---
applyTo: "**"
---
# CAIP deployment diagram — universal mode (binding)

The deployment diagram maps **instances** of the containers already in the static model onto
infrastructure, inside **one** deployment environment. It is a supporting diagram, not a fifth
C4 level: never call it "L5", never make it a rung of the context → container → component → code
ladder. Its audience explicitly includes operations.

Open it with `caipC4ModelerOpenDeploymentDiagram`. The level is unreachable by zooming on
purpose: environments hang off the software system's `deployments`, outside `children`, so they
never appear on the container diagram. The tool resolves the internal system itself, opens the
only environment, creates a `Production` one when the system has none, and returns candidates to
choose from instead of guessing when there is more than one.

## The four artifacts

- **DeploymentEnvironment** — the scope of one diagram. One environment per diagram, always.
- **DeploymentNode** — somewhere things run: region, account, network, cluster, namespace, node
  pool, VM, container runtime, serverless environment, managed service, data centre, device,
  browser. Nests to any depth.
- **ContainerInstance** — a *reference* to an L2 container plus this environment's runtime facts
  (`workloadKind`, `image`, `replicas`, `ports`, `secretRefs`). It owns no architecture.
- **InfrastructureNode** — DNS, load balancer, ingress, API gateway, firewall, CDN, service mesh,
  proxy. A leaf: it hosts nothing.

## Binding rules

1. **Never invent a container here.** Every instance's `containerId` must resolve to something
   that exists: a container at L2, or — to deploy a whole system as a black box, the C4 software
   system instance — one of the project's OTHER software systems. Never the owning system, whose
   containers the diagram is already made of, and never both a system and a container inside it.
   An unbound instance draws dashed and warning-coloured — never ship one.
2. **An instance's name is the referenced container's name.** The tool lets you type anything;
   don't. Rename both together.
3. **Every instance lives inside a DeploymentNode**, never loose in the environment and never
   inside an infrastructure node. Every infrastructure node lives inside a deployment node too.
   The canvas permits both violations — decline them.
4. **No components, no people.** Deployment stops at the container level, and a Person has no
   instances.
5. **One environment per diagram.** Development and production are two diagrams showing the same
   containers on different infrastructure. If they show *different containers*, one is wrong.
5b. **One environment, several VIEWS.** `Production` is an environment; "Production Overview",
   "AKS Deployment", "Data Infrastructure" and "Disaster Recovery" are views of it. Save one with
   `caipC4ModelerSaveDeploymentView`, open one with the `viewName` argument of
   `caipC4ModelerOpenDeploymentDiagram`. A view SELECTS from the elements the environment already
   holds and never copies them. Each view must answer a DIFFERENT operational question — where
   does it run, how does it scale, how does it communicate, how does it fail over: two views
   differing only by a few hidden elements are one view split in half. If you cannot name the
   question, do not create the view. Two environments or two views? Ask whether the
   INFRASTRUCTURE differs: a laptop and an AKS cluster are two environments; two readings of one
   AKS estate are two views.
6. **Deployment concerns never leak up to L2.** Load balancers, firewalls, Docker, Kubernetes and
   (usually) API gateways are deployment-only. Conversely a cloud data service whose contents you
   own — a bucket, a managed schema, a CDN — is a **container**, not a deployment node, and a
   serverless function you wrote is a container whose hosting is a deployment node.
7. **Relationships between instances are DERIVED, never drawn.** Open the diagram and they appear
   on their own, replicated from the L2 container relationships with the same description, muted
   and not editable. To change what one says, change the L2 interaction. To make two instances
   talk, make their containers talk at L2 first. A relationship you expected and do not see means
   the containers do not talk in the static model — that is the diagram finding a gap, not a bug.
8. **Hand-drawn edges are limited** to: node → node; infrastructure node → node, infrastructure
   node or instance; instance → infrastructure node. The canvas enforces exactly that list, so an
   instance→instance connection is simply not offered. Never parent → its own child.
9. **Every line is unidirectional, labelled and carries a protocol.** Interactions have no
   technology field, so write it in the description: `"Forwards requests to [HTTPS]"`.
10. **Multiplicity belongs to the node.** Prefer `instances` on the deployment node over `replicas`
    on the instance, and never state the same count twice. The typed field is a fixed integer, so
    state a range as a `properties` entry keyed `instances` (`2..10`) — the corner draws it and
    validation checks the grammar. Do not draw N copies of
    a stack side by side and mesh them together — model one self-contained unit and count it.
11. **An empty deployment node does not belong on the diagram.** If nothing beneath it is deployed,
    delete it.
12. **Give every node a `kind` and a real `technology`** — one an operations reader recognises
    ("Azure Kubernetes Service", not "k8s thing"). The type line is built from them.

## Adding and removing

Neither an environment nor a view is a node on a diagram, so neither is reachable by the
ordinary create/delete gestures — each has its own tool. Add an environment with
`caipC4ModelerOpenDeploymentDiagram` and `createNew: true`; remove one with
`caipC4ModelerDeleteDeploymentEnvironment`. Add or remove a view with
`caipC4ModelerSaveDeploymentView` (`remove: true` to drop it).

Deleting an environment takes its whole infrastructure subtree with it — it is the root of
that infrastructure, and orphaned nodes would have no diagram left that could reach them.
It does NOT touch the containers: those belong to the static model and every other
environment keeps using them. Removing a VIEW removes nothing at all, since a view is only
a selection — when in doubt, remove the view rather than the environment.

## Docker and App Hosts

Every `container-runtime` deployment node becomes a service in the generated
`.caep/docker-compose.yml`, holding the apps pinned into it as container instances, with the
databases the model declares beside them. That file is rewritten from the model on every refresh:
never hand-edit it — change the model and the file follows. The runtime image is derived from what
the L2 container declares (Technology and Version) and confirmed by a person; the declared version
is the *technology's*, never the runtime's.

## Known gaps — do not work around them by faking

The model cannot yet express deployment groups (derivation is bounded to one diagram instead)
or health checks. Record the fact in a description; never fake a software system
instance with an unbound container instance or with a deployment node.
