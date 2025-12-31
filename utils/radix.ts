/**
 * Radix Bridge Utilities
 * Safe wrappers for Radix TV platform commands
 */

declare global {
    interface Window {
        radix?: {
            launchApp: (packageName: string) => void;
            doCommand: (commandJson: string) => void;
            postMessage: (message: string) => void;
        };
    }
}

/**
 * Safely launch an app via Radix
 */
export function safeRadixLaunch(packageName: string): void {
    if (typeof window.radix !== 'undefined' && window.radix.launchApp) {
        window.radix.launchApp(packageName);
    } else {
        console.log('[Debug] Would launch app:', packageName);
    }
}

/**
 * Safely send a command via Radix
 */
export function safeRadixCommand(commandClass: string): void {
    if (typeof window.radix !== 'undefined' && window.radix.doCommand) {
        window.radix.doCommand(JSON.stringify({ command: { '@class': commandClass } }));
    } else {
        console.log('[Debug] Would send command:', commandClass);
        if (commandClass.includes('Checkout')) {
            alert('Check Out command would be sent to the hotel system.');
        }
    }
}

/**
 * Check if running in Radix environment
 */
export function isRadixEnvironment(): boolean {
    const ua = navigator.userAgent || '';
    return ua.toLowerCase().indexOf('radix') !== -1 || typeof window.radix !== 'undefined';
}

/**
 * Radix command constants
 */
export const RadixCommands = {
    CHECKOUT: 'com.viso.entities.commands.CommandGB2BCheckout',
    CAST: 'com.viso.entities.commands.CommandGB2BCast',
    TOS: 'com.viso.entities.commands.CommandGB2BTos',
    USAGE_DIAGNOSTICS: 'com.viso.entities.commands.CommandGB2BUsageDiagnostics',
} as const;

/**
 * Radix app package names
 */
export const RadixApps = {
    NETFLIX: 'com.netflix.ninja',
    TV: 'com.tcl.tv',
    DISNEY_PLUS: 'com.disney.disneyplus',
    YOUTUBE: 'com.google.android.youtube.tv',
    PRIME_VIDEO: 'com.amazon.amazonvideo.livingroom',
} as const;
