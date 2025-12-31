/**
 * Location and Weather Service
 * Handles geolocation and weather data fetching
 */

export interface Location {
    lat: number;
    lon: number;
    city?: string;
}

export interface WeatherData {
    temp: number;
    condition: string;
    city: string;
    icon: string;
    forecast: ForecastDay[];
}

export interface ForecastDay {
    day: string;
    temp: number;
    icon: string;
}

class LocationService {
    private geolocationRequested = false;
    private geolocationWatchId: number | null = null;

    /**
     * Weather code to icon mapping (Open-Meteo format)
     */
    private weatherCodeToIconBase(code: number): string {
        const mapping: Record<number, string> = {
            0: '01', 1: '02', 2: '03', 3: '04',
            45: '50', 48: '50',
            51: '10', 53: '10', 55: '10',
            61: '10', 63: '10', 65: '10',
            71: '13', 73: '13', 75: '13',
            77: '13', 80: '10', 81: '10', 82: '10',
            85: '13', 86: '13',
            95: '11', 96: '11', 99: '11'
        };
        return mapping[code] || '03';
    }

    /**
     * Weather code to human-readable condition
     */
    private weatherCodeToCondition(code: number): string {
        const conditions: Record<number, string> = {
            0: 'Clear Sky',
            1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
            45: 'Foggy', 48: 'Depositing Rime Fog',
            51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
            61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
            71: 'Slight Snow', 73: 'Moderate Snow', 75: 'Heavy Snow',
            77: 'Snow Grains', 80: 'Slight Showers', 81: 'Moderate Showers', 82: 'Violent Showers',
            85: 'Slight Snow Showers', 86: 'Heavy Snow Showers',
            95: 'Thunderstorm', 96: 'Thunderstorm with Hail', 99: 'Severe Thunderstorm'
        };
        return conditions[code] || 'Cloudy';
    }

    /**
     * Icon map for Font Awesome
     */
    private iconMap: Record<string, string> = {
        '01d': 'sun', '01n': 'moon', '02d': 'cloud-sun', '02n': 'cloud-moon',
        '03d': 'cloud', '03n': 'cloud', '04d': 'cloud', '04n': 'cloud',
        '09d': 'cloud-showers-heavy', '09n': 'cloud-showers-heavy',
        '10d': 'cloud-sun-rain', '10n': 'cloud-moon-rain',
        '11d': 'bolt', '11n': 'bolt', '13d': 'snowflake', '13n': 'snowflake',
        '50d': 'smog', '50n': 'smog'
    };

    /**
     * Determine if it's currently daytime
     */
    private isDaytime(sunrise?: string, sunset?: string): boolean {
        if (!sunrise || !sunset) return true;
        const now = new Date();
        const sunriseTime = new Date(sunrise);
        const sunsetTime = new Date(sunset);
        return now >= sunriseTime && now < sunsetTime;
    }

    /**
     * Reverse geocode to get city name
     */
    async reverseGeocode(lat: number, lon: number): Promise<string> {
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`;
            const res = await fetch(url, {
                headers: { 'User-Agent': 'HotelTVLauncher/1.0' }
            });
            if (!res.ok) return '';
            const json = await res.json();
            return json.address?.city || json.address?.town || json.address?.village || json.address?.municipality || '';
        } catch (err) {
            console.warn('Reverse geocode failed', err);
            return '';
        }
    }

    /**
     * Fetch weather data for a location
     */
    async fetchWeather(location: Location): Promise<WeatherData | null> {
        try {
            const { lat, lon } = location;
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&daily=weathercode,temperature_2m_max,sunrise,sunset&timezone=auto`;

            const [weatherRes, cityName] = await Promise.all([
                fetch(weatherUrl),
                this.reverseGeocode(lat, lon)
            ]);

            if (!weatherRes.ok) throw new Error('weather fetch failed');
            const json = await weatherRes.json();

            // Get sunrise/sunset for day/night detection
            const todaySunrise = json.daily?.sunrise?.[0];
            const todaySunset = json.daily?.sunset?.[0];
            const isDay = this.isDaytime(todaySunrise, todaySunset);
            const suffix = isDay ? 'd' : 'n';

            // Current weather
            const weatherCode = json.current?.weathercode || 0;
            const iconBase = this.weatherCodeToIconBase(weatherCode);
            const icon = iconBase + suffix;
            const condition = this.weatherCodeToCondition(weatherCode);

            // Forecast (always use day icons)
            const forecast: ForecastDay[] = (json.daily?.time || []).slice(1, 4).map((day: string, idx: number) => ({
                day: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
                temp: Math.round(json.daily.temperature_2m_max[idx + 1] || 0),
                icon: this.weatherCodeToIconBase(json.daily.weathercode[idx + 1]) + 'd'
            }));

            return {
                temp: Math.round(json.current?.temperature_2m || 0),
                condition,
                icon: this.iconMap[icon] || 'cloud',
                city: cityName || location.city || '',
                forecast
            };
        } catch (err) {
            console.warn('Weather fetch failed', err);
            return null;
        }
    }

    /**
     * Request geolocation from browser
     */
    async requestGeolocation(): Promise<Location | null> {
        if (!navigator.geolocation || this.geolocationRequested) {
            return null;
        }

        this.geolocationRequested = true;

        return new Promise((resolve, reject) => {
            const onSuccess = (pos: GeolocationPosition) => {
                if (this.geolocationWatchId != null) {
                    navigator.geolocation.clearWatch(this.geolocationWatchId);
                    this.geolocationWatchId = null;
                }
                resolve({
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude
                });
            };

            const onError = (err: GeolocationPositionError) => {
                console.warn('Geolocation failed', err);
                if (err.code === 1) {
                    // Permission denied
                    reject(new Error('Location access denied'));
                    return;
                }
                // Try watch position as fallback
                if (this.geolocationWatchId == null) {
                    this.geolocationWatchId = navigator.geolocation.watchPosition(
                        (pos) => onSuccess(pos),
                        (watchErr) => {
                            console.warn('Geolocation watch failed', watchErr);
                            reject(watchErr);
                        },
                        { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 }
                    );
                }
            };

            navigator.geolocation.getCurrentPosition(
                onSuccess,
                onError,
                { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 }
            );
        });
    }

    /**
     * Get weather for current location or fallback
     */
    async getWeather(fallbackLocation?: Location): Promise<WeatherData | null> {
        try {
            const location = await this.requestGeolocation();
            if (location) {
                return await this.fetchWeather(location);
            }
        } catch (err) {
            console.warn('Could not get current location', err);
        }

        // Use fallback if provided
        if (fallbackLocation) {
            return await this.fetchWeather(fallbackLocation);
        }

        return null;
    }
}

export const locationService = new LocationService();
