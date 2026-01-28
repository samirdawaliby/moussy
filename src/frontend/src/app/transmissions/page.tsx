"use client";

import { useState } from "react";
import { Sparkles, Send, Edit, Check, Clock, Eye } from "lucide-react";

const transmissions = [
  {
    id: 1,
    enfant: "Leo Martin",
    date: "2024-01-28",
    contenu:
      "Leo a passe une super journee ! Il a tres bien mange sa puree de carottes au dejeuner et a fait une belle sieste de 2h30. Cet apres-midi, il s'est amuse a la peinture avec ses copains. A demain !",
    statut: "envoyee",
    lu: true,
    genereParIA: true,
  },
  {
    id: 2,
    enfant: "Emma Dubois",
    date: "2024-01-28",
    contenu:
      "Emma a ete un peu fatiguee ce matin mais s'est bien rattrapee apres sa sieste. Elle a peu mange au dejeuner mais a devore son gouter. Elle a beaucoup joue avec les cubes aujourd'hui.",
    statut: "envoyee",
    lu: false,
    genereParIA: true,
  },
  {
    id: 3,
    enfant: "Lucas Bernard",
    date: "2024-01-28",
    contenu: null,
    statut: "brouillon",
    lu: false,
    genereParIA: false,
  },
];

const enfantsPourGeneration = [
  { id: 3, prenom: "Lucas", nom: "Bernard", activites: 5 },
  { id: 4, prenom: "Chloe", nom: "Petit", activites: 4 },
  { id: 6, prenom: "Lea", nom: "Richard", activites: 6 },
];

export default function TransmissionsPage() {
  const [generating, setGenerating] = useState<number | null>(null);

  const handleGenerate = (id: number) => {
    setGenerating(id);
    setTimeout(() => setGenerating(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Transmissions</h1>
          <p className="text-slate-500">Messages quotidiens generes par IA pour les parents</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Send className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">2</p>
              <p className="text-sm text-slate-500">Envoyees</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-lg">
              <Edit className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">1</p>
              <p className="text-sm text-slate-500">Brouillons</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">3</p>
              <p className="text-sm text-slate-500">A generer</p>
            </div>
          </div>
        </div>
      </div>

      {/* Generation IA */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6" />
          <h2 className="font-semibold text-lg">Generation IA</h2>
        </div>
        <p className="text-indigo-100 mb-4">
          Generez automatiquement les transmissions pour les enfants ayant des activites
          enregistrees aujourd&apos;hui.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {enfantsPourGeneration.map((enfant) => (
            <button
              key={enfant.id}
              onClick={() => handleGenerate(enfant.id)}
              disabled={generating === enfant.id}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 text-left transition-all disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{enfant.prenom} {enfant.nom}</p>
                  <p className="text-sm text-indigo-100">{enfant.activites} activites</p>
                </div>
                {generating === enfant.id ? (
                  <div className="animate-spin">
                    <Sparkles className="w-5 h-5" />
                  </div>
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </div>
            </button>
          ))}
        </div>
        <button className="mt-4 w-full bg-white text-indigo-600 py-2 rounded-lg font-medium hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5" />
          Generer toutes les transmissions
        </button>
      </div>

      {/* Liste des transmissions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Transmissions du jour</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {transmissions.map((transmission) => (
            <div key={transmission.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {transmission.enfant[0]}
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">{transmission.enfant}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Clock className="w-3 h-3" />
                      {new Date(transmission.date).toLocaleDateString("fr-FR")}
                      {transmission.genereParIA && (
                        <span className="flex items-center gap-1 text-indigo-500">
                          <Sparkles className="w-3 h-3" /> IA
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {transmission.statut === "envoyee" ? (
                    <>
                      <span className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <Check className="w-3 h-3" /> Envoyee
                      </span>
                      {transmission.lu && (
                        <span className="flex items-center gap-1 text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          <Eye className="w-3 h-3" /> Lu
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                      Brouillon
                    </span>
                  )}
                </div>
              </div>
              {transmission.contenu ? (
                <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
                  {transmission.contenu}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-400 italic flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Cliquez sur &quot;Generer&quot; pour creer la transmission
                </div>
              )}
              <div className="mt-3 flex gap-2">
                {transmission.statut === "brouillon" && (
                  <>
                    <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                      <Sparkles className="w-4 h-4" /> Generer
                    </button>
                    <button className="text-sm text-slate-600 hover:text-slate-700 font-medium flex items-center gap-1">
                      <Edit className="w-4 h-4" /> Modifier
                    </button>
                  </>
                )}
                {transmission.statut === "brouillon" && transmission.contenu && (
                  <button className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                    <Send className="w-4 h-4" /> Envoyer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
