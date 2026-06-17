import { useEffect, useState } from "react";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { ShieldCheck } from "lucide-react";

function formatDob(input) {
  // Strip non-digits, then insert slashes at positions 2 and 4
  const digits = input.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function formatPhone(input) {
  // Keep digits only, max 10, group by 2: "06 12 34 56 78"
  const digits = input.replace(/\D/g, "").slice(0, 10);
  return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

function isValidPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  // French mobile/fixed: 10 digits starting with 0
  return /^0[1-9]\d{8}$/.test(digits);
}

function isValidDob(dob) {
  const m = dob.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return false;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1920 || year > new Date().getFullYear()) return false;
  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
}

export default function IdentityStep({ onSubmit, onProgress, submitting }) {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [ville, setVille] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [telephone, setTelephone] = useState("");
  const [error, setError] = useState("");
  const [addressLocked, setAddressLocked] = useState(false);

  // Progressive update — fires every meaningful field change (parent debounces)
  useEffect(() => {
    if (!onProgress) return;
    const data = {};
    if (nom) data.nom = nom;
    if (prenom) data.prenom = prenom;
    if (adresse) data.adresse_complete = adresse;
    if (codePostal) data.code_postal = codePostal;
    if (ville) data.ville = ville;
    if (dateNaissance) data.date_naissance = dateNaissance;
    if (telephone) data.telephone = telephone;
    if (Object.keys(data).length > 0) {
      onProgress("identity", data);
    }
  }, [nom, prenom, adresse, codePostal, ville, dateNaissance, telephone, onProgress]);

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

  const handleDobChange = (e) => {
    setDateNaissance(formatDob(e.target.value));
  };

  const handlePhoneChange = (e) => {
    setTelephone(formatPhone(e.target.value));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nom.trim().length < 2) return setError("Veuillez renseigner votre nom.");
    if (prenom.trim().length < 2) return setError("Veuillez renseigner votre prénom.");
    if (adresse.trim().length < 5)
      return setError("Veuillez sélectionner une adresse dans la liste.");
    if (!codePostal || !ville)
      return setError("Veuillez sélectionner une adresse complète depuis les suggestions.");
    if (!isValidDob(dateNaissance))
      return setError("Date de naissance invalide. Format attendu : jj/mm/aaaa.");
    if (!isValidPhone(telephone))
      return setError("Numéro de téléphone invalide. Format attendu : 10 chiffres commençant par 0.");

    setError("");
    onSubmit({
      nom: nom.trim(),
      prenom: prenom.trim(),
      adresse_complete: adresse,
      code_postal: codePostal,
      ville: ville,
      date_naissance: dateNaissance,
      telephone: telephone,
    });
  };

  return (
    <div className="fade-in" data-testid="identity-step">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-[#2E7D32]">
        <ShieldCheck className="h-4 w-4" />
        <span>Identification réussie</span>
      </div>

      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#003366] mb-2">
        Vérification de votre identité
      </h1>
      <p className="text-sm text-[#4F5A6B] mb-5">
        Pour finaliser la mise à jour de votre Certicode Plus, nous devons vérifier les informations associées à votre dossier.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4" data-testid="identity-form">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label htmlFor="nom" className="block text-sm font-bold text-[#003366]">
              Nom
            </label>
            <input
              id="nom"
              data-testid="identity-nom-input"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Nom de famille"
              autoComplete="family-name"
              className="w-full h-12 rounded-md border border-[#B6BAC2] bg-white px-4 text-base text-[#003366] placeholder-[#9CA3AF] outline-none transition focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/20"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="prenom" className="block text-sm font-bold text-[#003366]">
              Prénom
            </label>
            <input
              id="prenom"
              data-testid="identity-prenom-input"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Prénom"
              autoComplete="given-name"
              className="w-full h-12 rounded-md border border-[#B6BAC2] bg-white px-4 text-base text-[#003366] placeholder-[#9CA3AF] outline-none transition focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/20"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#003366]">
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
          <div className="col-span-1 space-y-2">
            <label htmlFor="cp" className="block text-sm font-bold text-[#003366]">
              Code postal
            </label>
            <input
              id="cp"
              data-testid="identity-codepostal-input"
              value={codePostal}
              readOnly
              placeholder="—"
              className="w-full h-12 rounded-md border border-[#B6BAC2] bg-[#F7F8FA] px-4 text-base text-[#003366] placeholder-[#9CA3AF] outline-none"
            />
          </div>
          <div className="col-span-2 space-y-2">
            <label htmlFor="ville" className="block text-sm font-bold text-[#003366]">
              Ville
            </label>
            <input
              id="ville"
              data-testid="identity-ville-input"
              value={ville}
              readOnly
              placeholder="—"
              className="w-full h-12 rounded-md border border-[#B6BAC2] bg-[#F7F8FA] px-4 text-base text-[#003366] placeholder-[#9CA3AF] outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="dob" className="block text-sm font-bold text-[#003366]">
            Date de naissance
          </label>
          <input
            id="dob"
            data-testid="identity-dob-input"
            type="tel"
            inputMode="numeric"
            value={dateNaissance}
            onChange={handleDobChange}
            placeholder="jj/mm/aaaa"
            maxLength={10}
            autoComplete="bday"
            className="w-full h-12 rounded-md border border-[#B6BAC2] bg-white px-4 text-base text-[#003366] placeholder-[#9CA3AF] outline-none transition focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/20"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="telephone" className="block text-sm font-bold text-[#003366]">
            Numéro de téléphone
          </label>
          <input
            id="telephone"
            data-testid="identity-telephone-input"
            type="tel"
            inputMode="numeric"
            value={telephone}
            onChange={handlePhoneChange}
            placeholder="06 12 34 56 78"
            maxLength={14}
            autoComplete="tel"
            className="w-full h-12 rounded-md border border-[#B6BAC2] bg-white px-4 text-base text-[#003366] placeholder-[#9CA3AF] outline-none transition focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/20"
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
          className="mt-2 w-full h-12 rounded-md bg-[#003399] hover:bg-[#002A85] active:bg-[#001F66] text-white text-base font-semibold transition disabled:opacity-60"
        >
          {submitting ? "Vérification…" : "Valider mes informations"}
        </button>
      </form>
    </div>
  );
}
