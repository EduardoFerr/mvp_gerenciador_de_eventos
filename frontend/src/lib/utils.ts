import { type ClassValue, clsx } from "clsx"; 
import { twMerge } from "tailwind-merge";     

/**
 * Combina várias classes CSS, resolvendo conflitos do Tailwind CSS e unindo classes de forma condicional.
 * [Nota: É a função 'cn' popularizada pelo Shadcn/ui ].
 * @param inputs Um array de valores de classe (strings, objetos, arrays, booleanos, null, undefined).
 * @returns Uma string contendo as classes CSS mescladas.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

