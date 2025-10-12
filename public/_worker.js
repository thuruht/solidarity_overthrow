// public/_worker.js

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/weather')) {
      return handleWeatherRequest(request, env);
    }

    // Serve static assets
    return env.ASSETS.fetch(request);
  },
};

async function handleWeatherRequest(request, env) {
  const url = new URL(request.url);
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');

  if (!lat || !lon) {
    return new Response('Missing lat or lon parameter', { status: 400 });
  }

  const apiKey = env.OWM_API_KEY;
  if (!apiKey) {
    return new Response('Missing OWM_API_KEY secret', { status: 500 });
  }

  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Error fetching weather data', { status: 500 });
  }
}
