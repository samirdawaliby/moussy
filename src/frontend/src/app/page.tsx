"use client";

import {
  Users,
  Clock,
  Utensils,
  Moon,
  AlertTriangle,
  TrendingUp,
  Baby,
  CheckCircle2,
} from "lucide-react";

// Mock data pour la demo
const stats = [
  { name: "Enfants presents", value: "8", total: "12", icon: Users, color: "bg-green-500" },
  { name: "Heures aujourd'hui", value: "45.5", icon: Clock, color: "bg-blue-500" },
  { name: "Repas servis", value: "16", icon: Utensils, color: "bg-orange-500" },
  { name: "Siestes en cours", value: "3", icon: Moon, color: "bg-purple-500" },
];

const enfantsPresents = [
  { id: 1, prenom: "Leo", nom: "Martin", arrivee: "08:15", statut: "present" },
  { id: 2, prenom: "Emma", nom: "Dubois", arrivee: "08:30", statut: "present" },
  { id: 3, prenom: "Lucas", nom: "Bernard", arrivee: "08:45", statut: "sieste" },
  { id: 4, prenom: "Chloe", nom: "Petit", arrivee: "09:00", statut: "present" },
  { id: 5, prenom: "Hugo", nom: "Robert", arrivee: "09:15", statut: "sieste" },
  { id: 6, prenom: "Lea", nom: "Richard", arrivee: "07:45", statut: "present" },
  { id: 7, prenom: "Nathan", nom: "Durand", arrivee: "08:00", statut: "sieste" },
  { id: 8, prenom: "Camille", nom: "Moreau", arrivee: "09:30", statut: "present" },
];

const activitesRecentes = [
  { heure: "12:30", enfant: "Leo", type: "repas", detail: "Dejeuner - A bien mange" },
  { heure: "12:15", enfant: "Emma", type: "repas", detail: "Dejeuner - Peu mange" },
  { heure: "12:00", enfant: "Lucas", type: "sommeil", detail: "Debut sieste" },
  { heure: "11:45", enfant: "Chloe", type: "change", detail: "Change - Normal" },
  { heure: "11:30", enfant: "Hugo", type: "activite", detail: "Peinture - Tres actif" },
];

const alertes = [
  { type: "attention", enfant: "Emma", message: "A peu mange ces 2 derniers jours" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tableau de bord</h1>
          <p className="text-slate-500">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
          <Baby className="w-5 h-5" />
          Nouveau pointage
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{stat.name}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {stat.value}
                  {stat.total && <span className="text-lg text-slate-400">/{stat.total}</span>}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-xl`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alertes */}
      {alertes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Alertes bien-etre</span>
          </div>
          <div className="mt-2 space-y-2">
            {alertes.map((alerte, i) => (
              <p key={i} className="text-sm text-amber-600">
                <strong>{alerte.enfant}</strong>: {alerte.message}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enfants presents */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Enfants presents aujourd&apos;hui</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {enfantsPresents.map((enfant) => (
                <div
                  key={enfant.id}
                  className="flex flex-col items-center p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {enfant.prenom[0]}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                        enfant.statut === "sieste" ? "bg-purple-500" : "bg-green-500"
                      }`}
                    ></span>
                  </div>
                  <p className="mt-2 font-medium text-sm text-slate-700">{enfant.prenom}</p>
                  <p className="text-xs text-slate-400">{enfant.arrivee}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activites recentes */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Activites recentes</h2>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {activitesRecentes.map((activite, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="text-slate-400 font-mono w-12">{activite.heure}</span>
                  <div className="flex-1">
                    <p className="font-medium text-slate-700">{activite.enfant}</p>
                    <p className="text-slate-500">{activite.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all text-left">
          <Utensils className="w-8 h-8 text-orange-500 mb-2" />
          <p className="font-medium text-slate-700">Saisir repas</p>
          <p className="text-xs text-slate-400">Enregistrer un repas</p>
        </button>
        <button className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all text-left">
          <Moon className="w-8 h-8 text-purple-500 mb-2" />
          <p className="font-medium text-slate-700">Saisir sieste</p>
          <p className="text-xs text-slate-400">Debut/fin de sieste</p>
        </button>
        <button className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all text-left">
          <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
          <p className="font-medium text-slate-700">Saisir change</p>
          <p className="text-xs text-slate-400">Enregistrer un change</p>
        </button>
        <button className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all text-left">
          <TrendingUp className="w-8 h-8 text-indigo-500 mb-2" />
          <p className="font-medium text-slate-700">Transmission IA</p>
          <p className="text-xs text-slate-400">Generer un resume</p>
        </button>
      </div>
    </div>
  );
}
