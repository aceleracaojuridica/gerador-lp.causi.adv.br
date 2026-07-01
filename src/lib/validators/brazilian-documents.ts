const ONLY_DIGITS_REGEX = /\D/g;

export const BRAZILIAN_MASKS = {
  cpf: "000.000.000-00",
  cnpj: "00.000.000/0000-00",
  cep: "00000-000",
} as const;

/** Remove qualquer caractere não numérico. */
export function unmaskNumeric(value: string): string {
  return value.replace(ONLY_DIGITS_REGEX, "");
}

/** Aplica máscara de CPF (000.000.000-00). */
export function formatCpf(value: string): string {
  const digits = unmaskNumeric(value).slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(
    6,
    9,
  )}-${digits.slice(9)}`;
}

/** Aplica máscara de CNPJ (00.000.000/0000-00). */
export function formatCnpj(value: string): string {
  const digits = unmaskNumeric(value).slice(0, 14);

  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(
      5,
      8,
    )}/${digits.slice(8)}`;
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(
    5,
    8,
  )}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

/** Aplica máscara de CEP (00000-000). */
export function formatCep(value: string): string {
  const digits = unmaskNumeric(value).slice(0, 8);

  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function isValidCpf(value: string): boolean {
  const cpf = unmaskNumeric(value);

  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let index = 0; index < 9; index++) {
    sum += Number(cpf[index]) * (10 - index);
  }

  let checkDigit = (sum * 10) % 11;
  if (checkDigit === 10) checkDigit = 0;
  if (checkDigit !== Number(cpf[9])) return false;

  sum = 0;
  for (let index = 0; index < 10; index++) {
    sum += Number(cpf[index]) * (11 - index);
  }

  checkDigit = (sum * 10) % 11;
  if (checkDigit === 10) checkDigit = 0;

  return checkDigit === Number(cpf[10]);
}

export function isValidCnpj(value: string): boolean {
  const cnpj = unmaskNumeric(value);

  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const calculateDigit = (base: string, factors: number[]) => {
    const total = base
      .split("")
      .reduce(
        (accumulator, digit, index) =>
          accumulator + Number(digit) * factors[index],
        0,
      );
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstFactor = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondFactor = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const firstDigit = calculateDigit(cnpj.slice(0, 12), firstFactor);
  if (firstDigit !== Number(cnpj[12])) return false;

  const secondDigit = calculateDigit(cnpj.slice(0, 13), secondFactor);
  return secondDigit === Number(cnpj[13]);
}

export function isValidCep(value: string): boolean {
  return unmaskNumeric(value).length === 8;
}
