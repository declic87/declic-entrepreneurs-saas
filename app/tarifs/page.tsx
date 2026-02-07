import { redirect } from "next/navigation";

// Redirige proprement /tarifs → /#tarifs (section Offres de la home)
export default function TarifsRedirect() {
  redirect("/#tarifs");
  return null;
}