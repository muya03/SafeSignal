import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pairingSchema, type PairingData } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Heart, User, Hash } from "lucide-react";

interface PairingScreenProps {
  onPaired: (data: PairingData) => void;
}

export function PairingScreen({ onPaired }: PairingScreenProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<PairingData>({
    resolver: zodResolver(pairingSchema),
    defaultValues: {
      name: "",
      pairCode: "",
    },
  });

  const handleSubmit = async (data: PairingData) => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    onPaired(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 via-purple-500 to-emerald-500 flex flex-col safe-top safe-bottom">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
        <div className="mb-10 flex flex-col items-center">
          <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 shadow-2xl">
            <Heart className="w-12 h-12 text-white" strokeWidth={2} fill="white" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">SafeSignal</h1>
          <p className="text-white/70 text-base text-center leading-relaxed">
            Conexión de apoyo emocional instantánea
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="w-full space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 pointer-events-none" />
                      <input
                        {...field}
                        type="text"
                        placeholder="Tu nombre"
                        autoComplete="given-name"
                        className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/50 text-base focus:outline-none focus:border-white/60 focus:bg-white/25 transition-all"
                        data-testid="input-name"
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-white/80 text-sm ml-1" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="pairCode"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 pointer-events-none" />
                      <input
                        {...field}
                        type="text"
                        placeholder="Código de pareja (ej: AMIGOS123)"
                        autoComplete="off"
                        autoCapitalize="characters"
                        className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/50 text-base font-mono tracking-wider uppercase focus:outline-none focus:border-white/60 focus:bg-white/25 transition-all"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        data-testid="input-pair-code"
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-white/80 text-sm ml-1" />
                </FormItem>
              )}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 rounded-2xl bg-white text-purple-600 font-semibold text-lg shadow-xl active:scale-95 transition-transform disabled:opacity-60 disabled:active:scale-100 mt-2"
              data-testid="button-connect"
            >
              {isSubmitting ? "Conectando..." : "Conectar"}
            </button>
          </form>
        </Form>

        <p className="text-white/40 text-xs text-center mt-8">
          Tu información se guarda solo en este dispositivo
        </p>
      </div>
    </div>
  );
}
