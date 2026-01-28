"use client";

import { useState } from "react";
import { LogIn, LogOut, Clock, User, CheckCircle, XCircle } from "lucide-react";

const enfants = [
  { id: 1, prenom: "Leo", nom: "Martin", arrivee: "08:15", depart: null },
  { id: 2, prenom: "Emma", nom: "Dubois", arrivee: "08:30", depart: null },
  { id: 3, prenom: "Lucas", nom: "Bernard", arrivee: "08:45", depart: null },
  { id: 4, prenom: "Chloe", nom: "Petit", arrivee: null, depart: null },
  { id: 5, prenom: "Hugo", nom: "Robert", arrivee: "09:15", depart: "17:30" },
  { id: 6, prenom: "Lea", nom: "Richard", arrivee: "07:45", depart: null },
  { id: 7, prenom: "Nathan", nom: "Durand", arrivee: null, depart: null },
  { id: 8, prenom: "Camille", nom: "Moreau", arrivee: "09:30", depart: null },
];

export default function PointagePage() {
  const [selectedEnfant, setSelectedEnfant] = useState<number | null>(null);

  const presents = enfants.filter((e) => e.arrivee && !e.depart);
  const absents = enfants.filter((e) => !e.arrivee);
  const partis = enfants.filter((e) => e.depart);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pointage</h1>
          <p className="text-slate-500">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Presents: {presents.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
            <span>Absents: {absents.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Partis: {partis.length}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{presents.length}</p>
              <p className="text-sm text-slate-500">Presents</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-2 rounded-lg">
              <XCircle className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{absents.length}</p>
              <p className="text-sm text-slate-500">Non arrives</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <LogOut className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{partis.length}</p>
              <p className="text-sm text-slate-500">Partis</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </p>
              <p className="text-sm text-slate-500">Heure actuelle</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick pointage */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h2 className="font-semibold text-slate-800 mb-4">Pointage rapide</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {enfants.map((enfant) => {
            const isPresent = enfant.arrivee && !enfant.depart;
            const isAbsent = !enfant.arrivee;
            const isGone = enfant.depart;

            return (
              <button
                key={enfant.id}
                onClick={() => setSelectedEnfant(enfant.id)}
                className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                  selectedEnfant === enfant.id
                    ? "border-indigo-500 bg-indigo-50"
                    : isGone
                    ? "border-blue-200 bg-blue-50"
                    : isPresent
                    ? "border-green-200 bg-green-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="relative">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                      isGone
                        ? "bg-blue-400"
                        : isPresent
                        ? "bg-green-500"
                        : "bg-slate-300"
                    }`}
                  >
                    {enfant.prenom[0]}
                  </div>
                </div>
                <p className="mt-2 font-medium text-sm text-slate-700">{enfant.prenom}</p>
                <p className="text-xs text-slate-500">
                  {isGone
                    ? `Parti ${enfant.depart}`
                    : isPresent
                    ? `Arrive ${enfant.arrivee}`
                    : "Non arrive"}
                </p>
              </button>
            );
          })}
        </div>

        {selectedEnfant && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2">
                <LogIn className="w-5 h-5" />
                Enregistrer arrivee
              </button>
              <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2">
                <LogOut className="w-5 h-5" />
                Enregistrer depart
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Historique du jour */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Historique du jour</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {enfants
            .filter((e) => e.arrivee)
            .sort((a, b) => (b.arrivee || "").localeCompare(a.arrivee || ""))
            .map((enfant) => (
              <div key={enfant.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {enfant.prenom[0]}
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">
                      {enfant.prenom} {enfant.nom}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <LogIn className="w-4 h-4 text-green-500" />
                    <span className="text-slate-600">{enfant.arrivee}</span>
                  </div>
                  {enfant.depart ? (
                    <div className="flex items-center gap-2">
                      <LogOut className="w-4 h-4 text-blue-500" />
                      <span className="text-slate-600">{enfant.depart}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">En cours...</span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
