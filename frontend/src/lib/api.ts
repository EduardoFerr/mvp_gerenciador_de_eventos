// frontend/src/lib/api.ts
// Este arquivo contém funções utilitárias para interagir com a API do backend.

import Cookies from 'js-cookie'; // Importa a biblioteca js-cookie para gerenciar cookies do navegador.

// Obtém a URL base da API do backend a partir das variáveis de ambiente.
// `NEXT_PUBLIC_API_URL` é definida em `next.config.js` e `.env.local`.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface RequestOptions extends RequestInit {
  // Define uma interface para as opções de requisição, estendendo as opções padrão do Fetch API.
  // Permite adicionar um token JWT manualmente, se necessário.
  token?: string;
}

/**
 * Função utilitária para fazer requisições à API.
 * @param endpoint O caminho da API (ex: '/users/login', '/events').
 * @param options Opções da requisição (método, headers, body, etc.).
 * @returns A resposta JSON da API.
 * @throws Erro se a requisição falhar ou retornar um status de erro.
 */
export async function apiFetch<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  // Constrói a URL completa da requisição.
  const url = `${API_URL}${endpoint}`;

  // Obtém o token JWT do cookie, se existir.
  const token = options?.token || Cookies.get('token');

  // Define os cabeçalhos padrão da requisição, garantindo que seja um Record<string, string>.
  const headers: Record<string, string> = {
    'Content-Type': 'application/json', // Por padrão, o corpo será JSON.
    // Converte HeadersInit de options?.headers para Record<string, string> se existir.
    ...(options?.headers ? Object.fromEntries(new Headers(options.headers).entries()) : {}),
  };

  // Se um token estiver disponível, adiciona-o ao cabeçalho de autorização.
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Configura as opções da requisição Fetch API.
  const config: RequestInit = {
    method: options?.method || 'GET', // Método HTTP padrão é GET.
    headers, // Agora TypeScript entende 'headers' como Record<string, string>
    body: options?.body,              // O corpo da requisição (já deve ser stringified se for JSON).
    ...options,                       // Mescla com quaisquer outras opções fornecidas.
  };

  // Remove a propriedade `token` de `config` para evitar que ela seja passada para o Fetch API.
  // @ts-ignore
  delete config.token;

  try {
    // Faz a requisição HTTP.
    const response = await fetch(url, config);

    // Tenta parsear a resposta como JSON.
    let data: any;
    try {
      data = await response.json();
    } catch (jsonError) {
      // Se a resposta não for um JSON válido, mas a requisição foi bem-sucedida (ex: 204 No Content).
      if (response.ok && response.status === 204) {
        return {} as T; // Retorna um objeto vazio para 204 No Content.
      }
      // Se for um erro no JSON parsing, lança um erro.
      throw new Error(`Erro ao parsear resposta JSON: ${jsonError}. Status: ${response.status}`);
    }

    // Se a resposta não for bem-sucedida (status 4xx ou 5xx), lança um erro com a mensagem da API.
    if (!response.ok) {
      throw new Error(data.message || 'Ocorreu um erro na requisição.');
    }

    // Retorna os dados da resposta.
    return data as T;
  } catch (error: any) {
    console.error('API Fetch Error:', error);
    // Re-lança o erro para ser tratado pelo componente que chamou a função.
    throw error;
  }
}
