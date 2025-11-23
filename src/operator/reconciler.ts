/**
 * Reconciliation function for MyResource custom resources
 * 
 * This function is called whenever a MyResource object is added, modified, or deleted.
 * You can edit this code in the web UI and save to update the reconciliation logic.
 * 
 * Example MyResource:
 * apiVersion: example.com/v1
 * kind: MyResource
 * metadata:
 *   name: example-resource
 * spec:
 *   message: "Hello from Chakrator!"
 *   replicas: 3
 */
export async function reconcile(object: any): Promise<void> {
    const name = object.metadata?.name || 'unknown';
    const namespace = object.metadata?.namespace || 'default';
    const uid = object.metadata?.uid;

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🔄 Reconciling MyResource: ${namespace}/${name}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // Log the resource details
    if (object.spec) {
        console.log(`📋 Spec:`);
        if (object.spec.message) {
            console.log(`   Message: "${object.spec.message}"`);
        }
        if (object.spec.replicas !== undefined) {
            console.log(`   Replicas: ${object.spec.replicas}`);
        }
    }

    // Check if resource is being deleted
    if (object.metadata?.deletionTimestamp) {
        console.log(`🗑️  Resource is being deleted`);
        // Add cleanup logic here
        return;
    }

    // Example: Validate spec
    if (object.spec?.replicas && object.spec.replicas < 0) {
        console.error(`❌ Invalid replicas count: ${object.spec.replicas} (must be >= 0)`);
        return;
    }

    // Example: Check current status
    const currentState = object.status?.state;
    const desiredMessage = object.spec?.message || '';

    if (currentState === 'Ready' && object.status?.message === desiredMessage) {
        console.log(`✅ Resource is already in desired state`);
        return;
    }

    // Example: Simulate some work
    console.log(`⚙️  Processing resource...`);

    // In a real operator, you would:
    // 1. Create/update dependent resources (Deployments, Services, etc.)
    // 2. Update the status subresource
    // 3. Handle errors and retry logic

    // For now, just log what we would do
    if (object.spec?.replicas) {
        console.log(`   Would create/update ${object.spec.replicas} replicas`);
    }

    if (object.spec?.message) {
        console.log(`   Would configure with message: "${object.spec.message}"`);
    }

    // Example: Update status (in real implementation, use the operator's setResourceStatus)
    const newStatus = {
        state: 'Ready',
        message: desiredMessage,
        replicas: object.spec?.replicas || 0,
        lastReconciled: new Date().toISOString(),
        observedGeneration: object.metadata?.generation
    };

    console.log(`📊 Status would be updated to:`, JSON.stringify(newStatus, null, 2));
    console.log(`✨ Reconciliation complete for ${name}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}
