import { PrismaClient } from '@prisma/client';

console.log('Attempting to create PrismaClient instance...'); // <-- Add this log

const prisma = new PrismaClient();

console.log('PrismaClient instance created successfully.'); // <-- Add this log

export default prisma;