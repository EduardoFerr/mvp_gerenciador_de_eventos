// backend/src/config/jwt.ts
// Este arquivo contém funções utilitárias para a criação e verificação de JSON Web Tokens (JWT).

import jwt, { Secret, SignOptions } from 'jsonwebtoken'; // Importa Secret e SignOptions
import dotenv from 'dotenv';

dotenv.config(); // Carrega as variáveis de ambiente

// A chave secreta para assinar e verificar os JWTs.
// É crucial que esta chave seja mantida em segredo e seja forte.
// Obtida de uma variável de ambiente (process.env.JWT_SECRET).
const JWT_SECRET = process.env.JWT_SECRET;

// Verifica se a JWT_SECRET está definida. Se não estiver, lança um erro,
// pois a aplicação não pode funcionar sem uma chave secreta para os tokens.
if (!JWT_SECRET) {
  console.error('ERRO: A variável de ambiente JWT_SECRET não está definida. Certifique-se de que está no seu arquivo .env.');
  // Em um ambiente de produção, seria crucial encerrar o processo aqui.
  process.exit(1); // Encerra o processo se a chave não estiver configurada.
}

/**
 * Gera um novo JSON Web Token.
 * @param payload O objeto de dados a ser incluído no token (ex: id do usuário, papel).
 * @param expiresIn O tempo de expiração do token (ex: '1h', '7d'). Padrão é '1h'.
 * @returns O JWT assinado.
 */
export const generateToken = (payload: object, expiresIn: string = '1h'): string => {
  // CORREÇÃO: Usar 'as any' no objeto de opções para contornar o erro de tipagem de 'expiresIn'.
  // Isso informa ao TypeScript para não validar rigorosamente as propriedades deste objeto.
  return jwt.sign(payload, JWT_SECRET as Secret, { expiresIn } as any);
};

/**
 * Verifica um JSON Web Token.
 * @param token O token JWT a ser verificado.
 * @returns O payload decodificado se o token for válido, caso contrário, lança um erro.
 */
export const verifyToken = (token: string): any => {
  try {
    // CORREÇÃO: Usar 'as any' para o objeto de opções vazio, se necessário, para consistência.
    // Embora verify não use expiresIn como parâmetro, o erro pode ser similar.
    return jwt.verify(token, JWT_SECRET as Secret, {} as any);
  } catch (error) {
    // Se a verificação falhar (ex: token inválido, expirado), lança o erro.
    throw new Error('Token inválido ou expirado.');
  }
};

