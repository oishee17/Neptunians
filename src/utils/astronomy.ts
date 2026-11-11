import { ExoplanetData } from '../types/exoplanet';

/**
 * Approximate planetary size classification based on Earth radii
 */
export function classifyPlanetSize(radius: number | null): {
  category: string;
  label: string;
  color: string;
  description: string;
} {
  if (radius == null || isNaN(radius)) {
    return {
      category: 'unknown',
      label: 'Unmeasured Radius',
      color: 'text-slate-400',
      description: 'Radius not determined by transit geometry.',
    };
  }

  if (radius < 0.8) {
    return {
      category: 'sub-earth',
      label: 'Sub-Earth',
      color: 'text-amber-400',
      description: 'Smaller than Earth, similar in scale to Mars or Mercury.',
    };
  }
  if (radius <= 1.25) {
    return {
      category: 'earth-sized',
      label: 'Earth-sized',
      color: 'text-emerald-400',
      description: 'Comparable in radius to Earth (0.8 - 1.25 R⊕).',
    };
  }
  if (radius <= 2.0) {
    return {
      category: 'super-earth',
      label: 'Super-Earth',
      color: 'text-cyan-400',
      description: 'Larger than Earth but smaller than Neptune, likely rocky or water-rich.',
    };
  }
  if (radius <= 4.0) {
    return {
      category: 'mini-neptune',
      label: 'Sub-Neptune',
      color: 'text-blue-400',
      description: 'Volatile-rich world with substantial hydrogen-helium envelope.',
    };
  }
  if (radius <= 6.0) {
    return {
      category: 'neptune-sized',
      label: 'Neptune-sized',
      color: 'text-indigo-400',
      description: 'Ice giant comparable to Neptune or Uranus in our Solar System.',
    };
  }
  if (radius <= 15.0) {
    return {
      category: 'jupiter-sized',
      label: 'Gas Giant (Jupiter-sized)',
      color: 'text-purple-400',
      description: 'Massive hydrogen-dominated gas giant resembling Jupiter or Saturn.',
    };
  }
  return {
    category: 'larger-jupiter',
    label: 'Super-Jupiter',
    color: 'text-rose-400',
    description: 'Extremely puffy or massive giant planet exceeding Jupiter in radius.',
  };
}

/**
 * Surface gravity calculation relative to Earth
 * g/g_earth = (M / M_earth) / (R / R_earth)^2
 */
export function calculateSurfaceGravityRatio(
  massEarth: number | null,
  radiusEarth: number | null
): {
  ratio: number | null;
  status: 'valid' | 'missing_mass' | 'missing_radius' | 'missing_both';
  message: string;
} {
  const hasMass = massEarth != null && !isNaN(massEarth) && massEarth > 0;
  const hasRadius = radiusEarth != null && !isNaN(radiusEarth) && radiusEarth > 0;

  if (!hasMass && !hasRadius) {
    return {
      ratio: null,
      status: 'missing_both',
      message: 'Both mass and radius measurements are unavailable for this world.',
    };
  }
  if (!hasMass) {
    return {
      ratio: null,
      status: 'missing_mass',
      message: 'Mass measurement is unavailable (planet was discovered solely via transit).',
    };
  }
  if (!hasRadius) {
    return {
      ratio: null,
      status: 'missing_radius',
      message: 'Radius measurement is unavailable (planet was discovered solely via radial velocity).',
    };
  }

  const gRatio = massEarth! / (radiusEarth! * radiusEarth!);
  return {
    ratio: Number(gRatio.toFixed(2)),
    status: 'valid',
    message: 'Theoretical surface gravity calculated using Newton’s universal gravitation law.',
  };
}

/**
 * Circumstellar Habitable Zone boundaries (Kopparapu et al. stellar flux model)
 * Approximated based on stellar effective temperature and luminosity
 */
export function calculateHabitableZone(planet: ExoplanetData): {
  innerAU: number | null; // Runaway Greenhouse
  outerAU: number | null; // Maximum Greenhouse
  optimisticInnerAU: number | null; // Recent Venus
  optimisticOuterAU: number | null; // Early Mars
  status: 'conservative' | 'optimistic' | 'too_hot' | 'too_cold' | 'insufficient_data';
  description: string;
} {
  // If we have stellar luminosity or can estimate it from radius and temperature
  let lum = planet.st_lum != null ? Math.pow(10, planet.st_lum) : null;
  const teff = planet.st_teff;
  const rad = planet.st_rad;

  if (lum == null && teff != null && rad != null) {
    // Stefan-Boltzmann L/L_sun = (R/R_sun)^2 * (T/T_sun)^4 where T_sun = 5778K
    lum = Math.pow(rad, 2) * Math.pow(teff / 5778, 4);
  }

  if (lum == null || isNaN(lum) || lum <= 0) {
    return {
      innerAU: null,
      outerAU: null,
      optimisticInnerAU: null,
      optimisticOuterAU: null,
      status: 'insufficient_data',
      description: 'Host star luminosity and effective temperature data insufficient to compute zone boundaries.',
    };
  }

  // Effective stellar flux values based on Kopparapu et al.
  // Standard solar baseline:
  // Recent Venus Seff ~ 1.776, Runaway Greenhouse ~ 1.014
  // Maximum Greenhouse ~ 0.350, Early Mars ~ 0.320
  const sRecentVenus = 1.776;
  const sRunaway = 1.014;
  const sMaxGreenhouse = 0.350;
  const sEarlyMars = 0.320;

  const optInner = Math.sqrt(lum / sRecentVenus);
  const consInner = Math.sqrt(lum / sRunaway);
  const consOuter = Math.sqrt(lum / sMaxGreenhouse);
  const optOuter = Math.sqrt(lum / sEarlyMars);

  const orbDistance = planet.pl_orbsmax;
  if (orbDistance == null || isNaN(orbDistance)) {
    return {
      innerAU: Number(consInner.toFixed(3)),
      outerAU: Number(consOuter.toFixed(3)),
      optimisticInnerAU: Number(optInner.toFixed(3)),
      optimisticOuterAU: Number(optOuter.toFixed(3)),
      status: 'insufficient_data',
      description: 'Orbital semi-major axis is unknown; cannot place planet within the computed habitable zone.',
    };
  }

  if (orbDistance >= consInner && orbDistance <= consOuter) {
    return {
      innerAU: Number(consInner.toFixed(3)),
      outerAU: Number(consOuter.toFixed(3)),
      optimisticInnerAU: Number(optInner.toFixed(3)),
      optimisticOuterAU: Number(optOuter.toFixed(3)),
      status: 'conservative',
      description: 'Inside the Conservative Habitable Zone (between runaway greenhouse and maximum greenhouse limits).',
    };
  }

  if (
    (orbDistance >= optInner && orbDistance < consInner) ||
    (orbDistance > consOuter && orbDistance <= optOuter)
  ) {
    return {
      innerAU: Number(consInner.toFixed(3)),
      outerAU: Number(consOuter.toFixed(3)),
      optimisticInnerAU: Number(optInner.toFixed(3)),
      optimisticOuterAU: Number(optOuter.toFixed(3)),
      status: 'optimistic',
      description: 'Inside the Optimistic Habitable Zone (potential liquid water under specific greenhouse conditions).',
    };
  }

  if (orbDistance < optInner) {
    return {
      innerAU: Number(consInner.toFixed(3)),
      outerAU: Number(consOuter.toFixed(3)),
      optimisticInnerAU: Number(optInner.toFixed(3)),
      optimisticOuterAU: Number(optOuter.toFixed(3)),
      status: 'too_hot',
      description: 'Inside the inner boundary: stellar irradiance is too intense, likely producing runaway evaporation.',
    };
  }

  return {
    innerAU: Number(consInner.toFixed(3)),
    outerAU: Number(consOuter.toFixed(3)),
    optimisticInnerAU: Number(optInner.toFixed(3)),
    optimisticOuterAU: Number(optOuter.toFixed(3)),
    status: 'too_cold',
    description: 'Beyond the outer boundary: stellar irradiance is too faint, leading to global surface glaciation.',
  };
}

/**
 * Formats temperature Kelvin to both K and Celsius
 */
export function formatKelvinAndCelsius(kelvin: number | null): string {
  if (kelvin == null || isNaN(kelvin)) return 'N/A';
  const c = Math.round(kelvin - 273.15);
  return `${Math.round(kelvin)} K (${c > 0 ? '+' : ''}${c} °C)`;
}

/**
 * Returns star color hex based on spectral type or effective temperature
 */
export function getStarColor(specType: string | null, teff: number | null): string {
  if (specType) {
    const s = specType.trim().toUpperCase()[0];
    switch (s) {
      case 'O':
        return '#93c5fd'; // brilliant blue
      case 'B':
        return '#60a5fa'; // blue
      case 'A':
        return '#bfdbfe'; // light blue-white
      case 'F':
        return '#fef08a'; // yellow-white
      case 'G':
        return '#facc15'; // solar yellow
      case 'K':
        return '#fb923c'; // orange
      case 'M':
        return '#f87171'; // red dwarf
    }
  }

  if (teff != null) {
    if (teff >= 30000) return '#93c5fd';
    if (teff >= 10000) return '#60a5fa';
    if (teff >= 7500) return '#bfdbfe';
    if (teff >= 6000) return '#fef08a';
    if (teff >= 5200) return '#facc15';
    if (teff >= 3700) return '#fb923c';
    return '#f87171';
  }

  return '#e2e8f0';
}
