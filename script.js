const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

const lazyVideoObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries, lazyObserver) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;

    const video = entry.target;
    if (video.dataset.loaded === 'true') return;

    const source = document.createElement('source');
    source.src = video.dataset.videoSrc;
    source.type = 'video/mp4';
    video.appendChild(source);
    video.dataset.loaded = 'true';
    video.load();
    video.play().catch(() => {});
    lazyObserver.unobserve(video);
  });
}, { rootMargin: '200px 0px' }) : null;

document.querySelectorAll('.lazy-video').forEach((video) => {
  if (lazyVideoObserver) {
    lazyVideoObserver.observe(video);
    return;
  }

  const source = document.createElement('source');
  source.src = video.dataset.videoSrc;
  source.type = 'video/mp4';
  video.appendChild(source);
  video.load();
  video.play().catch(() => {});
});

const productInfoNavItems = [...document.querySelectorAll('.product-info-nav')];
const productInfoPanels = [...document.querySelectorAll('.product-info-panel')];

function setActiveProductInfo(panelId) {
  productInfoNavItems.forEach((navItem) => {
    const isActive = navItem.dataset.productPanel === panelId;
    navItem.classList.toggle('is-active', isActive);
    navItem.setAttribute('aria-current', isActive ? 'true' : 'false');
    navItem.removeAttribute('aria-expanded');
  });
}

productInfoNavItems.forEach((trigger) => {
  trigger.addEventListener('click', () => {
    setActiveProductInfo(trigger.dataset.productPanel);
    document.getElementById(trigger.dataset.productPanel)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    productInfoScrollLock = true;
    window.setTimeout(() => {
      productInfoScrollLock = false;
      updateActiveProductInfo();
    }, 800);
  });
});

let productInfoScrollLock = false;

if (productInfoPanels.length) {
  setActiveProductInfo(productInfoPanels[0].id);
  const updateActiveProductInfo = () => {
    const readingLine = window.innerHeight * .28;
    const passedPanels = productInfoPanels.filter((panel) => panel.getBoundingClientRect().top <= readingLine);
    const activePanel = passedPanels[passedPanels.length - 1] || productInfoPanels[0];
    setActiveProductInfo(activePanel.id);
  };
  let activeUpdatePending = false;
  window.addEventListener('scroll', () => {
    if (productInfoScrollLock || activeUpdatePending) return;
    activeUpdatePending = true;
    window.requestAnimationFrame(() => {
      updateActiveProductInfo();
      activeUpdatePending = false;
    });
  }, { passive: true });
  updateActiveProductInfo();
}

const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');

if (mobileMenuToggle && mobileMenu) {
  mobileMenuToggle.addEventListener('click', () => {
    const isOpen = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
    mobileMenuToggle.setAttribute('aria-expanded', String(!isOpen));
    mobileMenuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
    mobileMenu.hidden = isOpen;
  });

  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenuToggle.setAttribute('aria-expanded', 'false');
      mobileMenuToggle.setAttribute('aria-label', 'Open navigation');
      mobileMenu.hidden = true;
    });
  });
}

const BLINKIT_FALLBACK = 'https://blinkit.com/prn/x/prid/785887';
const BLINKIT_SESSION_KEY = 'newMonkBlinkitLocation';
const blinkitLinks = document.querySelectorAll('.blinkit-cta');
let blinkitLocationRequest = null;

let blinkitUrlConfig = { IN_DEFAULT: BLINKIT_FALLBACK, cities: {} };

function normalizeCity(city) {
  return city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

function getCityUrl(city) {
  const normalizedCity = normalizeCity(city);
  const cityKey = Object.keys(blinkitUrlConfig.cities).find((key) => normalizeCity(key) === normalizedCity);
  const destination = blinkitUrlConfig.cities[cityKey] || blinkitUrlConfig.cities[normalizedCity];
  const fallback = blinkitUrlConfig.IN_DEFAULT;
  const resolvedDestination = destination || fallback;
  return typeof resolvedDestination === 'string' && resolvedDestination.startsWith('https://blinkit.com/')
    ? resolvedDestination
    : BLINKIT_FALLBACK;
}

function setBlinkitDestination(city) {
  const destination = city ? getCityUrl(city) : BLINKIT_FALLBACK;
  blinkitLinks.forEach((link) => {
    link.href = destination;
  });
  return destination;
}

function getBrowserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 300000
    });
  });
}

async function getCityFromCoordinates(latitude, longitude) {
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`, {
    headers: { Accept: 'application/json' }
  });
  if (!response.ok) throw new Error('Location lookup failed');

  const location = await response.json();
  if (location.address?.country_code !== 'in') throw new Error('Location is outside India');
  return location.address.city || location.address.town || location.address.village || location.address.municipality || null;
}

async function resolveBlinkitFromBrowserLocation() {
  const position = await getBrowserPosition();
  return getCityFromCoordinates(position.coords.latitude, position.coords.longitude);
}

async function handleBlinkitClick(event) {
  if (event.currentTarget.dataset.locationResolved === 'true') {
    delete event.currentTarget.dataset.locationResolved;
    return;
  }

  event.preventDefault();
  const clickedLink = event.currentTarget;
  const fallbackDestination = clickedLink.href || BLINKIT_FALLBACK;

  if (!blinkitLocationRequest) {
    blinkitLocationRequest = resolveBlinkitFromBrowserLocation()
      .then((city) => city ? setBlinkitDestination(city) : Promise.reject(new Error('City not found')))
      .catch(() => resolveBlinkitDestination().then(() => clickedLink.href || fallbackDestination))
      .finally(() => {
        blinkitLocationRequest = null;
      });
  }

  const destination = await blinkitLocationRequest;
  clickedLink.href = destination || fallbackDestination;
  clickedLink.dataset.locationResolved = 'true';
  clickedLink.click();
}

async function loadBlinkitConfig() {
  try {
    const response = await fetch('/config/blinkit-urls.json', { headers: { Accept: 'application/json' } });
    if (response.ok) {
      blinkitUrlConfig = await response.json();
    }
  } catch {
    blinkitUrlConfig = { IN_DEFAULT: BLINKIT_FALLBACK, cities: {} };
  }
}

async function resolveBlinkitDestination() {
  setBlinkitDestination('');
  let cachedLocation = null;
  try {
    cachedLocation = JSON.parse(sessionStorage.getItem(BLINKIT_SESSION_KEY) || 'null');
  } catch {
    cachedLocation = null;
  }
  if (cachedLocation?.city) {
    setBlinkitDestination(cachedLocation.city);
    return;
  }

  try {
    const response = await fetch('/api/detect-city', { headers: { Accept: 'application/json' } });
    if (!response.ok) return;
    const location = await response.json();
    if (location.city) {
      try {
        sessionStorage.setItem(BLINKIT_SESSION_KEY, JSON.stringify({ city: location.city }));
      } catch {
      }
      setBlinkitDestination(location.city);
    }
  } catch {
    setBlinkitDestination('');
  }
}

loadBlinkitConfig().then(resolveBlinkitDestination);
