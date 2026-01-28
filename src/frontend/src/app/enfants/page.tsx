"use client";

import { Plus, Search, Filter, MoreVertical, Phone, Mail, AlertCircle } from "lucide-react";

const enfants = [
  {
    id: 1,
    prenom: "Leo",
    nom: "Martin",
    dateNaissance: "2022-03-15",
    allergies: ["Arachides"],
    parents: [{ nom: "Sophie Martin", tel: "06 12 34 56 78" }],
    contrat: "Regulier - 40h/sem",
    actif: true,
  },
  {
    id: 2,
    prenom: "Emma",
    nom: "Dubois",
    dateNaissance: "2022-06-20",
    allergies: [],
    parents: [{ nom: "Pierre Dubois", tel: "06 98 76 54 32" }],
    contrat: "Regulier - 35h/sem",
    actif: true,
  },
  {
    id: 3,
    prenom: "Lucas",
    nom: "Bernard",
    dateNaissance: "2021-11-08",
    allergies: ["Gluten"],
    parents: [{ nom: "Marie Bernard", tel: "06 11 22 33 44" }],
    contrat: "Regulier - 40h/sem",
    actif: true,
  },
  {
    id: 4,
    prenom: "Chloe",
    nom: "Petit",
    dateNaissance: "2022-01-25",
    allergies: [],
    parents: [{ nom: "Jean Petit", tel: "06 55 66 77 88" }],
    contrat: "Occasionnel",
    actif: true,
  },
  {
    id: 5,
    prenom: "Hugo",
    nom: "Robert",
    dateNaissance: "2022-09-12",
    allergies: ["Lait"],
    parents: [{ nom: "Claire Robert", tel: "06 44 33 22 11" }],
    contrat: "Regulier - 32h/sem",
    actif: true,
  },
];

function calculateAge(dateNaissance: string): string {
  const birth = new Date(dateNaissance);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years > 0) {
    return `${years} an${years > 1 ? "s" : ""} ${remainingMonths} mois`;
  }
  return `${remainingMonths} mois`;
}

export default function EnfantsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Enfants</h1>
          <p className="text-slate-500">Gestion des profils enfants</p>
        </div>
        <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Ajouter un enfant
        </button>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un enfant..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
          <Filter className="w-5 h-5 text-slate-400" />
          Filtres
        </button>
      </div>

      {/* Liste des enfants */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Enfant</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Age</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Parent</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Contrat</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Allergies</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enfants.map((enfant) => (
                <tr key={enfant.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {enfant.prenom[0]}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">
                          {enfant.prenom} {enfant.nom}
                        </p>
                        <p className="text-sm text-slate-500">
                          Ne le {new Date(enfant.dateNaissance).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {calculateAge(enfant.dateNaissance)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <p className="text-slate-700">{enfant.parents[0].nom}</p>
                      <div className="flex items-center gap-1 text-slate-500">
                        <Phone className="w-3 h-3" />
                        {enfant.parents[0].tel}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600">{enfant.contrat}</span>
                  </td>
                  <td className="px-4 py-3">
                    {enfant.allergies.length > 0 ? (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <span className="text-sm text-amber-600">{enfant.allergies.join(", ")}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">Aucune</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="p-2 hover:bg-slate-100 rounded-lg">
                      <MoreVertical className="w-5 h-5 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
