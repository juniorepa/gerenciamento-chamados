// ==================== CUSTOMER MANAGEMENT SERVICE ====================
// Gerencia operações de customers (apenas admin)

import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Customer } from '../types-auth';

export class CustomerManagementService {
  /**
   * Obter todos os customers
   */
  static async getAllCustomers(): Promise<Customer[]> {
    try {
      const customersRef = collection(db, 'customers');
      const snapshot = await getDocs(customersRef);
      return snapshot.docs.map(doc => doc.data() as Customer);
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  }

  /**
   * Obter customer por ID
   */
  static async getCustomerById(customerId: string): Promise<Customer | null> {
    try {
      const customerDoc = await getDoc(doc(db, 'customers', customerId));
      return customerDoc.exists() ? (customerDoc.data() as Customer) : null;
    } catch (error) {
      console.error('Error fetching customer:', error);
      return null;
    }
  }

  /**
   * Atualizar status do customer
   */
  static async updateCustomerStatus(
    customerId: string,
    status: 'active' | 'inactive' | 'pending'
  ): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'customers', customerId), { status });
      return true;
    } catch (error) {
      console.error('Error updating customer status:', error);
      return false;
    }
  }

  /**
   * Atualizar limite de usuários
   */
  static async updateMaxUsers(
    customerId: string,
    maxUsers: number
  ): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'customers', customerId), { maxUsers });
      return true;
    } catch (error) {
      console.error('Error updating max users:', error);
      return false;
    }
  }

  /**
   * Obter usuários de um customer
   */
  static async getCustomerUsers(customerId: string): Promise<any[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('customerId', '==', customerId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error fetching customer users:', error);
      return [];
    }
  }

  /**
   * Bloquear usuário
   */
  static async blockUser(userId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'users', userId), { status: 'blocked' });
      return true;
    } catch (error) {
      console.error('Error blocking user:', error);
      return false;
    }
  }

  /**
   * Desbloquear usuário
   */
  static async unblockUser(userId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'users', userId), { status: 'active' });
      return true;
    } catch (error) {
      console.error('Error unblocking user:', error);
      return false;
    }
  }
}
