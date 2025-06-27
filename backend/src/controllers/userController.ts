import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../config/jwt';
import { registerSchema, loginSchema } from '../validation/schemas';
import { ZodError } from 'zod';
import { prisma } from '../server';

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'E-mail já registrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: Role.USER,
      },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    const token = generateToken({ id: newUser.id, role: newUser.role });

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
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Erro de validação.', errors: error.errors });
    }
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao registrar usuário.' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Credenciais inválidas.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Credenciais inválidas.' });
    }

    const token = generateToken({ id: user.id, role: user.role });

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
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Erro de validação.', errors: error.errors });
    }
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao fazer login.' });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { id: paramId } = req.params;
    const requestingUserId = req.userId;
    const requestingUserRole = req.role;

    if (!requestingUserId) {
      return res.status(401).json({ message: 'Não autorizado: ID de usuário ausente no token.' });
    }

    const userIdToFetch =
      paramId && requestingUserRole === Role.ADMIN ? paramId : requestingUserId;

    if (!userIdToFetch) {
      return res.status(400).json({ message: 'ID do usuário inválido para busca de perfil.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userIdToFetch },
      select: { id: true, email: true, role: true, createdAt: true, updatedAt: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Erro ao obter perfil do usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao obter perfil do usuário.' });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.userId;
    const requestingUserRole = req.role;

    if (!requestingUserId) {
      return res.status(401).json({ message: 'Não autorizado: Usuário não identificado.' });
    }

    if (requestingUserRole === Role.USER && id !== requestingUserId) {
      return res.status(403).json({ message: 'Acesso negado: Você só pode atualizar seu próprio perfil.' });
    }

    const { email, password, role } = req.body;

    const dataToUpdate: any = {};

    if (email !== undefined) {
      try {
        registerSchema.shape.email.parse(email);
        const existingUserWithEmail = await prisma.user.findUnique({ where: { email } });
        if (existingUserWithEmail && existingUserWithEmail.id !== id) {
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
        registerSchema.shape.password.parse(password);
        dataToUpdate.password = await bcrypt.hash(password, 10);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: 'Erro de validação da senha.', errors: error.errors });
        }
        throw error;
      }
    }

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
      where: { id },
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

    if (req.userId === id) {
      return res.status(400).json({ message: 'Você não pode deletar seu próprio usuário através desta rota.' });
    }

    await prisma.user.delete({ where: { id } });

    res.status(200).json({ message: 'Usuário deletado com sucesso!' });
  } catch (error: any) {
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Não é possível deletar o usuário devido a reservas ou eventos associados.' });
    }
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao deletar usuário.' });
  }
};

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
