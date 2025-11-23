# ⚙️ Chakrator: The controller that spins the loop to enforce order

**Chakrator** is completely vibe coded. An experimental Kubernetes operator that allows you to dynamically edit reconciliation logic through a web-based TypeScript code editor. 

Built with TypeScript and powered by [k8s-operator-node](https://github.com/dot-i/k8s-operator-node).

## ✨ Features

* **TypeScript-Native:** Built entirely in TypeScript
* **Live Code Editing:** Edit reconciliation logic in real-time through a modern web UI
* **Monaco Editor:** Full-featured code editor with TypeScript syntax highlighting
* **Live Logs:** Stream operator logs directly to the web interface via WebSockets
* **Kubernetes-Ready:** Includes complete Kubernetes deployment manifests with Kustomize
* **Tilt Integration:** Fast local development with Tilt

## 🚀 Getting Started

### Prerequisites

* Node.js 20+
* npm
* Kubernetes cluster (local or remote)
* [Tilt](https://tilt.dev/) (for local development)
* Docker

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start with Tilt:**
   ```bash
   tilt up
   ```

3. **Access the UI:**
   Open http://localhost:3000 in your browser

### Manual Deployment

1. **Build the Docker image:**
   ```bash
   docker build -t chakrator:latest .
   ```

2. **Deploy to Kubernetes:**
   ```bash
   kubectl apply -k deploy/
   ```

3. **Access the service:**
   ```bash
   kubectl port-forward svc/chakrator 3000:80
   ```

## 📝 Usage

1. Open the web UI at http://localhost:3000
2. Edit the reconciliation code in the Monaco editor
3. Click "Save & Deploy" to update the reconciliation logic
4. Watch live logs in the right panel
5. Create custom resources to trigger reconciliation:

```yaml
apiVersion: example.com/v1
kind: MyResource
metadata:
  name: example
spec:
  # your spec here
```

## 🏗️ Project Structure

```
chakrator/
├── src/
│   ├── operator/          # Operator implementation
│   │   ├── index.ts       # Main operator logic
│   │   └── reconciler.ts  # User-editable reconciliation code
│   ├── server/            # Web server
│   │   └── index.ts       # Express + Socket.IO server
│   └── public/            # Web UI
│       ├── index.html     # Main HTML
│       ├── style.css      # Styles
│       └── app.js         # Frontend logic
├── deploy/                # Kubernetes manifests
│   ├── crd.yaml          # Custom Resource Definition
│   ├── deployment.yaml   # Operator deployment
│   ├── service.yaml      # Service
│   ├── rbac.yaml         # RBAC permissions
│   └── kustomization.yaml
├── Dockerfile            # Container image
├── Tiltfile             # Tilt configuration
└── tsconfig.json        # TypeScript config
```

## 🔧 Configuration

The operator watches for resources of type `MyResource` in the `example.com/v1` API group. You can customize this by editing:

- `src/operator/index.ts` - Change the watched resource
- `deploy/crd.yaml` - Update the CRD definition
- `deploy/rbac.yaml` - Adjust RBAC permissions

## 📦 Building

```bash
npm run build
```

## 🧪 Development

```bash
npm run dev
```

This starts the operator with nodemon for automatic reloading on code changes.

## 🤝 Contributing

This is an experimental project. Feel free to open issues or submit PRs!

## 📄 License

GPL 3.0
