// backend/src/controllers/userController.ts
// Este arquivo contém a lógica para o gerenciamento de usuários (registro, login, CRUD).

import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../config/jwt'; // Assumindo que generateToken está em config/jwt
import { registerSchema, loginSchema } from '../validation/schemas';
import { ZodError } from 'zod';
import { prisma } from '../server'; // Importa a instância do Prisma do server.ts

/**
 * Registra um novo usuário.
 * Requisitos: email (único), password (mínimo 6 caracteres).
 * Papel padrão: USER.
 */
export const registerUser = async (req: Request, res: Response) => {
  try {
    // 1. Valida os dados de entrada com o schema Zod.
    const { email, password } = registerSchema.parse(req.body);

    // 2. Verifica se o usuário já existe.
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'E-mail já registrado.' });
    }

    // 3. Hash da senha antes de salvar no banco de dados.
    const hashedPassword = await bcrypt.hash(password, 10); // 10 é o salt rounds

    // 4. Cria o novo usuário no banco de dados.
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: Role.USER, // Novo usuário é sempre ROLE.USER por padrão.
      },
      select: { id: true, email: true, role: true, createdAt: true }, // Retorna apenas informações seguras.
    });

    // 5. Gera um JWT para o novo usuário.
    const token = generateToken({ id: newUser.id, role: newUser.role });

    // 6. Envia a resposta de sucesso.
    res.status(201).json({
      message: 'Usuário registrado com sucesso!',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
      token,
    });
  } catch (error) {
    console.debug('Erro ao registrar usuário:', error);
    // Lida com erros de validação Zod.
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Erro de validação.', errors: error.errors });
    }
    // Lida com outros erros.
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao registrar usuário.' });
  }
};

/**
 * Autentica um usuário.
 * Requisitos: email, password.
 * Retorna um JWT em caso de sucesso.
 */
export const loginUser = async (req: Request, res: Response) => {
  try {
    // 1. Valida os dados de entrada com o schema Zod.
    const { email, password } = loginSchema.parse(req.body);

    // 2. Busca o usuário pelo e-mail.
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Credenciais inválidas.' });
    }

    // 3. Compara a senha fornecida com a senha hash armazenada.
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Credenciais inválidas.' });
    }

    // 4. Gera um JWT para o usuário autenticado.
    const token = generateToken({ id: user.id, role: user.role });

    // 5. Envia a resposta de sucesso.
    res.status(200).json({
      message: 'Login realizado com sucesso!',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    // Lida com erros de validação Zod.
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Erro de validação.', errors: error.errors });
    }
    // Lida com outros erros.
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao fazer login.' });
  }
};

/**
 * Obtém o perfil do usuário logado (requer autenticação).
 * Um usuário pode ver seu próprio perfil.
 * Admin pode ver qualquer perfil.
 */
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { id: paramId } = req.params; // ID do usuário a ser buscado (se vier da rota para admin)
    const requestingUserId = req.userId; // ID do usuário que fez a requisição (do token JWT)
    const requestingUserRole = req.role; // Papel do usuário que fez a requisição

    let userIdToFetch: string; // Declara userIdToFetch como string

    // Adicionando log para depuração
    console.log(`[getUserProfile] Tentando buscar perfil para userId do token: ${requestingUserId}`);

    // Garante que requestingUserId não é undefined antes de prosseguir
    if (requestingUserId === undefined) {
      console.warn('[getUserProfile] userId é undefined no token. Possível problema de autenticação.');
      return res.status(401).json({ message: 'Não autorizado: ID de usuário ausente no token.' });
    }

    // Lógica para determinar qual ID de usuário buscar:
    // Se um paramId é fornecido E o usuário é ADMIN, use o paramId.
    // Caso contrário, use o ID do usuário que fez a requisição (requestingUserId, que já foi validado como string).
    if (paramId && requestingUserRole === Role.ADMIN) {
      userIdToFetch = paramId;
      console.log(`[getUserProfile] Admin requisitando perfil de ID: ${userIdToFetch}`);
    } else {
      userIdToFetch = requestingUserId; // requestingUserId é garantido ser string aqui.
      console.log(`[getUserProfile] Usuário comum ou self-request: ${userIdToFetch}`);
    }

    // Garante que userIdToFetch é uma string não vazia antes de usar no where clause do Prisma
    if (!userIdToFetch) {
      console.error('[getUserProfile] userIdToFetch é vazio após lógica de determinação.');
      return res.status(400).json({ message: 'ID do usuário inválido para busca de perfil.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userIdToFetch },
      select: { id: true, email: true, role: true, createdAt: true, updatedAt: true },
    });

    if (!user) {
      console.error(`[getUserProfile] Usuário com ID ${userIdToFetch} não encontrado no banco de dados.`);
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    console.log(`[getUserProfile] Perfil encontrado para ${user.email}, papel: ${user.role}`);
    res.status(200).json({ user });
  } catch (error) {
    console.error('Erro ao obter perfil do usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao obter perfil do usuário.' });
  }
};

/**
 * Atualiza o perfil de um usuário.
 * Usuário comum: só pode atualizar o próprio perfil (email, password).
 * Admin: pode atualizar qualquer perfil (email, password, role).
 */
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // ID do usuário a ser atualizado
    const requestingUserId = req.userId; // ID do usuário que fez a requisição
    const requestingUserRole = req.role; // Papel do usuário que fez a requisição

    // Garante que requestingUserId não é undefined
    if (!requestingUserId) {
        return res.status(401).json({ message: 'Não autorizado: Usuário não identificado.' });
    }

    let userIdToUpdate = id;

    // Usuário comum só pode atualizar o próprio perfil
    if (requestingUserRole === Role.USER && userIdToUpdate !== requestingUserId) {
      return res.status(403).json({ message: 'Acesso negado: Você só pode atualizar seu próprio perfil.' });
    }

    const { email, password, role } = req.body; // Campos a serem atualizados

    const dataToUpdate: any = {};
    if (email !== undefined) { 
      try {
        registerSchema.shape.email.parse(email); // Valida formato do email
        const existingUserWithEmail = await prisma.user.findUnique({ where: { email } });
        if (existingUserWithEmail && existingUserWithEmail.id !== userIdToUpdate) {
          return res.status(409).json({ message: 'Este e-mail já está em uso por outro usuário.' });
        }
        dataToUpdate.email = email;
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: 'Erro de validação do e-mail.', errors: error.errors });
        }
        throw error;
      }
    }
    if (password !== undefined) {
      try {
        registerSchema.shape.password.parse(password); // Valida força da senha
        dataToUpdate.password = await bcrypt.hash(password, 10);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: 'Erro de validação da senha.', errors: error.errors });
        }
        throw error;
      }
    }
    // Permite que o admin atualize o papel
    if (requestingUserRole === Role.ADMIN && role !== undefined) {
      if (!Object.values(Role).includes(role)) {
        return res.status(400).json({ message: 'Papel inválido fornecido.' });
      }
      dataToUpdate.role = role;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ message: 'Nenhum dado para atualizar fornecido.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userIdToUpdate },
      data: dataToUpdate,
      select: { id: true, email: true, role: true, createdAt: true, updatedAt: true },
    });

    res.status(200).json({ message: 'Perfil do usuário atualizado com sucesso!', user: updatedUser });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Erro de validação.', errors: error.errors });
    }
    console.error('Erro ao atualizar perfil do usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao atualizar perfil do usuário.' });
  }
};


/**
 * Deleta um usuário. (Apenas Admin pode deletar qualquer usuário)
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const requestingUserRole = req.role;

    if (requestingUserRole !== Role.ADMIN) {
      return res.status(403).json({ message: 'Acesso negado: Apenas administradores podem deletar usuários.' });
    }

    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete) {
      return res.status(404).json({ message: 'Usuário não encontrado para exclusão.' });
    }

    if (req.userId === id) { // Evita que o admin se auto-delete
      return res.status(400).json({ message: 'Você não pode deletar seu próprio usuário através desta rota.' });
    }

    await prisma.user.delete({ where: { id } });

    res.status(200).json({ message: 'Usuário deletado com sucesso!' });
  } catch (error: any) {
    if (error.code === 'P2003') { // Foreign key constraint failed
      return res.status(400).json({ message: 'Não é possível deletar o usuário devido a reservas ou eventos associados.' });
    }
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao deletar usuário.' });
  }
};

/**
 * Lista todos os usuários. (Apenas Admin)
 */
export const listUsers = async (req: Request, res: Response) => {
  try {
    if (req.role !== Role.ADMIN) {
      return res.status(403).json({ message: 'Acesso negado: Apenas administradores podem listar usuários.' });
    }

    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, createdAt: true, updatedAt: true },
    });

    res.status(200).json({ users });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao listar usuários.' });
  }
};
