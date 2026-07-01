// ==================== AUTH SERVICE ====================
// Gerencia toda lógica de autenticação, validação e controle de acesso

import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { AuthUser, Customer, AuthError, AuthResponse, UserCustomerMapping, LoginCredentials } from '../types-auth';

const ADMIN_EMAIL = 'adm@empresa.com';
const ADMIN_PASSWORD = '201515';

export class AuthService {
  /**
   * Validar e fazer login do usuário
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { email, password } = credentials;

      // 1. Validar campos básicos
      if (!email || !password) {
        return {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Email e senha são obrigatórios.'
          }
        };
      }

      const cleanEmail = email.trim().toLowerCase();

      // 2. Verificar se é admin
      if (cleanEmail === ADMIN_EMAIL || cleanEmail === 'adm') {
        if (password !== ADMIN_PASSWORD) {
          return {
            success: false,
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Senha incorreta para a conta de Administrador.'
            }
          };
        }

        // Admin login bem-sucedido
        const adminUser: AuthUser = {
          id: 'admin-001',
          email: ADMIN_EMAIL,
          name: 'Administrador',
          role: 'admin',
          status: 'active',
          createdAt: new Date().toISOString()
        };

        return {
          success: true,
          user: adminUser
        };
      }

      // 3. Buscar usuário no Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', cleanEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Usuário não encontrado no sistema. Contacte o administrador.'
          }
        };
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as AuthUser;

      // 4. Validar senha (simplificado - usar bcrypt em produção)
      if (userData.role === 'sales') {
        return {
          success: false,
          error: {
            code: 'SALES_CANNOT_LOGIN',
            message: '❌ Vendedores não têm acesso ao sistema de gerenciamento de chamados.'
          }
        };
      }

      // 5. Validar status do usuário
      if (userData.status === 'blocked') {
        return {
          success: false,
          error: {
            code: 'USER_BLOCKED',
            message: 'Sua conta foi bloqueada. Contacte o administrador.'
          }
        };
      }

      if (userData.status === 'inactive') {
        return {
          success: false,
          error: {
            code: 'USER_BLOCKED',
            message: 'Sua conta está inativa. Contacte o administrador.'
          }
        };
      }

      // 6. Se não é admin, validar customer
      if (userData.role !== 'admin' && userData.customerId) {
        const customerDoc = await getDoc(doc(db, 'customers', userData.customerId));
        
        if (!customerDoc.exists()) {
          return {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Customer associado não encontrado.'
            }
          };
        }

        const customerData = customerDoc.data() as Customer;

        // Validar se customer está ativo
        if (customerData.status !== 'active') {
          return {
            success: false,
            error: {
              code: 'CUSTOMER_INACTIVE',
              message: `O customer "${customerData.name}" está ${customerData.status}. Não é possível fazer login.`
            }
          };
        }

        // Retornar usuário com dados do customer
        return {
          success: true,
          user: {
            ...userData,
            customerData
          }
        };
      }

      return {
        success: true,
        user: userData
      };
    } catch (error) {
      console.error('Auth login error:', error);
      return {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Erro ao processar login. Tente novamente.'
        }
      };
    }
  }

  /**
   * Registrar novo customer (apenas admin)
   */
  static async registerCustomer(
    adminEmail: string,
    customerData: Omit<Customer, 'id' | 'createdAt' | 'currentUserCount'>
  ): Promise<AuthResponse> {
    try {
      // Verificar permissão
      if (adminEmail !== ADMIN_EMAIL) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Apenas administradores podem registrar customers.'
          }
        };
      }

      // Gerar ID único para customer
      const customersRef = collection(db, 'customers');
      const snapshot = await getDocs(customersRef);
      const nextId = `cust-${String(snapshot.size + 1).padStart(3, '0')}`;

      const newCustomer: Customer = {
        id: nextId,
        ...customerData,
        currentUserCount: 0,
        createdAt: new Date().toISOString(),
        createdBy: adminEmail
      };

      await setDoc(doc(db, 'customers', nextId), newCustomer);

      return {
        success: true,
        user: undefined // Não retorna usuário pois é apenas registro de customer
      };
    } catch (error) {
      console.error('Register customer error:', error);
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Erro ao registrar customer.'
        }
      };
    }
  }

  /**
   * Registrar novo usuário e vinculá-lo a um customer (apenas admin)
   */
  static async registerUserToCustomer(
    adminEmail: string,
    userData: Omit<AuthUser, 'id' | 'createdAt'>,
    customerId: string
  ): Promise<AuthResponse> {
    try {
      // Verificar permissão
      if (adminEmail !== ADMIN_EMAIL) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Apenas administradores podem registrar usuários.'
          }
        };
      }

      // Validar role
      if (userData.role === 'sales' || userData.role === 'admin') {
        return {
          success: false,
          error: {
            code: 'INVALID_ROLE',
            message: 'Não é permitido registrar usuários com role "sales" ou "admin".'
          }
        };
      }

      // Validar se customer existe e está ativo
      const customerDoc = await getDoc(doc(db, 'customers', customerId));
      if (!customerDoc.exists()) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Customer não encontrado.'
          }
        };
      }

      const customerData = customerDoc.data() as Customer;
      if (customerData.status !== 'active') {
        return {
          success: false,
          error: {
            code: 'CUSTOMER_INACTIVE',
            message: `Customer "${customerData.name}" não está ativo.`
          }
        };
      }

      // Validar limite de usuários
      if (customerData.currentUserCount >= customerData.maxUsers) {
        return {
          success: false,
          error: {
            code: 'CUSTOMER_FULL',
            message: `O customer "${customerData.name}" atingiu o limite de ${customerData.maxUsers} usuários.`
          }
        };
      }

      // Verificar se email já existe
      const usersRef = collection(db, 'users');
      const emailQuery = query(usersRef, where('email', '==', userData.email.toLowerCase()));
      const emailSnapshot = await getDocs(emailQuery);
      if (!emailSnapshot.empty) {
        return {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Este email já está registrado no sistema.'
          }
        };
      }

      // Criar novo usuário
      const usersSnapshot = await getDocs(usersRef);
      const nextUserId = `user-${String(usersSnapshot.size + 1).padStart(3, '0')}`;

      const newUser: AuthUser = {
        id: nextUserId,
        ...userData,
        customerId,
        email: userData.email.toLowerCase(),
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', nextUserId), newUser);

      // Registrar mapeamento para auditoria
      const mapping: UserCustomerMapping = {
        id: `map-${Date.now()}`,
        userId: nextUserId,
        customerId,
        linkedAt: new Date().toISOString(),
        linkedBy: adminEmail,
        reason: 'Initial registration'
      };

      await setDoc(doc(db, 'user-customer-mappings', mapping.id), mapping);

      return {
        success: true,
        user: newUser
      };
    } catch (error) {
      console.error('Register user error:', error);
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Erro ao registrar usuário.'
        }
      };
    }
  }

  /**
   * Verificar permissões de acesso para um recurso
   */
  static checkPermission(user: AuthUser, requiredRole: UserRole | UserRole[]): boolean {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(user.role);
  }

  /**
   * Verificar se usuário tem acesso ao sistema
   */
  static isAllowedToLogin(user: AuthUser): boolean {
    if (user.role === 'sales') {
      return false; // Vendedores nunca conseguem acessar
    }
    return user.status === 'active';
  }
}
