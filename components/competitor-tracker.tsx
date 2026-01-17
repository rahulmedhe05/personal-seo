"use client"

import { useState } from "react"
import useSWR from "swr"

interface Competitor {
  id: string
  your_domain: string
  competitor_domain: string
  created_at: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function CompetitorTracker() {
  const [yourDomain, setYourDomain] = useState("")
  const [competitorDomain, setCompetitorDomain] = useState("")

  const { data: competitors, mutate } = useSWR("/api/competitors", fetcher)

  const handleAddCompetitor = async () => {
    if (!yourDomain.trim() || !competitorDomain.trim()) return

    const res = await fetch("/api/competitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ yourDomain, competitorDomain }),
    })

    if (res.ok) {
      setYourDomain("")
      setCompetitorDomain("")
      mutate()
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/competitors/${id}`, {
      method: "DELETE",
    })

    if (res.ok) {
      mutate()
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Competitor</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            value={yourDomain}
            onChange={(e) => setYourDomain(e.target.value)}
            placeholder="Your domain"
            className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={competitorDomain}
            onChange={(e) => setCompetitorDomain(e.target.value)}
            placeholder="Competitor domain"
            className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddCompetitor}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Add Competitor
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Competitors</h3>
        {competitors && competitors.length > 0 ? (
          <div className="space-y-3">
            {competitors.map((comp: Competitor) => (
              <div
                key={comp.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div>
                  <div className="font-semibold text-slate-900">{comp.competitor_domain}</div>
                  <div className="text-sm text-slate-600">Tracked for {comp.your_domain}</div>
                </div>
                <button onClick={() => handleDelete(comp.id)} className="text-red-600 hover:text-red-700 font-medium">
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600 text-center py-8">No competitors added yet.</p>
        )}
      </div>
    </div>
  )
}
