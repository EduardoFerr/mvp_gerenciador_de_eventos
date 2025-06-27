// frontend/src/components/ui/button.tsx
// Este arquivo define um componente de botão reutilizável com variantes e estilos Tailwind CSS.
// Baseado na filosofia do Shadcn/ui, mas implementado diretamente.

import * as React from "react";
import { Slot } from "@radix-ui/react-slot"; // Permite que o componente renderize como um elemento diferente.
import { cva, type VariantProps } from "class-variance-authority"; // Ajuda a gerenciar variantes de classe CSS.
import { cn } from "@/lib/utils"; // Função utilitária para concatenar classes CSS.

// Define as variantes do botão usando `cva`.
// Isto permite ter diferentes estilos de botão (default, destructive, outline, etc.).
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90", // Cor primária
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90", // Cor destrutiva
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground", // Borda e fundo transparente
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80", // Cor secundária
        ghost: "hover:bg-accent hover:text-accent-foreground", // Sem fundo, apenas hover
        link: "text-primary underline-offset-4 hover:underline", // Estilo de link
      },
      size: {
        default: "h-9 px-4 py-2", // Tamanho padrão
        sm: "h-8 rounded-md px-3 text-xs", // Tamanho pequeno
        lg: "h-10 rounded-md px-8", // Tamanho grande
        icon: "h-9 w-9", // Tamanho para ícones (botão quadrado)
      },
    },
    defaultVariants: {
      variant: "default", // Variante padrão
      size: "default",    // Tamanho padrão
    },
  }
);

// Define as props para o componente Button.
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, // Estende as props HTML de um botão.
    VariantProps<typeof buttonVariants> { // Inclui as props de variante definidas por `cva`.
  asChild?: boolean; // Se true, o botão renderizará seu filho diretamente, aplicando os estilos.
}

// O componente Button.
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // Escolhe o componente a ser renderizado: Slot (se asChild for true) ou 'button'.
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        // Combina as classes padrão do botão, as classes de variante e quaisquer classes adicionais fornecidas.
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref} // Passa a ref para o elemento DOM subjacente.
        {...props} // Passa todas as outras props para o componente.
      />
    );
  }
);
Button.displayName = "Button"; // Define o display name para depuração no React DevTools.

export { Button, buttonVariants };

