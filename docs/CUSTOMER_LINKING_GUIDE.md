# 🔐 Guia de Implementação: Sistema de Vinculação de Customers com Autenticação

## 📋 Visão Geral

Este documento descreve a arquitetura e implementação do sistema de **vinculação de usuários a customers** com **controle de acesso baseado em roles** e **bloqueio para vendedores**.

---

## 🏗️ Arquitetura do Banco de Dados

### Coleção: `customers`
```typescript
{
  id: "cust-001",
  name: "Empresa X",
  status: "active" | "inactive" | "pending",
  maxUsers: 5,              // Limite de usuários
  currentUserCount: 2,      // Usuários ativos
  createdAt: "2026-07-01T10:00:00Z",
  createdBy: "adm@empresa.com",
  metadata: {
    phone: "(11) 98765-4321",
    email: "contato@empresa-x.com",
    address: "Rua A, 123"
  }
}
```

### Coleção: `users`
```typescript
{
  id: "user-001",
  email: "junior@empresa.com",
  name: "Junior",
  role: "support" | "customer" | "sales" | "admin",
  customerId: "cust-001",  // Vinculação obrigatória (exceto admin)
  status: "active" | "inactive" | "blocked",
  avatarUrl: "https://...",
  createdAt: "2026-07-01T10:00:00Z",
  metadata: {
    department: "Suporte Técnico",
    phone: "(11) 98765-4321"
  }
}
```

### Coleção: `user-customer-mappings` (Auditoria)
```typescript
{
  id: "map-1719839213745",
  userId: "user-001",
  customerId: "cust-001",
  linkedAt: "2026-07-01T10:00:00Z",
  linkedBy: "adm@empresa.com",
  reason: "Initial registration"
}
```

---

## 🔄 Fluxo de Autenticação

### 1️⃣ Login do Usuário

```
┌─────────────────────────────────────────────────┐
│ Usuário insere email e senha                    │
└─────────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────────────┐
        │ 1. É ADMIN?                   │
        └───────────────────────────────┘
         /                           \
       SIM                            NÃO
        │                              │
    Validar       ┌─────────────────────────────────┐
    Senha ADM     │ 2. Buscar usuário no Firestore  │
    (201515)      └─────────────────────────────────┘
        │                    ↓
        │        ┌───────────────────────────────┐
        │        │ 3. É VENDEDOR (role=sales)?   │
        │        └───────────────────────────────┘
        │         /                           \
        │       SIM                          NÃO
        │        │                             │
        │    ❌ BLOQUEAR          ┌──────────────────────┐
        │        │                │ 4. Status = active?  │
        │        │                └──────────────────────┘
        │        │                 /                  \
        │        │               SIM                 NÃO
        │        │                │                   │
        │        │    ┌──────────────────────────┐   │
        │        │    │ 5. Validar customer      │   │
        │        │    │    - Existe?             │   ❌
        │        │    │    - Status = active?    │   │
        │        │    └──────────────────────────┘   │
        │        │             ↓                     │
        └────────┴─────────────────────────────┐     │
                                 ↓              ↓     ↓
                    ┌─────────────────────────────────────┐
                    │ ✅ LOGIN BEM-SUCEDIDO               │
                    │ Retorna user + customerData         │
                    └─────────────────────────────────────┘
```

---

## 👤 Roles e Permissões

| Role | Acesso ao Sistema | Pode ter Customer | Pode ser Bloqueado | Notas |
|------|------|------|------|------|
| **admin** | ✅ Sempre | ❌ Não | ❌ Não | Controla tudo |
| **support** | ✅ Se customer ativo | ✅ Obrigatório | ✅ Sim | Atende chamados |
| **customer** | ✅ Se customer ativo | ✅ Obrigatório | ✅ Sim | Abre chamados |
| **sales** | ❌ **NUNCA** | ❌ Não | N/A | Bloqueado automaticamente |

---

## 🔑 Como Funciona a Segurança

### 1. **Vendedores Não Conseguem Fazer Login**

```typescript
if (userData.role === 'sales') {
  return {
    success: false,
    error: {
      code: 'SALES_CANNOT_LOGIN',
      message: '❌ Vendedores não têm acesso ao sistema.'
    }
  };
}
```

### 2. **Só Admin Pode Registrar Customers**

```typescript
if (adminEmail !== ADMIN_EMAIL) {
  return {
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Apenas administradores podem registrar customers.'
    }
  };
}
```

### 3. **Limite de Usuários por Customer**

```typescript
if (customerData.currentUserCount >= customerData.maxUsers) {
  return {
    success: false,
    error: {
      code: 'CUSTOMER_FULL',
      message: `Customer atingiu limite de ${customerData.maxUsers} usuários.`
    }
  };
}
```

### 4. **Customer Inativo = Usuários Bloqueados**

```typescript
if (customerData.status !== 'active') {
  return {
    success: false,
    error: {
      code: 'CUSTOMER_INACTIVE',
      message: `Customer "${customerData.name}" está ${customerData.status}.`
    }
  };
}
```

---

## 🚀 Como Usar

### Pré-requisitos

1. **Registrar Customers** (apenas Admin)
   - Email: adm@empresa.com
   - Senha: 201515
   - Criar customers com limite de usuários

2. **Registrar Usuários** (apenas Admin)
   - Vincular a um customer existente
   - Definir role (support ou customer)
   - Usuários receberão acesso imediato

3. **Bloquear Vendedores**
   - Tentar fazer login com role=sales → ❌ Bloqueado automaticamente

### Exemplo de Fluxo

```typescript
// 1. Admin registra customer
const customerResponse = await AuthService.registerCustomer('adm@empresa.com', {
  name: 'Empresa X',
  status: 'active',
  maxUsers: 5
});

// 2. Admin registra usuário no customer
const userResponse = await AuthService.registerUserToCustomer(
  'adm@empresa.com',
  {
    email: 'junior@empresa.com',
    name: 'Junior',
    role: 'support',
    status: 'active'
  },
  'cust-001' // ID do customer
);

// 3. Usuário faz login
const loginResponse = await AuthService.login({
  email: 'junior@empresa.com',
  password: 'password123'
});

// 4. Vendedor tenta fazer login → BLOQUEADO
const salesLoginResponse = await AuthService.login({
  email: 'vendedor@empresa.com',
  password: 'password123'
});
// ❌ Erro: 'Vendedores não têm acesso ao sistema.'
```

---

## 📊 Casos de Uso

### Caso 1: Múltiplos Usuários para 1 Customer

```
Customer: Empresa X
├── User 1: junior@empresa.com (role: support)
├── User 2: ana@empresa.com (role: support)
├── User 3: carlos@empresa.com (role: customer)
└── User 4: mariana@empresa.com (role: customer)
```

### Caso 2: Bloquear Customer Inteiro

```typescript
// Admin desativa customer
await CustomerManagementService.updateCustomerStatus('cust-001', 'inactive');

// Todos os usuários desse customer ficam bloqueados
// Próximo login → ❌ "Customer está inativo"
```

### Caso 3: Auditar Vinculações

```typescript
// Consultar user-customer-mappings
// Ver quem vinculou qual usuário a qual customer
// Data e motivo da vinculação
```

---

## 🛠️ Próximos Passos

- [ ] Implementar tela de Admin Panel
- [ ] Criar CRUD para gerenciar customers
- [ ] Adicionar hash de senha com bcrypt
- [ ] Implementar 2FA para admin
- [ ] Criar relatórios de auditoria
- [ ] Adicionar logs de acesso
- [ ] Implementar refresh tokens

---

## 📚 Arquivos Principais

- `src/services/authService.ts` - Lógica de autenticação
- `src/services/customerManagementService.ts` - Gerenciar customers
- `src/types-auth.ts` - Tipos e interfaces
- `src/components/LoginScreen.tsx` - Tela de login atualizada

---

## 🔗 Referências Firestore

```javascript
// Estrutura de collections:
db
├── customers/
│   ├── cust-001/
│   ├── cust-002/
│   └── ...
├── users/
│   ├── user-001/
│   ├── user-002/
│   └── ...
└── user-customer-mappings/
    ├── map-1/
    ├── map-2/
    └── ...
```

---

**Desenvolvido por:** @copilot  
**Data:** 2026-07-01
