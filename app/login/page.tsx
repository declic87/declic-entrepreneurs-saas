"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="mb-8">
        <Link href="/">
          <Logo size="lg" showText variant="dark" />
        </Link>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-[#123055] text-center mb-6">
          Connexion
        </h1>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <Input
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Mot de passe
            </label>
            <Input
              type="password"
              placeholder="Votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
            />
          </div>

          <Button className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-white py-5 text-base">
            Se connecter
          </Button>
        </div>

        <p className="text-center text-sm text-slate-600 mt-4">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="text-[#F59E0B] hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}