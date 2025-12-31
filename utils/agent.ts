
/**
 * Agent JSON-RPC Bridge
 * Handles communication with the Radix native layer.
 */
export const Agent = (() => {
    let seq = 0;
    const pending = new Map<string, { resolve: (val: any) => void; reject: (err: any) => void; timer: any }>();
    const timeoutMs = 8000;

    const hasNative = () => typeof (window as any).radix !== 'undefined' && typeof (window as any).radix.postMessage === 'function';

    function call({ method, params = {} }: { method: string, params?: any }) {
        const id = `req-${Date.now()}-${++seq}`;
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
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
                console.warn('Agent bridge send failed', err);
            }
        } else {
            // Mock bridge response for browser development
            setTimeout(() => {
                handleMockResponse(message);
            }, 100);
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

    // Listen for native responses
    if (typeof window !== 'undefined') {
        window.addEventListener('agent:response' as any, (event: any) => {
            const detail = event.detail || {};
            if (!detail.id) return;
            resolvePending(detail.id, detail);
        });

        // Support for direct postMessage global listener if needed by native
        window.addEventListener('message', (event) => {
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (data && data.method && !data.id) {
                    // It's an event
                    window.dispatchEvent(new CustomEvent('agent:event', { detail: data }));
                } else if (data && data.id) {
                    // It's a response
                    window.dispatchEvent(new CustomEvent('agent:response', { detail: data }));
                }
            } catch (e) {
                // Not JSON or other message
            }
        });
    }

    function onEvent(handler: (detail: any) => void) {
        if (typeof window !== 'undefined') {
            window.addEventListener('agent:event' as any, (e: any) => handler(e.detail));
        }
    }

    function handleMockResponse(message: any) {
        const { id, method } = message;
        const emit = (result: any) => {
            window.dispatchEvent(new CustomEvent('agent:response', { detail: { id, result } }));
        };

        switch (method) {
            case 'system.capabilities':
                emit({ bridge: 'json-rpc', version: '1.0.0' });
                break;
            case 'config.get':
                emit({ checkin: { guestName: 'Alexander Henderson', roomNumber: '802' } });
                break;
            case 'state.get':
                emit({ guest: { name: 'Alexander Henderson', roomNumber: '802' } });
                break;
            default:
                emit({ ok: true });
        }
    }

    return { call, onEvent, isNative: hasNative };
})();
