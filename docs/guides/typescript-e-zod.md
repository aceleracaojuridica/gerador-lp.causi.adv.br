# Guia de Zod + TypeScript

## Links úteis

[Lendo e validando variáveis ambiente no JavaScript](https://youtu.be/n6u1eTrHxfs)
[4 libs que não podem faltar no Node.js com TypeScript (Setup Node.js + TypeScript)](https://youtu.be/mxiRCcnsKDw)

## Por que Zod?

O [Zod](https://zod.dev/) é uma biblioteca de validação e parsing de schemas com foco em TypeScript. No ecossistema JavaScript atual ele é usado massivamente, seja em React.js, seja em Node.js.

A grande vantagem do Zod é que ele une **validação em runtime** com **inferência de tipos em tempo de compilação** — você escreve o schema uma vez e ganha os dois (schema e tipagens).

---

## Instalação

```bash
pnpm add zod
```

---

## Validando variáveis de ambiente

Crie um arquivo `src/env.ts`:

```ts
import { z } from "zod";

const envSchema = z.object({
    APP_URL: z.string().url(),
    APP_PORT: z.coerce.number().default(3000),
});

const env = envSchema.parse(process.env);

export default env;
```

Agora, ao invés de usar `process.env.APP_URL!`, use:

```ts
import env from "./env";

const APP_URL: string = env.APP_URL;
console.log(APP_URL);
```

> **Por que isso é melhor?**
> Com `process.env.APP_URL` o TypeScript infere o tipo como `string | undefined`. Você precisaria usar `!` (non-null assertion) para convencer o compilador, mas isso não garante nada em runtime. Com Zod, se a variável não existir ou for inválida, o `parse()` vai lançar um erro claro **na inicialização da aplicação**, antes de qualquer coisa dar errado silenciosamente.

---

## TypeScript: `type` vs `interface`

Antes de entrar fundo no Zod, vale entender as formas nativas de tipar objetos no TypeScript.

### `interface`

```ts
interface User {
    name: string;
    email: string;
}
```

Interfaces são ótimas para definir contratos de objetos e classes. Uma vantagem exclusiva delas é a **declaration merging** — você pode declarar a mesma interface em dois lugares e o TypeScript vai mesclar as definições:

```ts
interface Window {
    myCustomProp: string;
}
// Agora `window.myCustomProp` é válido no TypeScript
```

Também suportam extensão com `extends`:

```ts
interface AuthUser {
    token: string;
}

interface User extends AuthUser {
    profileImage: string;
}
// User = { token: string; profileImage: string }
```

### `type`

```ts
type User = {
    name: string;
    email: string;
};
```

Types são mais flexíveis. Além de descrever objetos, podem representar **uniões**, **interseções**, **tipos primitivos**, **tuplas** e mais.

Para "extender" (na verdade, **interseccionar**) tipos usamos o operador `&`:

```ts
type AuthUser = {
    token: string;
};

type User = {
    profileImage: string;
} & AuthUser;
// User = { token: string; profileImage: string }
```

### Quando usar cada um?

| Situação | Recomendação |
|---|---|
| Contratos de classes / bibliotecas públicas | `interface` |
| Uniões de tipos (`A \| B`) | `type` |
| Interseções com tipos externos | `type` com `&` |
| Schemas gerados pelo Zod | `type` com `z.infer` |
| Extensão simples de objetos | qualquer um |

---

## Inferindo tipos com Zod (`z.infer`)

Como já temos o Zod instalado, podemos deixar que ele gere os tipos a partir do schema, eliminando a duplicação de código:

```ts
import { z } from "zod";

const UserSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    age: z.number().min(0),
});

type User = z.infer<typeof UserSchema>;
// Equivale a: { name: string; email: string; age: number }
```

Combinando com tipos externos:

```ts
import type { AuthUser } from "lib-externa";
import { z } from "zod";

const UserSchema = z.object({
    profileImage: z.string().url(),
});

type User = z.infer<typeof UserSchema> & AuthUser;
```

---

## Principais tipos do Zod

### Primitivos

```ts
z.string()
z.number()
z.boolean()
z.date()
z.undefined()
z.null()
z.any()
z.unknown()
z.never()
```

### String — validações comuns

```ts
z.string().min(3)
z.string().max(100)
z.string().email()
z.string().url()
z.string().uuid()
z.string().regex(/^\d{5}$/)
z.string().startsWith("BR-")
z.string().endsWith(".com")
z.string().trim()           // remove espaços antes/depois
z.string().toLowerCase()    // transforma para minúsculas
```

### Number

```ts
z.number().min(0)
z.number().max(120)
z.number().int()            // apenas inteiros
z.number().positive()
z.number().negative()
z.number().multipleOf(5)
z.coerce.number()           // converte string "42" → número 42
```

### Objetos

```ts
const AddressSchema = z.object({
    street: z.string(),
    city: z.string(),
    zip: z.string().regex(/^\d{5}-\d{3}$/),
});
```

Campos opcionais:

```ts
const UserSchema = z.object({
    name: z.string(),
    nickname: z.string().optional(),     // string | undefined
    bio: z.string().nullable(),          // string | null
    website: z.string().url().nullish(), // string | null | undefined
});
```

### Arrays

```ts
z.array(z.string())
z.array(z.number()).min(1)
z.array(z.number()).max(10)
z.array(z.number()).nonempty() // pelo menos 1 item
```

### Enums

```ts
const RoleSchema = z.enum(["super_admin", "support_admin", "owner", "admin", "user"]);
type Role = z.infer<typeof RoleSchema>;
// "super_admin" | "support_admin" | "owner" | "admin" | "user"
```

### União de tipos

```ts
const IdSchema = z.union([z.string().uuid(), z.number().int()]);
// ou de forma mais curta:
const IdSchema = z.string().uuid().or(z.number().int());
```

### Valores literais

```ts
const StatusSchema = z.literal("active");
// aceita apenas a string "active"
```

---

## Valores padrão e transformações

### `.default()`

```ts
const ConfigSchema = z.object({
    port: z.coerce.number().default(3000),
    debug: z.boolean().default(false),
});

ConfigSchema.parse({});
// → { port: 3000, debug: false }
```

### `.transform()`

Permite transformar o valor após a validação:

```ts
const SlugSchema = z.string().transform((val) =>
    val.toLowerCase().replace(/\s+/g, "-")
);

SlugSchema.parse("Hello World");
// → "hello-world"
```

### `.preprocess()`

Executado **antes** da validação — útil para conversões de tipo:

```ts
const DateSchema = z.preprocess(
    (val) => (typeof val === "string" ? new Date(val) : val),
    z.date()
);
```

---

## Tratando erros com `.safeParse()`

O `.parse()` lança uma exceção se a validação falhar. Para evitar `try/catch`, use `.safeParse()`:

```ts
const result = UserSchema.safeParse(dadosDoRequest);

if (!result.success) {
    console.error(result.error.flatten());
    // → lista de erros por campo
} else {
    const user = result.data; // tipado corretamente
}
```

`error.flatten()` retorna um objeto assim:

```json
{
  "fieldErrors": {
    "email": ["Invalid email"],
    "age": ["Number must be greater than or equal to 0"]
  },
  "formErrors": []
}
```

---

## Schemas aninhados e reutilização

```ts
const AddressSchema = z.object({
    street: z.string(),
    city: z.string(),
});

const UserSchema = z.object({
    name: z.string(),
    address: AddressSchema,
    billingAddress: AddressSchema.optional(),
});

type User = z.infer<typeof UserSchema>;
```

### `.extend()` — adicionando campos

```ts
const AdminSchema = UserSchema.extend({
    permissions: z.array(z.string()),
});
```

### `.pick()` e `.omit()` — selecionando campos

```ts
const PublicUserSchema = UserSchema.omit({ password: true });
const LoginSchema = UserSchema.pick({ email: true, password: true });
```

### `.partial()` — todos os campos opcionais (útil para PATCH)

```ts
const UpdateUserSchema = UserSchema.partial();
// Todos os campos viram optional
```

---

## Exemplo completo: validação de request

```ts
import { z } from "zod";

const CreateUserSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(["admin", "user"]).default("user"),
    birthDate: z.coerce.date().optional(),
});

type CreateUserInput = z.infer<typeof CreateUserSchema>;

function createUser(body: unknown): CreateUserInput {
    const result = CreateUserSchema.safeParse(body);

    if (!result.success) {
        throw new Error(JSON.stringify(result.error.flatten()));
    }

    return result.data;
}
```