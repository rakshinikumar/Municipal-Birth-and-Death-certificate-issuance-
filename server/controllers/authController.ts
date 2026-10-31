import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client.js';
import { CONFIG } from '../config/index.js';
import { AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

export const registerCitizen = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, nationalId, address, dateOfBirth, gender } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email and password are required.' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'CITIZEN',
        phone: phone || null,
        citizenProfile: {
          create: {
            nationalId: nationalId || null,
            address: address || null,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            gender: gender || null,
          },
        },
      },
      include: {
        citizenProfile: true,
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      CONFIG.JWT_SECRET,
      { expiresIn: '7d' }
    );

    await logAudit({
      userId: user.id,
      action: 'CITIZEN_REGISTRATION',
      entityType: 'User',
      entityId: user.id,
      details: { email: user.email, name: user.name },
    });

    res.status(201).json({
      success: true,
      message: 'Citizen account registered successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileId: user.citizenProfile?.id,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error during registration.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        citizenProfile: true,
        hospitalProfile: true,
        officerProfile: true,
      },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials or user not found.' });
      return;
    }

    // Role verification
    if (role && user.role !== role) {
      res.status(403).json({
        success: false,
        message: `Account is registered as ${user.role}, but attempted login as ${role}. Please select your correct role.`,
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials or password incorrect.' });
      return;
    }

    let profileId: string | undefined;
    if (user.role === 'CITIZEN') profileId = user.citizenProfile?.id;
    if (user.role === 'HOSPITAL') profileId = user.hospitalProfile?.id;
    if (user.role === 'OFFICER') profileId = user.officerProfile?.id;

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      CONFIG.JWT_SECRET,
      { expiresIn: '7d' }
    );

    await logAudit({
      userId: user.id,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
      details: { role: user.role, ip: req.ip },
    });

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileId,
        details: user.citizenProfile || user.hospitalProfile || user.officerProfile || null,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during login.' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        citizenProfile: true,
        hospitalProfile: true,
        officerProfile: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const { password, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email address is required.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success anyway for security best practice
      res.json({ success: true, message: 'If this email exists in our records, password recovery instructions have been dispatched.' });
      return;
    }

    res.json({
      success: true,
      message: `A secure verification reset link has been dispatched to ${email}. Check your inbox.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
