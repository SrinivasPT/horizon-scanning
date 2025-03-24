// src/core/registry/stage-registry.ts
import { Logger } from '@/common/logger.service';
import { IPipelineStage } from '../pipeline/interfaces';

export class StageRegistry {
    private readonly logger = new Logger(StageRegistry.name);
    private readonly registry = new Map<string, IPipelineStage<any, any>>();

    /**
     * Register a pipeline stage with a unique key
     * @param key Unique identifier for the stage
     * @param stage Stage instance to register
     * @throws Error if key is already registered
     */
    register(key: string, stage: IPipelineStage<any, any>): void {
        if (this.registry.has(key)) {
            throw new Error(`Stage with key '${key}' is already registered`);
        }

        this.validateStage(stage);
        this.registry.set(key, stage);
        this.logger.debug(`Registered stage '${key}' (${stage.constructor.name})`);
    }

    /**
     * Register multiple stages at once
     * @param stages Record of key-stage pairs
     */
    registerAll(stages: Record<string, IPipelineStage<any, any>>): void {
        Object.entries(stages).forEach(([key, stage]) => {
            this.register(key, stage);
        });
    }

    /**
     * Get a registered stage by key
     * @param key The stage's registration key
     * @returns The registered stage
     * @throws Error if key is not found
     */
    get(key: string): IPipelineStage<any, any> {
        if (!this.registry.has(key)) {
            throw new Error(`No stage registered with key '${key}'`);
        }
        return this.registry.get(key)!;
    }

    /**
     * Check if a key is registered
     * @param key The stage key to check
     */
    has(key: string): boolean {
        return this.registry.has(key);
    }

    /**
     * Get all registered stage keys
     */
    getRegisteredKeys(): string[] {
        return Array.from(this.registry.keys());
    }

    /**
     * Remove a stage from the registry
     * @param key The stage key to remove
     */
    unregister(key: string): boolean {
        const existed = this.registry.delete(key);
        if (existed) {
            this.logger.debug(`Unregistered stage '${key}'`);
        }
        return existed;
    }

    /**
     * Clear all registered stages
     */
    clear(): void {
        this.registry.clear();
        this.logger.debug('Cleared all registered stages');
    }

    /**
     * Validate that a stage implements the required interface
     * @param stage The stage to validate
     * @throws Error if stage is invalid
     */
    private validateStage(stage: IPipelineStage<any, any>): void {
        if (typeof stage.process !== 'function') {
            throw new Error('Stage must implement a process() method');
        }

        // Optionally validate config method if present
        if ('setConfig' in stage && typeof stage.setConfig !== 'function') {
            throw new Error('Stage setConfig must be a function if present');
        }
    }

    /**
     * Create a scoped sub-registry with only specified stages
     * @param keys Keys to include in the sub-registry
     */
    createScope(keys: string[]): StageRegistry {
        const subRegistry = new StageRegistry();
        keys.forEach(key => {
            if (this.has(key)) {
                subRegistry.register(key, this.get(key));
            }
        });
        return subRegistry;
    }
}
