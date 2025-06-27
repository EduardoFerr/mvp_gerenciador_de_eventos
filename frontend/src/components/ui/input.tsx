// frontend/src/components/ui/input.tsx
// Este arquivo define um componente de input reutilizável com estilos Tailwind CSS.
// Baseado na filosofia do Shadcn/ui, mas implementado diretamente.

import * as React from "react";
import { cn } from "@/lib/utils"; // Função utilitária para concatenar classes CSS.

// Define as props para o componente Input.
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {} // Estende as props HTML de um input.

// O componente Input.
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type} // Tipo do input (text, email, password, etc.).
        // Combina as classes padrão do input e quaisquer classes adicionais fornecidas.
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", // Removido 'shadow-sm'
          className
        )}
        ref={ref} // Passa a ref para o elemento DOM subjacente.
        {...props} // Passa todas as outras props para o componente.
      />
    );
  }
);
Input.displayName = "Input"; // Define o display name para depuração no React DevTools.

export { Input };

