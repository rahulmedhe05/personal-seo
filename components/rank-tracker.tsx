"use client"

import { useState } from "react"
import useSWR from "swr"

interface RankEntry {
  id: string
  domain: string
  keyword: string
  position: number
  device: string
  location: string
  city: string
  country: string
  trackedAt: string
}

// City data organized by country
const CITIES_BY_COUNTRY: Record<string, { name: string; code: string }[]> = {
  US: [
    { name: "New York, NY", code: "new-york-ny" },
    { name: "Los Angeles, CA", code: "los-angeles-ca" },
    { name: "Chicago, IL", code: "chicago-il" },
    { name: "Houston, TX", code: "houston-tx" },
    { name: "Phoenix, AZ", code: "phoenix-az" },
    { name: "Philadelphia, PA", code: "philadelphia-pa" },
    { name: "San Antonio, TX", code: "san-antonio-tx" },
    { name: "San Diego, CA", code: "san-diego-ca" },
    { name: "Dallas, TX", code: "dallas-tx" },
    { name: "San Jose, CA", code: "san-jose-ca" },
    { name: "Austin, TX", code: "austin-tx" },
    { name: "San Francisco, CA", code: "san-francisco-ca" },
    { name: "Seattle, WA", code: "seattle-wa" },
    { name: "Denver, CO", code: "denver-co" },
    { name: "Boston, MA", code: "boston-ma" },
    { name: "Miami, FL", code: "miami-fl" },
    { name: "Atlanta, GA", code: "atlanta-ga" },
    { name: "Las Vegas, NV", code: "las-vegas-nv" },
    { name: "Portland, OR", code: "portland-or" },
    { name: "Detroit, MI", code: "detroit-mi" },
  ],
  UK: [
    { name: "London", code: "london" },
    { name: "Birmingham", code: "birmingham" },
    { name: "Manchester", code: "manchester" },
    { name: "Leeds", code: "leeds" },
    { name: "Glasgow", code: "glasgow" },
    { name: "Liverpool", code: "liverpool" },
    { name: "Bristol", code: "bristol" },
    { name: "Edinburgh", code: "edinburgh" },
    { name: "Sheffield", code: "sheffield" },
    { name: "Cardiff", code: "cardiff" },
  ],
  IN: [
    { name: "Mumbai", code: "mumbai" },
    { name: "Delhi", code: "delhi" },
    { name: "Bangalore", code: "bangalore" },
    { name: "Hyderabad", code: "hyderabad" },
    { name: "Chennai", code: "chennai" },
    { name: "Kolkata", code: "kolkata" },
    { name: "Pune", code: "pune" },
    { name: "Ahmedabad", code: "ahmedabad" },
    { name: "Jaipur", code: "jaipur" },
    { name: "Surat", code: "surat" },
    { name: "Lucknow", code: "lucknow" },
    { name: "Kanpur", code: "kanpur" },
    { name: "Nagpur", code: "nagpur" },
    { name: "Indore", code: "indore" },
    { name: "Thane", code: "thane" },
    { name: "Bhopal", code: "bhopal" },
    { name: "Visakhapatnam", code: "visakhapatnam" },
    { name: "Patna", code: "patna" },
    { name: "Vadodara", code: "vadodara" },
    { name: "Ghaziabad", code: "ghaziabad" },
    { name: "Ludhiana", code: "ludhiana" },
    { name: "Coimbatore", code: "coimbatore" },
    { name: "Kochi", code: "kochi" },
    { name: "Chandigarh", code: "chandigarh" },
    { name: "Guwahati", code: "guwahati" },
  ],
  CA: [
    { name: "Toronto, ON", code: "toronto-on" },
    { name: "Montreal, QC", code: "montreal-qc" },
    { name: "Vancouver, BC", code: "vancouver-bc" },
    { name: "Calgary, AB", code: "calgary-ab" },
    { name: "Edmonton, AB", code: "edmonton-ab" },
    { name: "Ottawa, ON", code: "ottawa-on" },
    { name: "Winnipeg, MB", code: "winnipeg-mb" },
    { name: "Quebec City, QC", code: "quebec-city-qc" },
    { name: "Hamilton, ON", code: "hamilton-on" },
    { name: "Halifax, NS", code: "halifax-ns" },
  ],
  AU: [
    { name: "Sydney, NSW", code: "sydney-nsw" },
    { name: "Melbourne, VIC", code: "melbourne-vic" },
    { name: "Brisbane, QLD", code: "brisbane-qld" },
    { name: "Perth, WA", code: "perth-wa" },
    { name: "Adelaide, SA", code: "adelaide-sa" },
    { name: "Gold Coast, QLD", code: "gold-coast-qld" },
    { name: "Canberra, ACT", code: "canberra-act" },
    { name: "Newcastle, NSW", code: "newcastle-nsw" },
    { name: "Hobart, TAS", code: "hobart-tas" },
    { name: "Darwin, NT", code: "darwin-nt" },
  ],
  DE: [
    { name: "Berlin", code: "berlin" },
    { name: "Hamburg", code: "hamburg" },
    { name: "Munich", code: "munich" },
    { name: "Cologne", code: "cologne" },
    { name: "Frankfurt", code: "frankfurt" },
    { name: "Stuttgart", code: "stuttgart" },
    { name: "Düsseldorf", code: "dusseldorf" },
    { name: "Leipzig", code: "leipzig" },
  ],
  FR: [
    { name: "Paris", code: "paris" },
    { name: "Marseille", code: "marseille" },
    { name: "Lyon", code: "lyon" },
    { name: "Toulouse", code: "toulouse" },
    { name: "Nice", code: "nice" },
    { name: "Nantes", code: "nantes" },
    { name: "Bordeaux", code: "bordeaux" },
  ],
  AE: [
    { name: "Dubai", code: "dubai" },
    { name: "Abu Dhabi", code: "abu-dhabi" },
    { name: "Sharjah", code: "sharjah" },
    { name: "Ajman", code: "ajman" },
  ],
  SG: [
    { name: "Singapore", code: "singapore" },
  ],
}

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "UK", name: "United Kingdom" },
  { code: "IN", name: "India" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "AE", name: "UAE" },
  { code: "SG", name: "Singapore" },
]

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function RankTracker() {
  const [domain, setDomain] = useState("")
  const [keyword, setKeyword] = useState("")
  const [country, setCountry] = useState("IN")
  const [city, setCity] = useState("mumbai")
  const [device, setDevice] = useState("desktop")
  const [isTracking, setIsTracking] = useState(false)

  const { data: rankings, mutate } = useSWR("/api/rank-tracking", fetcher)

  // Get cities for selected country
  const availableCities = CITIES_BY_COUNTRY[country] || []

  // Update city when country changes
  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry)
    const cities = CITIES_BY_COUNTRY[newCountry]
    if (cities && cities.length > 0) {
      setCity(cities[0].code)
    }
  }

  const handleTrack = async () => {
    if (!domain.trim() || !keyword.trim()) return

    setIsTracking(true)
    
    const selectedCity = availableCities.find(c => c.code === city)
    const location = `${selectedCity?.name || city}, ${country}`

    const res = await fetch("/api/rank-tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        domain, 
        keyword, 
        location,
        city: selectedCity?.name || city,
        country,
        device 
      }),
    })

    if (res.ok) {
      setDomain("")
      setKeyword("")
      mutate()
    }
    setIsTracking(false)
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/rank-tracking/${id}`, {
      method: "DELETE",
    })
    if (res.ok) {
      mutate()
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Add Ranking to Track</h3>
        <p className="text-slate-600 text-sm mb-4">
          Track your keyword rankings at city level for precise local SEO monitoring.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Domain (example.com)"
            className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Keyword to track"
            className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
            <select
              value={country}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableCities.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Device</label>
            <select
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
            </select>
          </div>
        </div>
        
        <button
          onClick={handleTrack}
          disabled={isTracking || !domain.trim() || !keyword.trim()}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:bg-slate-400"
        >
          {isTracking ? "Checking Rank..." : "Track Ranking"}
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Tracked Rankings</h3>
        {rankings && rankings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Domain</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Keyword</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Position</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">City / Location</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Device</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Tracked</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((rank: RankEntry) => (
                  <tr key={rank.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium">{rank.domain}</td>
                    <td className="py-3 px-4">{rank.keyword}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold ${
                          rank.position <= 3
                            ? "bg-green-100 text-green-800"
                            : rank.position <= 10
                            ? "bg-emerald-100 text-emerald-700"
                            : rank.position <= 30
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        #{rank.position}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span className="text-lg">📍</span>
                        <span>{rank.location}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize">{rank.device === 'mobile' ? '📱' : '💻'} {rank.device}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{new Date(rank.trackedAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDelete(rank.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-600 text-center py-8">No rankings tracked yet. Add one to get started.</p>
        )}
      </div>
    </div>
  )
}
