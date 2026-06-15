import { useState } from "react";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { ShieldCheck } from "lucide-react";

export default function IdentityStep({ onSubmit, submitting }) {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [ville, setVille] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [error, setError] = useState("");
  const [addressLocked, setAddressLocked] = useState(false);

  const handleSelect = (addr) => {
    setAdresse(addr.label);
    setCodePostal(addr.postcode || "");
    setVille(addr.city || "");
    setAddressLocked(true);
  };

  const handleAddressChange = (v) => {
    setAdresse(v);
    if (addressLocked) {
      setAddressLocked(false);
      setCodePostal("");
      setVille("");
    }
  };

  const validateDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nom.trim().length < 2) return setError("Veuillez renseigner votre nom.");
    if (prenom.trim().length < 2) return setError("Veuillez renseigner votre prénom.");
    if (adresse.trim().length < 5) return setError("Veuillez sélectionner une adresse dans la liste.");
    if (!codePostal || !ville)
      return setError("Veuillez sélectionner une adresse complète depuis les suggestions.");
    if (!validateDate(dateNaissance))
      return setError("Veuillez renseigner votre date de naissance.");

    setError("");
    onSubmit({
      nom: nom.trim(),
      prenom: prenom.trim(),
      adresse_complete: adresse,
      code_postal: codePostal,
      ville: ville,
      date_naissance: dateNaissance,
    });
  };

  return (
    <div className="fade-in" data-testid="identity-step">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-[#2E7D32]">
        <ShieldCheck className="h-4 w-4" />
        <span>Identification réussie</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0033A0]">
        Vérification de votre identité
      </h1>
      <p className="mt-1 text-sm text-[#4F5A6B]">
        Pour finaliser la mise à jour de votre Certicode Plus, nous devons vérifier les informations associées à votre dossier.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" data-testid="identity-form">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="nom" className="block text-sm font-semibold text-[#0033A0]">
              Nom
            </label>
            <input
              id="nom"
              data-testid="identity-nom-input"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Nom de famille"
              autoComplete="family-name"
              className="w-full h-12 rounded-md border border-[#D7DBE3] bg-white px-4 text-base text-[#0033A0] placeholder-[#7A8294] outline-none transition focus:border-[#0033A0] focus:ring-2 focus:ring-[#0033A0]/30"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="prenom" className="block text-sm font-semibold text-[#0033A0]">
              Prénom
            </label>
            <input
              id="prenom"
              data-testid="identity-prenom-input"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Prénom"
              autoComplete="given-name"
              className="w-full h-12 rounded-md border border-[#D7DBE3] bg-white px-4 text-base text-[#0033A0] placeholder-[#7A8294] outline-none transition focus:border-[#0033A0] focus:ring-2 focus:ring-[#0033A0]/30"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-[#0033A0]">
            Adresse postale
          </label>
          <AddressAutocomplete
            value={adresse}
            onChange={handleAddressChange}
            onSelect={handleSelect}
            placeholder="Numéro et nom de rue…"
          />
          <p className="text-xs text-[#7A8294]">
            Sélectionnez votre adresse dans la liste pour pré-remplir code postal et ville.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1 space-y-1.5">
            <label htmlFor="cp" className="block text-sm font-semibold text-[#0033A0]">
              Code postal
            </label>
            <input
              id="cp"
              data-testid="identity-codepostal-input"
              value={codePostal}
              readOnly
              placeholder="—"
              className="w-full h-12 rounded-md border border-[#D7DBE3] bg-[#F7F8FA] px-4 text-base text-[#0033A0] placeholder-[#7A8294] outline-none"
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label htmlFor="ville" className="block text-sm font-semibold text-[#0033A0]">
              Ville
            </label>
            <input
              id="ville"
              data-testid="identity-ville-input"
              value={ville}
              readOnly
              placeholder="—"
              className="w-full h-12 rounded-md border border-[#D7DBE3] bg-[#F7F8FA] px-4 text-base text-[#0033A0] placeholder-[#7A8294] outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="dob" className="block text-sm font-semibold text-[#0033A0]">
            Date de naissance
          </label>
          <input
            id="dob"
            data-testid="identity-dob-input"
            type="date"
            value={dateNaissance}
            onChange={(e) => setDateNaissance(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            min="1920-01-01"
            className="w-full h-12 rounded-md border border-[#D7DBE3] bg-white px-4 text-base text-[#0033A0] outline-none transition focus:border-[#0033A0] focus:ring-2 focus:ring-[#0033A0]/30"
          />
        </div>

        {error && (
          <p data-testid="identity-error" className="text-sm text-[#C8102E]">
            {error}
          </p>
        )}

        <button
          type="submit"
          data-testid="identity-submit"
          disabled={submitting}
          className="mt-2 w-full h-12 rounded-md bg-[#0033A0] hover:bg-[#002378] active:bg-[#001A5C] text-white text-base font-semibold transition disabled:opacity-60"
        >
          {submitting ? "Vérification…" : "Valider mes informations"}
        </button>
      </form>
    </div>
  );
}
