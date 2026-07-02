import React from "react";
import WeatherBackground from "./WeatherBackground";
import { useWeather } from "../../hooks/useWeather";

// Drop-in weather atmosphere: resolves location + live weather, then renders the
// animated background. `enabled` is passed straight through (the hook no-ops
// when false) so hook order stays stable for the parent.
export default function WeatherLayer({ enabled = true, preferGeo = false, zIndex = 40, opacity = 0.9 }) {
  const { weather } = useWeather({ enabled, preferGeo });
  if (!enabled || !weather) return null;
  return (
    <WeatherBackground
      condition={weather.condition}
      isDay={weather.isDay}
      zIndex={zIndex}
      opacity={opacity}
    />
  );
}
