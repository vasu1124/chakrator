import Operator, { ResourceEvent, ResourceEventType } from '@dot-i/k8s-operator';
import * as path from 'path';
import { startServer } from '../server';

export default class MyOperator extends Operator {
    protected async init() {
        console.log('Starting operator...');
        try {
            await this.watchResource('example.com', 'v1', 'myresources', async (e: ResourceEvent) => {
                const object = e.object;
                const metadata = object.metadata;
                console.log(`Event ${e.type} for ${metadata?.name}`);

                try {
                    const reconcilerPath = path.resolve(__dirname, 'reconciler');
                    delete require.cache[require.resolve(reconcilerPath)];

                    const module = require(reconcilerPath);
                    const reconcile = module.reconcile;

                    if (typeof reconcile === 'function') {
                        await reconcile(object);
                    } else {
                        console.error('Reconcile function not found in reconciler module');
                    }
                } catch (err) {
                    console.error('Failed to reconcile:', err);
                }
            });
        } catch (err) {
            console.error('Error watching resource:', err);
        }
    }
}

async function main() {
    const operator = new MyOperator();
    await operator.start();
    startServer();
}

main().catch(console.error);
