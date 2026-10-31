import { apiUser } from '@/lib/auth'
import { fetchWeather, weatherAvailable } from '@/lib/weather'

// GET ?lat=1.3&lon=103.8 or ?city=Singapore. Proxied so the API key stays on
// the server.
export async function GET(req: Request) {
  const { unauthorized } = await apiUser()
  if (unauthorized) return unauthorized
  if (!weatherAvailable()) return Response.json({ error: 'Live weather is switched off. Pick the conditions by hand.' }, { status: 503 })

  const params = new URL(req.url).searchParams
  const lat = Number(params.get('lat'))
  const lon = Number(params.get('lon'))
  const city = params.get('city')?.trim().slice(0, 80)

  let where: { lat: number; lon: number } | { city: string }
  if (params.has('lat') && Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) where = { lat, lon }
  else if (city) where = { city }
  else return Response.json({ error: 'Send a location or a city' }, { status: 400 })

  const weather = await fetchWeather(where).catch(() => null)
  if (!weather) return Response.json({ error: "Couldn't get the weather for there. Pick the conditions by hand." }, { status: 502 })
  return Response.json({ weather })
}
