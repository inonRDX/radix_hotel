
/**
 * Agent JSON-RPC Bridge
 * Handles communication with the Radix native layer.
 */
export const Agent = (() => {
    let seq = 0;
    const pending = new Map<string, { resolve: (val: any) => void; reject: (err: any) => void; timer: any }>();
    const timeoutMs = 8000;
    let mockState: any = {};
    let mockConfig: any = {};

    const defaultCapabilities = {
        bridge: 'json-rpc',
        methods: ['system.ping', 'system.version', 'system.capabilities', 'state.get', 'config.get', 'pref.get'],
        events: ['state.changed'],
        protocol: '1.0.0'
    };

    const hasNative = () => typeof (window as any).radix !== 'undefined' && typeof (window as any).radix.postMessage === 'function';

    function call({ method, params = {} }: { method: string, params?: any }) {
        const id = `req-${Date.now()}-${++seq}`;
        console.log(`[Agent] Calling ${method}`, params);
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                pending.get(id) && console.warn(`[Agent] Timeout waiting for ${method} (${id})`);
                pending.delete(id);
                reject(new Error(`Timeout waiting for ${method}`));
            }, timeoutMs);
            pending.set(id, { resolve, reject, timer });
            send({ id, method, params });
        });
    }

    function send(message: any) {
        if (hasNative()) {
            try {
                (window as any).radix.postMessage(JSON.stringify(message));
            } catch (err) {
                console.warn('[Agent] Bridge send failed', err);
            }
        } else {
            // Mock bridge response for browser development
            setTimeout(() => {
                handleMockResponse(message);
            }, 50);
        }
    }

    function resolvePending(id: string, payload: any) {
        const entry = pending.get(id);
        if (!entry) return;
        clearTimeout(entry.timer);
        pending.delete(id);
        if (payload.error) {
            entry.reject(payload.error);
        } else {
            entry.resolve(payload.result);
        }
    }

    function emitResponse(payload: any) {
        window.dispatchEvent(new CustomEvent('agent:response', { detail: payload }));
    }

    function sendCommandToWeb(method: string, params = {}) {
        if (!method) return;
        console.log(`[Agent] Dispatching event to web: ${method}`, params);
        window.dispatchEvent(new CustomEvent('agent:event', { detail: { method, params } }));
    }

    function setMockData({ config = {}, state = {} } = {}) {
        mockConfig = config;
        mockState = state;
    }

    // Initialize global exposure for native layer and debugging
    if (typeof window !== 'undefined') {
        (window as any).Agent = {
            call,
            onEvent,
            setMockData,
            sendCommandToWeb,
            isNative: hasNative,
            // Legacy/Native compatibility name
            resolveResponse: (payload: any) => {
                const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
                window.dispatchEvent(new CustomEvent('agent:response', { detail: data }));
            }
        };

        // Standard Event Listeners
        window.addEventListener('agent:response' as any, (event: any) => {
            const detail = event.detail || {};
            if (!detail.id) return;
            resolvePending(detail.id, detail);
        });

        // Bridge for postMessage (common in Android WebViews)
        window.addEventListener('message', (event) => {
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (!data) return;

                if (data.id) {
                    // Response to a call
                    window.dispatchEvent(new CustomEvent('agent:response', { detail: data }));
                } else if (data.method) {
                    // Unsolicited event
                    window.dispatchEvent(new CustomEvent('agent:event', { detail: data }));
                }
            } catch (e) {
                // Ignore non-JSON messages
            }
        });
    }

    function onEvent(handler: (detail: any) => void) {
        if (typeof window !== 'undefined') {
            const listener = (e: any) => handler(e.detail);
            window.addEventListener('agent:event' as any, listener);
            return () => window.removeEventListener('agent:event' as any, listener);
        }
        return () => { };
    }

    function handleMockResponse(message: any) {
        const { id, method } = message;

        switch (method) {
            case 'system.capabilities':
                emitResponse({ id, result: defaultCapabilities });
                break;
            case 'config.get':
                emitResponse({
                    id, result: Object.keys(mockConfig).length ? mockConfig : {}
                });
                break;
            case 'state.get':
                emitResponse({
                    id, result: Object.keys(mockState).length ? mockState : {}
                });
                break;
            case 'pref.get': {
                const key = (message.params && message.params.key) || '';
                emitResponse({ id, result: { key, value: mockState.changed || {} } });
                break;
            }
            default:
                emitResponse({ id, result: { ok: true } });
        }
    }

    return { call, onEvent, setMockData, sendCommandToWeb, isNative: hasNative };
})();
