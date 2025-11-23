# Development Notes

## Technical Decisions

### Why @dot-i/k8s-operator?
- Provides a clean abstraction over the Kubernetes client
- Handles watch streams and reconnection logic
- Simplifies resource event handling
- TypeScript-first design

### Why Dynamic Code Loading?
The reconciler uses Node.js's `require()` cache invalidation to hot-reload:
```typescript
delete require.cache[require.resolve(reconcilerPath)];
const module = require(reconcilerPath);
```

This allows updating reconciliation logic without restarting the operator pod.

### Why Monaco Editor via CDN?
- Full VS Code editor experience
- TypeScript syntax highlighting out of the box
- No need to bundle large editor assets
- Faster initial load

### Why Socket.IO for Logs?
- Bidirectional real-time communication
- Automatic reconnection
- Fallback to polling if WebSocket fails
- Simple API for streaming logs

## Important Considerations

### Security
⚠️ **This is an experimental project. Do NOT use in production without:**
- Authentication/authorization on the web UI
- RBAC restrictions on who can edit code
- Code validation/sandboxing
- Audit logging of code changes
- Network policies to restrict access

### Code Persistence
Currently, code changes are only stored in memory. When the pod restarts, changes are lost. Consider:
- Storing code in a ConfigMap
- Using a git repository as source of truth
- Implementing a versioning system

### Multi-tenancy
The current implementation:
- Watches cluster-wide resources
- Single reconciler for all resources
- No namespace isolation

For multi-tenant scenarios, consider:
- Namespace-scoped watching
- Per-namespace reconcilers
- Resource quotas and limits

## Known Limitations

1. **Single Reconciler**: All resources use the same reconciliation code
2. **No Validation**: Code is executed without syntax/safety checks
3. **No Rollback**: No built-in way to revert to previous code
4. **No Persistence**: Code changes lost on pod restart
5. **No Collaboration**: Multiple users editing simultaneously will conflict

## Development Tips

### Debugging the Operator

Add breakpoints in TypeScript:
```typescript
debugger; // Will pause if running with --inspect
```

Run with Node.js inspector:
```bash
node --inspect dist/operator/index.js
```

### Testing Reconciliation Logic

Create a test harness:
```typescript
// test-reconciler.ts
import { reconcile } from './src/operator/reconciler';

const mockResource = {
  metadata: { name: 'test', namespace: 'default' },
  spec: { message: 'test' }
};

reconcile(mockResource).then(() => {
  console.log('Test passed');
}).catch(console.error);
```

### Extending the Operator

To watch additional resources:
```typescript
// In operator/index.ts init()
await this.watchResource('apps', 'v1', 'deployments', async (e) => {
  console.log(`Deployment ${e.type}: ${e.object.metadata?.name}`);
});
```

Update RBAC accordingly:
```yaml
# In deploy/rbac.yaml
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch"]
```

### Custom Status Updates

To update resource status:
```typescript
// In reconciler.ts
export async function reconcile(object: any): Promise<void> {
  // Your logic here
  
  // Status is typically updated by the operator framework
  // You would need to pass the operator instance or use the k8s client directly
}
```

For now, status updates require modifying the operator core to expose the client.

## Performance Considerations

### Watch Efficiency
The operator uses Kubernetes watch API which:
- Maintains a persistent connection
- Only sends changes (not full state)
- Automatically handles reconnection

### Code Reload Performance
Dynamic code loading is fast but:
- Clears the entire module cache for that file
- Re-parses and compiles the code
- May cause brief delays on large files

### Log Streaming
Socket.IO emits every console.log. For high-volume logging:
- Consider log levels (debug, info, warn, error)
- Implement client-side filtering
- Add log buffering/throttling

## Useful Patterns

### Idempotent Reconciliation
```typescript
export async function reconcile(object: any): Promise<void> {
  const desired = object.spec;
  const current = object.status?.current;
  
  if (JSON.stringify(desired) === JSON.stringify(current)) {
    console.log('No changes needed');
    return;
  }
  
  // Apply changes
  // Update status
}
```

### Error Handling
```typescript
export async function reconcile(object: any): Promise<void> {
  try {
    // Your logic
  } catch (error) {
    console.error(`Reconciliation failed: ${error}`);
    // Optionally update status with error
    // The operator will retry on the next event
  }
}
```

### Finalizer Pattern
```typescript
// In operator/index.ts
await this.handleResourceFinalizer(
  event,
  'chakrator.example.com/finalizer',
  async (e) => {
    console.log(`Cleaning up ${e.object.metadata?.name}`);
    // Cleanup logic here
  }
);
```

## Environment Variables

The operator respects standard Kubernetes environment variables:
- `KUBECONFIG`: Path to kubeconfig file (defaults to in-cluster config)
- `PORT`: Web server port (defaults to 3000)

Add custom env vars in `deploy/deployment.yaml`:
```yaml
env:
- name: LOG_LEVEL
  value: "debug"
- name: RECONCILE_TIMEOUT
  value: "30000"
```

## Monitoring

### Metrics to Track
- Reconciliation duration
- Error rate
- Resource count
- Code update frequency

### Adding Prometheus Metrics
Install `prom-client`:
```bash
npm install prom-client
```

Add to server:
```typescript
import { register, Counter, Histogram } from 'prom-client';

const reconcileCounter = new Counter({
  name: 'chakrator_reconcile_total',
  help: 'Total reconciliations'
});

app.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});
```

## Testing Strategy

### Unit Tests
Test reconciliation logic in isolation:
```bash
npm install --save-dev jest @types/jest ts-jest
```

### Integration Tests
Test against a real Kubernetes cluster:
- Use kind or minikube
- Create test resources
- Verify reconciliation behavior

### E2E Tests
Test the full stack:
- Deploy operator
- Use Playwright/Puppeteer to test UI
- Verify code updates work end-to-end

## Future Architecture Ideas

### Plugin System
```typescript
interface ReconcilerPlugin {
  name: string;
  reconcile(object: any): Promise<void>;
}

// Load plugins dynamically
const plugins: ReconcilerPlugin[] = loadPlugins();
```

### Multi-CRD Support
```typescript
const crdConfigs = [
  { group: 'example.com', version: 'v1', plural: 'myresources' },
  { group: 'example.com', version: 'v1', plural: 'otherresources' }
];

for (const crd of crdConfigs) {
  await this.watchResource(crd.group, crd.version, crd.plural, handler);
}
```

### Code Versioning
Store code in Git:
```typescript
import simpleGit from 'simple-git';

async function saveCode(code: string) {
  const git = simpleGit('/app/reconcilers');
  await fs.writeFile('reconciler.ts', code);
  await git.add('reconciler.ts');
  await git.commit(`Update reconciler at ${new Date().toISOString()}`);
  await git.push();
}
```

## Resources

- [k8s-operator-node GitHub](https://github.com/dot-i/k8s-operator-node)
- [Kubernetes Operator Pattern](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/)
- [Custom Resources](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/)
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/api/index.html)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Tilt Documentation](https://docs.tilt.dev/)
