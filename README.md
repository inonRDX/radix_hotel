# Radix Grand Hotel TV Launcher

A premium, state-of-the-art TV launcher built for the Radix platform. This application provides a luxurious guest experience with integrated room services, entertainment, and real-time hotel information.

## Features

- **Radix Bridge Integration**: Deep integration with native TV functionalities (Live TV, Casting, etc.).
- **Dynamic Guest Experience**: Real-time updates for guest name, room number, and tier via the Agent bridge.
- **Premium Services**: Direct access to Room Service, Wellness & Spa, AI Concierge, and Hotel Info.
- **Smart Launcher**: One-click access to major streaming platforms like Netflix, YouTube, Disney+, and Prime Video.
- **Micro-Animations**: Smooth transitions and high-end visual feedback for a premium feel.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Agent Bridge & RPC Integration

The application uses a custom JSON-RPC bridge located in `utils/agent.ts` to communicate with the Radix native layer.

### RPC Communication Pattern

Communication is handled via a Request/Response and Event-based system:

#### 1. Making a Request (JSON-RPC)
To call a native method and wait for a result, use the `Agent.call` method:

```typescript
import { Agent } from './utils/agent';

async function fetchGuestInfo() {
  try {
    const state = await Agent.call({ 
      method: 'state.get', 
      params: {} 
    });
    console.log('Guest State:', state);
  } catch (err) {
    console.error('Failed to fetch state:', err);
  }
}
```

#### 2. Listening for Events
To respond to push notifications or state changes from the native layer (e.g., check-in events):

```typescript
Agent.onEvent((detail) => {
  if (detail.method === 'ui.checkin') {
    const { guestName, roomNumber } = detail.params;
    // Update local state...
  }
});
```

#### 3. Command Execution (Radix Interface)
For one-way native commands, use the wrappers in `utils/radix.ts`:

```typescript
import { safeRadixCommand, RadixCommands } from './utils/radix';

// Trigger Checkout
safeRadixCommand(RadixCommands.CHECKOUT);

// Launch specific app
safeRadixLaunch('com.tcl.tv');
```

## Structure
- `/components`: UI building blocks (Header, ServiceCard, OverlayModal, etc.)
- `/utils`: Communication bridges (`agent.ts`, `radix.ts`) and helpers
- `App.tsx`: Main application logic and state management
- `constants.tsx`: Configuration for services and apps

---
*Created for the Radix Grand Hotel Experience.*
