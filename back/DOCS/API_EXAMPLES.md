# 📡 Exemplos de Requisições - API CMS News

Exemplos práticos de como usar a API com curl, JavaScript (fetch) e descrição das respostas.

## 🔧 Base URL

```
http://localhost:3000/api
```

Em produção, substitua pelo domínio real.

---

## 🔐 Autenticação

### 1. Login

**Endpoint:** `POST /api/login`

**cURL:**
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cms.ecwd.cloud",
    "password": "admin123"
  }'
```

**JavaScript (fetch):**
```javascript
const response = await fetch('http://localhost:3000/api/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@cms.ecwd.cloud',
    password: 'admin123'
  })
});

const data = await response.json();
console.log(data);
```

**Resposta de sucesso (200):**
```json
{
  "message": "Login bem-sucedido",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@cms.ecwd.cloud",
    "name": "Administrador",
    "createdAt": "2025-11-03T10:00:00.000Z"
  }
}
```

**Resposta de erro (401):**
```json
{
  "error": "Email ou senha inválidos"
}
```

### 2. Refresh Token

**Endpoint:** `POST /api/refresh`

**cURL:**
```bash
curl -X POST http://localhost:3000/api/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "seu-refresh-token-aqui"
  }'
```

**JavaScript:**
```javascript
const response = await fetch('http://localhost:3000/api/refresh', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    refreshToken: localStorage.getItem('refreshToken')
  })
});

const data = await response.json();
localStorage.setItem('accessToken', data.accessToken);
```

**Resposta (200):**
```json
{
  "accessToken": "novo-access-token-aqui"
}
```

---

## 👥 Usuários

### 1. Listar Usuários (Protegido)

**Endpoint:** `GET /api/usuarios`

**cURL:**
```bash
curl -X GET http://localhost:3000/api/usuarios \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**JavaScript:**
```javascript
const response = await fetch('http://localhost:3000/api/usuarios', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});

const usuarios = await response.json();
```

**Resposta (200):**
```json
[
  {
    "id": 1,
    "name": "Administrador",
    "email": "admin@cms.ecwd.cloud",
    "createdAt": "2025-11-03T10:00:00.000Z",
    "updatedAt": "2025-11-03T10:00:00.000Z"
  }
]
```

### 2. Criar Usuário (Protegido)

**Endpoint:** `POST /api/usuarios`

**cURL:**
```bash
curl -X POST http://localhost:3000/api/usuarios \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@cms.ecwd.cloud",
    "password": "senha123"
  }'
```

**JavaScript:**
```javascript
const response = await fetch('http://localhost:3000/api/usuarios', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'João Silva',
    email: 'joao@hajar.com',
    password: 'senha123'
  })
});
```

---

## 🏠 Imóveis

### 1. Listar Imóveis (Público)

**Endpoint:** `GET /api/imoveis`

**cURL:**
```bash
# Todos os imóveis
curl http://localhost:3000/api/imoveis

# Filtrar por cidade
curl "http://localhost:3000/api/imoveis?cidade=São Paulo"

# Filtrar por tipo
curl "http://localhost:3000/api/imoveis?tipo=Apartamento"
```

**JavaScript:**
```javascript
// Listar todos
const response = await fetch('http://localhost:3000/api/imoveis');
const imoveis = await response.json();

// Com filtros
const response = await fetch('http://localhost:3000/api/imoveis?cidade=São Paulo&tipo=Casa');
const imoveis = await response.json();
```

**Resposta (200):**
```json
[
  {
    "id": 1,
    "titulo": "Apartamento Moderno no Centro",
    "codigo": "AP001",
    "subTitulo": "3 quartos com suíte",
    "descricaoCurta": "Apartamento completamente reformado",
    "descricaoLonga": "Descrição completa aqui...",
    "fotos": [
      "https://bucket.s3.amazonaws.com/imoveis/123-foto1.jpg",
      "https://bucket.s3.amazonaws.com/imoveis/123-foto2.jpg"
    ],
    "cidade": "São Paulo",
    "valor": "450000",
    "endereco": "Rua das Flores, 123",
    "createdAt": "2025-11-03T10:00:00.000Z",
    "updatedAt": "2025-11-03T10:00:00.000Z",
    "tipo": [
      {
        "id": 1,
        "tipo": {
          "id": 1,
          "nome": "Apartamento"
        }
      }
    ],
    "finalidade": [
      {
        "id": 1,
        "finalidade": {
          "id": 1,
          "nome": "Venda"
        }
      }
    ]
  }
]
```

### 2. Ver Imóvel Específico (Público)

**Endpoint:** `GET /api/imoveis/:codigo`

**cURL:**
```bash
curl http://localhost:3000/api/imoveis/AP001
```

### 3. Criar Imóvel (Protegido) - COM UPLOAD DE FOTOS

**Endpoint:** `POST /api/imoveis`

**cURL:**
```bash
curl -X POST http://localhost:3000/api/imoveis \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -F "titulo=Apartamento Novo" \
  -F "codigo=AP002" \
  -F "subTitulo=2 quartos" \
  -F "descricaoCurta=Apartamento novo no centro" \
  -F "descricaoLonga=Descrição completa..." \
  -F "tipo=1" \
  -F "finalidade=1" \
  -F "valor=350000" \
  -F "endereco=Rua A, 456" \
  -F "cidade=Rio de Janeiro" \
  -F "fotos=@/caminho/para/foto1.jpg" \
  -F "fotos=@/caminho/para/foto2.jpg"
```

**JavaScript (com FormData):**
```javascript
const formData = new FormData();
formData.append('titulo', 'Apartamento Novo');
formData.append('codigo', 'AP002');
formData.append('subTitulo', '2 quartos');
formData.append('descricaoCurta', 'Apartamento novo no centro');
formData.append('descricaoLonga', 'Descrição completa...');
formData.append('tipo', '1');
formData.append('finalidade', '1');
formData.append('valor', '350000');
formData.append('endereco', 'Rua A, 456');
formData.append('cidade', 'Rio de Janeiro');

// Adicionar fotos do input file
const fileInput = document.querySelector('input[type="file"]');
for (let file of fileInput.files) {
  formData.append('fotos', file);
}

const response = await fetch('http://localhost:3000/api/imoveis', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    // NÃO adicionar Content-Type - o browser adiciona automaticamente com boundary
  },
  body: formData
});

const imovel = await response.json();
```

**React Example (com estado):**
```javascript
const [formData, setFormData] = useState({
  titulo: '',
  codigo: '',
  subTitulo: '',
  descricaoCurta: '',
  descricaoLonga: '',
  tipo: '',
  finalidade: '',
  valor: '',
  endereco: '',
  cidade: ''
});
const [fotos, setFotos] = useState([]);

const handleSubmit = async (e) => {
  e.preventDefault();
  
  const data = new FormData();
  Object.keys(formData).forEach(key => {
    data.append(key, formData[key]);
  });
  
  fotos.forEach(foto => {
    data.append('fotos', foto);
  });
  
  const response = await fetch('http://localhost:3000/api/imoveis', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    },
    body: data
  });
  
  if (response.ok) {
    const imovel = await response.json();
    console.log('Imóvel criado:', imovel);
  }
};
```

### 4. Atualizar Imóvel (Protegido)

**Endpoint:** `PUT /api/imoveis/:id`

**cURL:**
```bash
curl -X PUT http://localhost:3000/api/imoveis/1 \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -F "titulo=Apartamento Atualizado" \
  -F "codigo=AP001" \
  -F "valor=500000" \
  -F "tipo=1" \
  -F "finalidade=1" \
  -F "oldPhotos=[\"url1\",\"url2\"]" \
  -F "fotos=@/caminho/nova-foto.jpg"
```

**JavaScript:**
```javascript
const formData = new FormData();
formData.append('titulo', 'Apartamento Atualizado');
formData.append('codigo', 'AP001');
formData.append('valor', '500000');
formData.append('tipo', '1');
formData.append('finalidade', '1');

// Manter fotos antigas
formData.append('oldPhotos', JSON.stringify([
  'https://bucket.s3.amazonaws.com/imoveis/foto-antiga.jpg'
]));

// Adicionar novas fotos
const newFiles = document.querySelector('#newPhotos').files;
for (let file of newFiles) {
  formData.append('fotos', file);
}

const response = await fetch(`http://localhost:3000/api/imoveis/${id}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  },
  body: formData
});
```

### 5. Deletar Imóvel (Protegido)

**Endpoint:** `DELETE /api/imoveis/:id`

**cURL:**
```bash
curl -X DELETE http://localhost:3000/api/imoveis/1 \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**JavaScript:**
```javascript
const response = await fetch(`http://localhost:3000/api/imoveis/${id}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});

if (response.ok) {
  console.log('Imóvel deletado com sucesso');
}
```

---

## 🏷️ Tipos de Imóveis

### 1. Listar Tipos (Público)

**Endpoint:** `GET /api/tipo`

**cURL:**
```bash
curl http://localhost:3000/api/tipo
```

**Resposta (200):**
```json
[
  {
    "id": 1,
    "nome": "Apartamento",
    "createdAt": "2025-11-03T10:00:00.000Z",
    "updatedAt": "2025-11-03T10:00:00.000Z"
  },
  {
    "id": 2,
    "nome": "Casa",
    "createdAt": "2025-11-03T10:00:00.000Z",
    "updatedAt": "2025-11-03T10:00:00.000Z"
  }
]
```

### 2. Criar Tipo (Protegido)

**Endpoint:** `POST /api/tipo`

**cURL:**
```bash
curl -X POST http://localhost:3000/api/tipo \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"nome": "Loft"}'
```

**JavaScript:**
```javascript
const response = await fetch('http://localhost:3000/api/tipo', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nome: 'Loft'
  })
});
```

---

## 📁 Categorias

### 1. Listar Categorias (Público)

**Endpoint:** `GET /api/categorias`

**cURL:**
```bash
curl http://localhost:3000/api/categorias
```

### 2. Criar Categoria (Protegido)

**Endpoint:** `POST /api/categorias`

**cURL:**
```bash
curl -X POST http://localhost:3000/api/categorias \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"nome": "Luxo"}'
```

---

## 🎯 Finalidades

### 1. Listar Finalidades (Público)

**Endpoint:** `GET /api/finalidade`

**cURL:**
```bash
curl http://localhost:3000/api/finalidade
```

### 2. Criar Finalidade (Protegido)

**Endpoint:** `POST /api/finalidade`

**cURL:**
```bash
curl -X POST http://localhost:3000/api/finalidade \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"nome": "Investimento"}'
```

---

## ❌ Tratamento de Erros

### Erro de Validação (400)
```json
{
  "error": "Erro de validação",
  "details": [
    {
      "field": "email",
      "message": "Email inválido"
    },
    {
      "field": "password",
      "message": "Senha deve ter no mínimo 6 caracteres"
    }
  ]
}
```

### Não Autorizado (401)
```json
{
  "error": "Token inválido ou expirado"
}
```

### Não Encontrado (404)
```json
{
  "error": "Imóvel não encontrado"
}
```

### Conflito (409)
```json
{
  "error": "Email já cadastrado"
}
```

### Erro do Servidor (500)
```json
{
  "error": "Erro interno do servidor"
}
```

---

## 🔑 Exemplo Completo - Fluxo de Autenticação

```javascript
// 1. Fazer login
async function login(email, password) {
  const response = await fetch('http://localhost:3000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    throw new Error('Login falhou');
  }
  
  const data = await response.json();
  
  // Salvar tokens
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  return data.user;
}

// 2. Fazer requisição autenticada
async function fetchProtectedData(url) {
  let token = localStorage.getItem('accessToken');
  
  let response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  // Se token expirou, renovar
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    
    const refreshResponse = await fetch('http://localhost:3000/api/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    if (refreshResponse.ok) {
      const { accessToken } = await refreshResponse.json();
      localStorage.setItem('accessToken', accessToken);
      
      // Tentar novamente com novo token
      response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
    } else {
      // Refresh token também expirou, fazer logout
      logout();
      throw new Error('Sessão expirada');
    }
  }
  
  return response.json();
}

// 3. Logout
function logout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

// Uso:
try {
  const user = await login('admin@cms.ecwd.cloud', 'admin123');
  console.log('Logado como:', user.name);
  
  const imoveis = await fetchProtectedData('http://localhost:3000/api/usuarios');
  console.log('Usuários:', imoveis);
} catch (error) {
  console.error('Erro:', error.message);
}
```

---

## 📝 Notas Importantes

1. **CORS**: Em produção, configure o CORS corretamente no `.env`
2. **Tokens**: Access token expira em 24h, Refresh token em 7 dias
3. **Upload**: Máximo de 10 fotos por imóvel, 5MB cada
4. **IDs**: Agora são números inteiros (não ObjectId)
5. **Prefix**: Todas as rotas têm `/api` no início

