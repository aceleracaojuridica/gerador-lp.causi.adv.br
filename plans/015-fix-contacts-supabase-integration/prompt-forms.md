## Correções

A implementação já foi feita e foram finalizadas todas as tasks, porém tem alguns bugs e coisas a serem corrigidas. Como as páginas `/pessoas` e `/organizacoes` foram implementadas com a mesma lógica deve aplicar as mesmas correções para os dois.

### Formulários

1. Ao submeter um form o botão `Salvar` não está sendo bloqueado.
- Esperado: Botão Submit com `disabled` + label "Salvando..." enquanto o formulário estiver sendo submetido.

2. Ao abrir o formulário com um id (modo edição) os dados aparecem vazios e depois são preenchidos na tela do nada. 
- Esperado: Enquanto os dados estão sendo carregados, o formulário deve mostrar um estado de loading (div com position absolute por cima do <DialogContent> com <Spinner variant="primary">). Botão Submit com `disabled` + label "Carregando..." enquanto os dados estão sendo carregados.

3. Ao enviar o form, após o submit o form fecha, e então rapidamente ele pisca aberto na tela novamente e fecha (aparece por cerca de uns 0.5s na tela e some).
- Esperado: Após o submit, o form deve fechar normalmente sem piscar aberto novamente.

4. Formato do telefone está sendo salvo incorretamente no banco de dados. 
- Esperado: salvar os campos no formato correto (ver especificação logo abaixo).

Formato atual:
```json
{
  "id": 1,
  "phone": "+5567992651578",
  "country_code": "",
  "is_primary": true,
  "full_phone": "+5567992651578"
}
```

Formato esperado:
```json
{
  "id": 1,
  "phone": "67992651578",
  "country_code": "55",
  "is_primary": true,
  "full_phone": "+5567992651578"
}
```

Problemas identificados: O phoneSchema do zod está incorreto e não possui `full_phone`, ao preencher um telefone no formulário atualmente ta salvando apenas em `phone`. Será necessário verificar o schema atual para coincidir com o esperado no banco, verificar o componente <PhoneInput> e a biblioteca `react-phone-number-input` para ver como extrair o `country_code` o `full_phone` e `phone` (nacional) para salvar corretamente no banco de dados. A biblioteca já possui funções para extrair esses valores separadamente.

5. No form de criar/editar pessoa, ao digitar qualquer coisa nos campos de "Instagram", "Cargo" ou "Endereço", aparece um erro do Next.js:

<error>
## Error Type
Console Error

## Error Message
A component is changing an uncontrolled input to be controlled. This is likely caused by the value changing from undefined to a defined value, which should not happen. Decide between using a controlled or uncontrolled input element for the lifetime of the component. More info: https://react.dev/link/controlled-components


    at input (<anonymous>:null:null)
    at Input (src/components/ui/input.tsx:7:5)
    at Object.render (src/forms/PersonForm/person-form.tsx:545:15)
    at PersonForm (src/forms/PersonForm/person-form.tsx:538:7)
    at PersonPageClient (src/app/(app)/(pessoas)/pessoas/page.client.tsx:215:13)
    at PersonPage (src\app\(app)\(pessoas)\pessoas\page.tsx:64:5)

## Code Frame
   5 | function Input({ className, type, ...props }: React.ComponentProps<"input">) {
   6 |   return (
>  7 |     <input
     |     ^
   8 |       type={type}
   9 |       data-slot="input"
  10 |       className={cn(

Next.js version: 16.2.1 (Turbopack)
</error>

6. Ao editar uma pessoa que já tem um telefone ou e-mail, ao salvar, os telefones/emails não são substituídos no banco de dados, são criados novos. Então se eu tenho uma pessoa cadastrada com 2 telefones, eu edito só o nome, ao salvar, são criados 2 novos telefones. Outro detalhe, como são itens duplicados, são criados com `is_primary` = `true`, então a persons_summary lista pessoas duplicadas pois fica com mais de um telefone marcado como primário. Isso também causa o seguinte erro no nextjs:

<error>
## Error Type
Console Error

## Error Message
Encountered two children with the same key, `4`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.


    at <unknown> (src/app/(app)/(pessoas)/pessoas/data-table.tsx:234:7)
    at Array.map (<anonymous>:null:null)
    at renderTableBody (src/app/(app)/(pessoas)/pessoas/data-table.tsx:233:37)
    at PersonDataTable (src/app/(app)/(pessoas)/pessoas/data-table.tsx:289:12)
    at PersonPageClient (src/app/(app)/(pessoas)/pessoas/page.client.tsx:186:7)
    at PersonPage (src\app\(app)\(pessoas)\pessoas\page.tsx:64:5)

## Code Frame
  232 |
  233 |     return table.getRowModel().rows.map((row) => (
> 234 |       <TableRow
      |       ^
  235 |         key={row.id}
  236 |         data-state={row.getIsSelected() ? "selected" : undefined}
  237 |         className="[&_td:first-child]:pl-4 md:[&_td:first-child]:pl-7 [&_td:last-child]:pr-4 md:[&_td:last-child]:pr-7 text-muted-for...

Next.js version: 16.2.1 (Turbopack)
</error>

O erro acima só ocorre por quê a view está retornando dados duplicados, então a key fica duplicada, se resolver o problema de update dos telefones/emails, esse erro deve ser resolvido também.

Verifique a RPC `update_person` pra ver como é feito a atualização dos telefones e e-mails. O problema pode estar relacionado aos ids do array de telefones/emails do formulário. Por exemplo para telefones, a RPC recebe 3 JSONs: p_create_phones, p_update_phones, p_delete_phones.
- p_create_phones: deve conter o JSON sem id existente.
- p_update_phones: deve conter o JSON com ID do item existente no banco.
- p_delete_phones: deve conter apenas os IDs dos itens que devem ser deletados do banco.

Lembrando que os telefones no formulário podem ser itens existentes, ou itens novos.