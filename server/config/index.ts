import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CONFIG = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'municipal_vital_statistics_secure_jwt_token_2026',
  JWT_EXPIRES_IN: '7d',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  UPLOAD_DIR: path.resolve(__dirname, '../../uploads'),
  CERTIFICATES_DIR: path.resolve(__dirname, '../../uploads/certificates'),
  MUNICIPALITY_NAME: 'Metropolitan Municipal Corporation of Elmwood',
  MUNICIPALITY_DEPARTMENT: 'Office of the Chief Registrar of Births and Deaths',
  DEFAULT_REGISTRAR: 'Hon. Arthur Vance, IAS',
  REGISTRAR_TITLE: 'Executive Municipal Registrar & Commissioner'
};
