
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import ServiceCard from './components/ServiceCard';
import OverlayModal from './components/OverlayModal';
import SplashScreen from './components/SplashScreen';
import PrivacyMenu from './components/PrivacyMenu';
import { ToastContainer, useToasts } from './components/Toast';
import { SERVICES, STREAMING_APPS, AppIcon } from './constants';
import { Service, ModalContent, WeatherData, GuestInfo, Alarm } from './types';
import { Star, Shield, Bell, Moon, Clock, Settings, LogOut, ChevronRight } from 'lucide-react';
import { alarmAudio } from './utils/audio';
import { safeRadixLaunch, safeRadixCommand, RadixCommands, isRadixEnvironment, RadixApps } from './utils/radix';
import { locationService } from './utils/location';
import { Agent } from './utils/agent';

const App: React.FC = () => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [focusedRow, setFocusedRow] = useState<'services' | 'apps' | 'footer'>('services');
  const [appFocusedIndex, setAppFocusedIndex] = useState(0);
  const [footerFocusedIndex, setFooterFocusedIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showSplash, setShowSplash] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [guest, setGuest] = useState<GuestInfo>({ name: 'Alexander Henderson', room: '802', tier: 'Gold' });
  const [isDND, setIsDND] = useState(false);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [showPrivacyMenu, setShowPrivacyMenu] = useState(false);
  const [welcomePhase, setWelcomePhase] = useState<'visible' | 'fading' | 'hidden'>('visible');
  const [isLowMotion, setIsLowMotion] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const privacyButtonRef = useRef<HTMLButtonElement>(null);
  const serviceCardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const { toasts, showToast, dismissToast } = useToasts();

  // Unified focus handler to prevent "multiple selection" conflict
  const handleElementFocus = (row: 'services' | 'apps' | 'footer', index: number) => {
    setFocusedRow(row);
    if (row === 'services') {
      setFocusedIndex(index);
    } else if (row === 'apps') {
      setAppFocusedIndex(index);
    } else {
      setFooterFocusedIndex(index);
    }
  };

  // Helper to apply configuration from bridge
  const applyConfig = (config: any = {}) => {
    console.log('[App] Applying config:', config);
    if (!config) return;

    if (config.checkin) {
      setGuest(prev => ({
        ...prev,
        name: config.checkin.guestName || prev.name,
        room: config.checkin.roomNumber || prev.room
      }));
    }
    if (config.location) {
      locationService.getWeather(config.location).then(data => {
        if (data) setWeather(data);
      });
    }
  };

  // Helper to apply state from bridge
  const applyState = (state: any = {}) => {
    console.log('[App] Applying state:', state);
    if (!state) return;

    if (state.guest) {
      setGuest(prev => ({
        ...prev,
        name: state.guest.name || prev.name,
        room: state.guest.roomNumber || prev.room
      }));
    }
    if (typeof state.dnd === 'boolean') {
      setIsDND(state.dnd);
    }
    if (state.weather) {
      setWeather(state.weather);
    }
    if (Array.isArray(state.alarms)) {
      setAlarms(state.alarms);
    }
    if (state.location) {
      locationService.getWeather(state.location).then(data => {
        if (data) setWeather(data);
      });
    }
  };

  // Native bootstrap process
  const bootstrapLauncher = async () => {
    console.log('[Agent] Initializing bootstrap...');
    try {
      await Agent.call({ method: 'system.capabilities' });
    } catch (err) {
      console.warn('Capabilities not available', err);
    }

    try {
      const prefState = await Agent.call({ method: 'pref.get', params: { key: 'state.changed' } });
      if (prefState && (prefState as any).value) {
        applyState((prefState as any).value);
      }
    } catch (err) {
      console.warn('Pref state fetch failed', err);
    }

    try {
      const config = await Agent.call({ method: 'config.get' });
      if (config) applyConfig(config);
    } catch (err) {
      console.warn('Config fetch failed', err);
    }

    try {
      const state = await Agent.call({ method: 'state.get' });
      if (state) applyState(state);
    } catch (err) {
      console.warn('State fetch failed', err);
    }

    // Fallback weather if not loaded
    if (!weather) {
      const weatherData = await locationService.getWeather({
        lat: 37.7749,
        lon: -122.4194,
        city: 'San Francisco'
      });
      if (weatherData) setWeather(weatherData);
    }
  };

  // Initialize bridge and listeners
  useEffect(() => {
    const unbind = Agent.onEvent((detail) => {
      console.log('[Agent Event]', detail);
      if (!detail || !detail.method) return;

      if (detail.method === 'state.changed') {
        applyState(detail.params || {});
      } else if (detail.method === 'ui.checkin') {
        const params = detail.params || {};
        const guestName = params.guestName || (params.guest && params.guest.name);
        const roomNumber = params.roomNumber || (params.guest && params.guest.roomNumber);

        if (guestName || roomNumber) {
          setGuest(prev => ({
            ...prev,
            name: guestName || prev.name,
            room: roomNumber || prev.room
          }));
          setShowSplash(true);
        }
      } else if (detail.method === 'location.update') {
        if (detail.params) {
          locationService.getWeather(detail.params).then(data => {
            if (data) setWeather(data);
          });
        }
      } else if (detail.method === 'ui.toast') {
        const p = detail.params || {};
        showToast(p.title || 'Notification', p.text || '', 'fa-bell');
      }
    });

    // Small delay to ensure native injection is complete
    const timer = setTimeout(() => {
      bootstrapLauncher();
    }, 500);

    return () => {
      unbind();
      clearTimeout(timer);
    };
  }, []);

  // Detect if running in Radix environment and apply optimizations
  useEffect(() => {
    if (isRadixEnvironment()) {
      document.documentElement.classList.add('webview-low-motion');
      setIsLowMotion(true);
    }
  }, []);

  // Scale UI to fit any resolution or high browser zoom.
  useEffect(() => {
    const updateScale = () => {
      const baseWidth = 1920;
      const baseHeight = 1080;
      const zoom = window.visualViewport?.scale || 1;
      const scale = Math.min(window.innerWidth / baseWidth, window.innerHeight / baseHeight) / zoom;
      document.documentElement.style.setProperty('--ui-scale', scale.toFixed(3));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    window.visualViewport?.addEventListener('resize', updateScale);
    window.visualViewport?.addEventListener('scroll', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const launchApp = (packageName: string) => {
    safeRadixLaunch(packageName);
  };

  const handleCheckout = () => {
    safeRadixCommand(RadixCommands.CHECKOUT);
    showToast('Check Out', 'Processing your checkout request...', 'fa-arrow-right-from-bracket', 2500);
  };

  const toggleDND = () => {
    setIsDND(!isDND);
    const newState = !isDND;
    showToast(
      newState ? 'Do Not Disturb ON' : 'Do Not Disturb OFF',
      newState ? 'You will not be disturbed during your rest' : 'Normal service has been resumed',
      'fa-moon'
    );
  };

  const handleSetAlarm = () => {
    showToast('Set Alarm', 'Alarm setup is not configured yet.', 'fa-bell');
  };

  // Handle welcome text phasing: visible -> fading -> hidden
  useEffect(() => {
    if (welcomePhase === 'visible') {
      const timer = setTimeout(() => setWelcomePhase('fading'), 3000);
      return () => clearTimeout(timer);
    } else if (welcomePhase === 'fading') {
      const timer = setTimeout(() => setWelcomePhase('hidden'), 700);
      return () => clearTimeout(timer);
    }
  }, [welcomePhase]);

  // Sync isScrolled with welcomePhase
  useEffect(() => {
    if (isScrolled && welcomePhase === 'visible') {
      setWelcomePhase('fading');
    }
  }, [isScrolled, welcomePhase]);

  useEffect(() => {
    if (!sessionStorage.getItem('radixSplashShown')) {
      setShowSplash(true);
    }

    const interval = setInterval(() => {
      const now = new Date();
      const current = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      alarms.forEach(a => {
        if (a.enabled && a.time === current) {
          alarmAudio.play();
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [alarms]);

  useEffect(() => {
    if (focusedRow !== 'services') return;
    const target = serviceCardRefs.current[focusedIndex];
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [focusedIndex, focusedRow]);

  const dismissSplash = () => {
    setShowSplash(false);
    sessionStorage.setItem('radixSplashShown', 'true');
    alarmAudio.init();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      if (showSplash) { dismissSplash(); return; }
      const isBackKey = ['Escape', 'Backspace', 'BrowserBack', 'GoBack'].includes(e.key) || e.keyCode === 461;

      if (selectedService) {
        if (isBackKey) {
          e.preventDefault();
          setSelectedService(null);
        }
        return;
      }

      const servicesCount = SERVICES.length;
      const appsCount = STREAMING_APPS.length;
      const footerCount = 4;

      if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Enter', 'OK', 'Select'].includes(e.key) || e.code === 'NumpadEnter') {
        e.preventDefault();
      }

      if (e.key === 'ArrowRight') {
        if (focusedRow === 'services') {
          handleElementFocus('services', Math.min(focusedIndex + 1, servicesCount - 1));
        } else if (focusedRow === 'apps') {
          handleElementFocus('apps', Math.min(appFocusedIndex + 1, appsCount - 1));
        } else {
          handleElementFocus('footer', Math.min(footerFocusedIndex + 1, footerCount - 1));
        }
        setIsScrolled(true);
      } else if (e.key === 'ArrowLeft') {
        if (focusedRow === 'services') {
          handleElementFocus('services', Math.max(focusedIndex - 1, 0));
        } else if (focusedRow === 'apps') {
          handleElementFocus('apps', Math.max(appFocusedIndex - 1, 0));
        } else {
          handleElementFocus('footer', Math.max(footerFocusedIndex - 1, 0));
        }
      } else if (e.key === 'ArrowDown') {
        if (focusedRow === 'services') handleElementFocus('apps', Math.min(appFocusedIndex, appsCount - 1));
        if (focusedRow === 'apps') handleElementFocus('footer', Math.min(footerFocusedIndex, footerCount - 1));
      } else if (e.key === 'ArrowUp') {
        if (focusedRow === 'apps') handleElementFocus('services', Math.min(focusedIndex, servicesCount - 1));
        if (focusedRow === 'footer') handleElementFocus('apps', Math.min(appFocusedIndex, appsCount - 1));
      } else if (
        e.key === 'Enter' ||
        e.key === 'OK' ||
        e.key === 'Select' ||
        e.code === 'NumpadEnter'
      ) {
        if (focusedRow === 'services') {
          const service = SERVICES[focusedIndex];
          if (service.id === 'cast') {
            safeRadixCommand(RadixCommands.CAST);
          } else if (service.id === 'tv') {
            safeRadixLaunch(RadixApps.TV);
          } else {
            setSelectedService(service);
          }
        } else if (focusedRow === 'apps') {
          launchApp(STREAMING_APPS[appFocusedIndex].package);
        } else {
          if (footerFocusedIndex === 0) toggleDND();
          if (footerFocusedIndex === 1) handleSetAlarm();
          if (footerFocusedIndex === 2) setShowPrivacyMenu(!showPrivacyMenu);
          if (footerFocusedIndex === 3) handleCheckout();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, appFocusedIndex, footerFocusedIndex, focusedRow, selectedService, showSplash]);

  const getModalContent = (service: Service): ModalContent => {
    switch (service.id) {
      case 'tv':
        return {
          title: 'Live Entertainment',
          type: 'menu',
          image: service.image,
          body: (
            <div className="grid grid-cols-2 gap-4">
              {['Bloomberg TV', 'CNN International', 'ESPN HD', 'Discovery Plus', 'Sky News'].map(ch => (
                <button key={ch} className="modal-focus-ring p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-amber-600/20 hover:border-amber-500/50 transition-all text-left group">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-medium">{ch}</span>
                    <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          )
        };
      case 'dining':
        return {
          title: 'Signature Dining',
          type: 'services',
          image: service.image,
          body: (
            <div className="space-y-4">
              {[
                { name: 'Radix Breakfast Experience', price: '$45', desc: 'Organic eggs, house-made pastries, seasonal fruit, premium coffee' },
                { name: 'Radix Burger', price: '$38', desc: 'Dry-aged beef, black truffle aioli, gold leaf, brioche bun' },
                { name: 'Lobster Risotto', price: '$52', desc: 'Fresh Maine lobster, saffron, aged parmesan, micro-greens' },
                { name: 'Perrier-Jouët Belle Époque', price: '$290', desc: 'Champagne, France (750ml)' }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-6 bg-white/5 rounded-xl border border-white/10">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{item.name}</h3>
                    <p className="text-sm text-slate-400">{item.desc}</p>
                  </div>
                  <span className="text-amber-500 font-bold text-xl">{item.price}</span>
                </div>
              ))}
            </div>
          )
        };
      case 'spa':
        return {
          title: 'Wellness & Sanctuary',
          type: 'services',
          image: service.image,
          body: (
            <div className="space-y-6">
              <p className="text-slate-300 text-lg leading-relaxed">
                Rejuvenate your senses at the Radix Sanctuary. Our treatments combine ancient wisdom with modern techniques.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Midnight Serenity Massage', duration: '90 min', price: '$220' },
                  { name: 'Radiance Glow Facial', duration: '60 min', price: '$185' },
                  { name: 'Private Yoga Session', duration: '60 min', price: '$120' },
                  { name: 'Hydrotherapy Ritual', duration: '45 min', price: '$95' }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <h3 className="text-white font-bold">{item.name}</h3>
                    <div className="flex justify-between mt-2 text-sm">
                      <span className="text-slate-400">{item.duration}</span>
                      <span className="text-amber-500 font-bold">{item.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        };
      case 'concierge':
        return {
          title: 'AI Guest Assistant',
          type: 'services',
          image: service.image,
          body: (
            <div className="space-y-6 text-slate-300">
              <div className="p-6 bg-amber-600/10 border border-amber-600/30 rounded-2xl">
                <p className="text-xl italic leading-relaxed">
                  "Hello {guest.name}, I am your personal Radix Assistant. How may I elevate your stay today?"
                </p>
              </div>
              <ul className="space-y-4">
                <li className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-amber-500 font-bold">1</div>
                  <span>Instant reservations for our Michelin-starred dining</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-amber-500 font-bold">2</div>
                  <span>Curated local experiences and transport arrangements</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-amber-500 font-bold">3</div>
                  <span>Real-time housekeeping and pillow menu requests</span>
                </li>
              </ul>
            </div>
          )
        };
      case 'info':
        return {
          title: 'The Radix Experience',
          type: 'info',
          image: service.image,
          body: (
            <div className="space-y-6 text-slate-300">
              <p className="text-xl leading-relaxed">
                Welcome to the benchmark of modern luxury. Radix Grand stands as an architectural marvel, offering unparalleled views and world-class hospitality.
              </p>
              <div className="grid grid-cols-2 gap-8 py-4 border-y border-white/10">
                <div>
                  <h4 className="text-xs uppercase tracking-widest text-amber-500 mb-2">Check-out</h4>
                  <p className="text-2xl font-light">12:00 PM</p>
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-widest text-amber-500 mb-2">Wi-Fi</h4>
                  <p className="text-2xl font-light">Radix_Premium</p>
                </div>
              </div>
              <p className="text-sm text-slate-400">
                Located in the heart of the city's financial district, featuring 248 bespoke suites, 3 signature restaurants, and an award-winning rooftop infinity pool.
              </p>
            </div>
          )
        };
      case 'cast':
        return {
          title: 'Cast to TV',
          type: 'info',
          body: <p className="text-slate-300 leading-relaxed text-xl">Opening casting interface...</p>
        };
      default:
        return {
          title: service.title,
          subtitle: service.description,
          type: 'info',
          body: <p className="text-slate-300 leading-relaxed text-xl">Our concierge team is standing by to personalize your experience. Please confirm if you wish to proceed with this service.</p>
        };
    }
  };

  return (
    <div className="app-scale">
      <div className="relative w-full h-full overflow-hidden bg-slate-900 text-white font-sans">
        {showSplash && <SplashScreen guest={guest} onDismiss={dismissSplash} />}

        <div className="absolute inset-0 transition-all duration-1000 ease-in-out">
          <div className="absolute inset-0 bg-slate-900/40 z-10" />
          <img
            src={focusedRow === 'services' ? SERVICES[focusedIndex].image : 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=80&w=2000'}
            className={`w-full h-full object-cover opacity-60 transition-all ${isLowMotion ? 'duration-300' : 'blur-sm scale-105 duration-1000'}`}
            alt=""
          />
        </div>

        <Header weather={weather} guest={guest} />

        <main className="relative z-20 h-full flex flex-col justify-end pb-[calc(var(--footer-height)+3rem)] pt-[var(--header-height)]">
          {welcomePhase !== 'hidden' && (
            <div className={`px-[clamp(1rem,4vw,4rem)] mb-8 transition-all duration-700 ${welcomePhase === 'fading' || isScrolled ? 'opacity-0 -translate-y-8' : 'opacity-100'}`}>
              <div className="flex items-center space-x-2 text-amber-500 mb-2 drop-shadow-lg">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
              </div>
              <h2 className="serif text-6xl font-bold mb-2 tracking-tighter">
                Bonjour, <span className="text-amber-500">{guest.name.split(' ')[0]}</span>
              </h2>
              <p className="text-slate-200 text-lg font-light tracking-wide max-w-2xl leading-snug">
                Your sanctuary in Suite {guest.room} is fully prepared. Explore our curated services for an unforgettable stay.
              </p>
            </div>
          )}

          {/* Main Services Row */}
          <div className="mb-4 overflow-visible">
            <h3 className="px-[clamp(1rem,4vw,4rem)] text-[clamp(1.3rem,1.1vw,1rem)] tracking-[0.4em] uppercase font-bold text-amber-500/80 mb-2">Guest Services</h3>
            <div
              ref={scrollContainerRef}
              className="flex space-x-2 overflow-x-auto no-scrollbar items-center py-12 px-[clamp(1rem,4vw,4rem)]"
              style={{ scrollSnapType: 'x proximity' }}
            >
              {SERVICES.map((service, index) => (
                <ServiceCard
                  key={service.id}
                  ref={el => { serviceCardRefs.current[index] = el; }}
                  service={service}
                  isFocused={focusedRow === 'services' && focusedIndex === index}
                  isLowMotion={isLowMotion}
                  onFocus={() => {
                    handleElementFocus('services', index);
                    setIsScrolled(true);
                  }}
                  onClick={() => {
                    if (service.id === 'cast') {
                      safeRadixCommand(RadixCommands.CAST);
                    } else if (service.id === 'tv') {
                      safeRadixLaunch(RadixApps.TV);
                    } else {
                      setSelectedService(service);
                    }
                  }}
                />
              ))}
            </div>
          </div>

          {/* Streaming Apps Row */}
          <div className="px-[clamp(1rem,4vw,4rem)] mb-4">
            <h3 className="text-[clamp(1.0rem,1.0vw,1rem)] tracking-[0.4em] uppercase font-bold text-amber-500/80 mb-4">Streaming Entertainment</h3>
            <div className="flex space-x-6">
              {STREAMING_APPS.map((app, index) => (
                <button
                  key={app.id}
                  onMouseEnter={() => handleElementFocus('apps', index)}
                  onPointerEnter={() => handleElementFocus('apps', index)}
                  tabIndex={-1}
                  onClick={() => launchApp(app.package)}
                  className={`relative h-[clamp(5rem,12vh,7rem)] w-[clamp(9.5rem,24vw,13rem)] rounded-xl overflow-hidden shadow-2xl transition-all duration-500 ease-out flex items-center justify-center group
                  ${focusedRow === 'apps' && appFocusedIndex === index
                      ? 'border-amber-500 border-2 scale-110 shadow-amber-500/40 bg-white/30 ring-4 ring-amber-500/20'
                      : 'bg-white/20 border-white/10 border-2 opacity-100 hover:bg-white/25'}
                `}
                >
                  {/* Logo with subtle highlight */}
                  <div className="relative flex items-center justify-center w-full h-full p-6">
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl rounded-full" />
                    <img
                      src={app.logo}
                      alt={app.name}
                      className={`h-12 w-auto object-contain transition-all duration-500 group-hover:scale-110 drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]
                      ${app.id === 'disney' ? 'brightness-0 invert' : ''}
                    `}
                    />
                  </div>

                  <div className={`absolute bottom-2 text-[8px] font-bold tracking-widest uppercase text-white/80 transition-opacity duration-500 ${focusedRow === 'apps' && appFocusedIndex === index ? 'opacity-100' : 'opacity-0'}`}>
                    {app.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </main>

        <footer className="fixed bottom-0 left-0 right-0 flex items-center justify-between px-[clamp(1rem,4vw,4rem)] z-50 bg-gradient-to-t from-slate-900/90 to-transparent"
          style={{ height: 'var(--footer-height)' }}>
          <div className="flex space-x-6">
            <button
              className={`flex items-center space-x-4 px-8 py-4 rounded-full border transition-all
              ${isDND ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-white/10 border-white/20 text-slate-300 hover:text-white'}
              ${focusedRow === 'footer' && footerFocusedIndex === 0 ? 'ring-4 ring-amber-500/40 text-white' : ''}
            `}
              onMouseEnter={() => handleElementFocus('footer', 0)}
              onPointerEnter={() => handleElementFocus('footer', 0)}
              tabIndex={-1}
              onClick={toggleDND}
            >
              <Moon className={`w-5 h-5 ${isDND ? 'fill-current' : ''}`} />
              <span className="text-[12px] uppercase tracking-widest font-bold">{isDND ? 'Do Not Disturb ON' : 'DND Mode'}</span>
            </button>
            <button
              className={`flex items-center space-x-4 px-8 py-4 rounded-full bg-white/10 border border-white/20 text-slate-300 hover:text-white transition-all
              ${focusedRow === 'footer' && footerFocusedIndex === 1 ? 'ring-4 ring-amber-500/40 text-white' : ''}
            `}
              onMouseEnter={() => handleElementFocus('footer', 1)}
              onPointerEnter={() => handleElementFocus('footer', 1)}
              tabIndex={-1}
              onClick={handleSetAlarm}
            >
              <Clock className="w-5 h-5" />
              <span className="text-[12px] uppercase tracking-widest font-bold">Set Alarm</span>
            </button>
            <button
              ref={privacyButtonRef}
              className={`flex items-center space-x-4 px-8 py-4 rounded-full bg-white/10 border border-white/20 text-slate-300 hover:text-white transition-all
              ${focusedRow === 'footer' && footerFocusedIndex === 2 ? 'ring-4 ring-amber-500/40 text-white' : ''}
            `}
              onMouseEnter={() => handleElementFocus('footer', 2)}
              onPointerEnter={() => handleElementFocus('footer', 2)}
              tabIndex={-1}
              onClick={() => setShowPrivacyMenu(!showPrivacyMenu)}
            >
              <Shield className="w-5 h-5" />
              <span className="text-[12px] uppercase tracking-widest font-bold">Privacy</span>
            </button>
          </div>

          <button
            className={`flex items-center space-x-4 px-11 py-4 bg-red-600/20 hover:bg-red-600 border border-red-600/50 text-red-100 rounded-xl transition-all font-bold uppercase tracking-widest text-[12px]
            ${focusedRow === 'footer' && footerFocusedIndex === 3 ? 'ring-4 ring-amber-500/40 text-white' : ''}
          `}
            onMouseEnter={() => handleElementFocus('footer', 3)}
            onPointerEnter={() => handleElementFocus('footer', 3)}
            tabIndex={-1}
            onClick={handleCheckout}
          >
            <LogOut className="w-4 h-4" />
            <span>Checkout</span>
          </button>
        </footer>

        {selectedService && (
          <OverlayModal
            content={getModalContent(selectedService)}
            onClose={() => setSelectedService(null)}
            isLowMotion={isLowMotion}
          />
        )}

        {alarmAudio.isPlaying && (
          <div className="fixed inset-0 z-[1000] bg-red-950/90 flex flex-col items-center justify-center space-y-8 animate-pulse">
            <Bell className="w-32 h-32 text-white animate-bounce" />
            <h3 className="serif text-6xl font-bold">Wake Up Service</h3>
            <p className="text-2xl opacity-80">Good Morning, Suite {guest.room}</p>
            <button
              className="px-[clamp(2.5rem,6vw,4rem)] py-[clamp(1rem,2.5vw,1.5rem)] bg-white text-red-950 rounded-full font-bold text-2xl hover:scale-110 transition-transform"
              onClick={() => alarmAudio.stop()}
            >
              Dismiss Alarm
            </button>
          </div>
        )}

        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <PrivacyMenu
          isOpen={showPrivacyMenu}
          onClose={() => setShowPrivacyMenu(false)}
          triggerRef={privacyButtonRef}
        />
      </div>
    </div>
  );
};

export default App;
