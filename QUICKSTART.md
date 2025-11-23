# Quick Start Guide

## Prerequisites Check

Before starting, ensure you have:

- [ ] Node.js 20+ installed
- [ ] Docker installed and running
- [ ] Kubernetes cluster (kind, minikube, or remote)
- [ ] kubectl configured
- [ ] Tilt installed (optional, but recommended)

## Option 1: Quick Start with Tilt (Recommended)

This is the fastest way to get started:

```bash
# 1. Install dependencies
npm install

# 2. Start Tilt (builds, deploys, and watches)
tilt up

# 3. Open the UI
# Tilt will automatically port-forward to localhost:3000
# Open http://localhost:3000 in your browser
```

Press `space` in the terminal to open the Tilt UI in your browser.

## Option 2: Manual Deployment

### Step 1: Build the Project

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build
```

### Step 2: Build Docker Image

```bash
# Build the container image
docker build -t chakrator:latest .
```

### Step 3: Deploy to Kubernetes

```bash
# Apply all manifests using Kustomize
kubectl apply -k deploy/

# Wait for the pod to be ready
kubectl wait --for=condition=ready pod -l app=chakrator --timeout=60s

# Port-forward to access the UI
kubectl port-forward svc/chakrator 3000:80
```

### Step 4: Access the UI

Open http://localhost:3000 in your browser.

## Option 3: Local Development (No Kubernetes)

For development without Kubernetes:

```bash
# Install dependencies
npm install

# Start in development mode with auto-reload
npm run dev
```

**Note**: This will start the web server, but the operator won't function without a Kubernetes cluster.

## Testing the Operator

### 1. Create a Custom Resource

```bash
kubectl apply -f examples/example-resource.yaml
```

### 2. Watch the Logs

In the web UI at http://localhost:3000, you should see logs appearing in the right panel showing the reconciliation.

### 3. Edit the Reconciliation Code

1. In the web UI, modify the `reconcile` function in the editor
2. Click "Save & Deploy"
3. Create another resource or update the existing one to trigger reconciliation

Example modification:
```typescript
export async function reconcile(object: any): Promise<void> {
  console.log(`Reconciling object ${object.metadata.name}`);
  
  // Add your custom logic here
  if (object.spec?.message) {
    console.log(`Message: ${object.spec.message}`);
  }
  
  // Update status
  if (!object.status) {
    object.status = { 
      state: 'Processed',
      timestamp: new Date().toISOString()
    };
  }
}
```

### 4. View Resources

```bash
# List all MyResource objects
kubectl get myresources

# Describe a specific resource
kubectl describe myresource example-resource

# Get YAML output
kubectl get myresource example-resource -o yaml
```

## Troubleshooting

### Pod not starting?

```bash
# Check pod status
kubectl get pods -l app=chakrator

# View logs
kubectl logs -l app=chakrator

# Describe pod for events
kubectl describe pod -l app=chakrator
```

### Can't access the UI?

```bash
# Check if service is running
kubectl get svc chakrator

# Verify port-forward is active
# Kill any existing port-forwards
pkill -f "port-forward.*chakrator"

# Start fresh port-forward
kubectl port-forward svc/chakrator 3000:80
```

### RBAC issues?

```bash
# Check if ServiceAccount exists
kubectl get sa chakrator

# Check ClusterRole
kubectl get clusterrole chakrator

# Check ClusterRoleBinding
kubectl get clusterrolebinding chakrator
```

### Build issues?

```bash
# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## Next Steps

1. **Customize the CRD**: Edit `deploy/crd.yaml` to add your own spec fields
2. **Update RBAC**: Modify `deploy/rbac.yaml` if you need access to other resources
3. **Enhance Reconciliation**: Edit the reconciler logic in the web UI
4. **Add Status Updates**: Use the k8s client to update resource status

## Useful Commands

```bash
# Watch resources in real-time
kubectl get myresources -w

# Delete all resources
kubectl delete -k deploy/

# Restart the operator
kubectl rollout restart deployment chakrator

# View all events
kubectl get events --sort-by='.lastTimestamp'

# Shell into the operator pod
kubectl exec -it deployment/chakrator -- /bin/sh
```

## Development Workflow

1. Make changes to TypeScript files
2. If using Tilt: changes auto-rebuild and redeploy
3. If manual: run `npm run build`, rebuild Docker image, and redeploy
4. Test with custom resources
5. Monitor logs in the web UI

## Clean Up

```bash
# If using Tilt
tilt down

# If manual deployment
kubectl delete -k deploy/

# Remove local build artifacts
rm -rf dist node_modules
```

## Getting Help

- Check `PROJECT_SUMMARY.md` for architecture details
- Review `Readme.md` for full documentation
- Inspect logs in the web UI or via kubectl
- Check Tilt UI for build/deploy status
