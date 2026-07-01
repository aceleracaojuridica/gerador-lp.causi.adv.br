"use client";

import type { ICity, ICountry, IState } from "country-state-city";
import { City, Country, State } from "country-state-city";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

// Loaded once — static data
const ALL_COUNTRIES = Country.getAllCountries();

// --- Shared types ---

interface BaseComboboxProps {
  /** Valor controlado (isoCode / nome da cidade). Use com `onValueChange`. */
  value?: string | null;
  /** Valor inicial para modo não controlado. */
  defaultValue?: string;
  /** Callback disparado ao selecionar ou limpar. */
  onValueChange?: (value: string | null) => void;
  /** Texto exibido quando nenhum item está selecionado. */
  placeholder?: string;
  /** Placeholder do campo de busca. */
  searchPlaceholder?: string;
  /** Mensagem quando a busca não retorna resultados. */
  emptyMessage?: string;
  /** Exibe botão para limpar a seleção. */
  showClear?: boolean;
  /** Desabilita o combobox. */
  disabled?: boolean;
  /** Classes extras no botão trigger. */
  className?: string;
}

// --- Country ---

type CountryComboboxProps = BaseComboboxProps;

function CountryCombobox({
  value,
  defaultValue,
  onValueChange,
  placeholder = "Selecione um país",
  searchPlaceholder = "Buscar país...",
  emptyMessage = "Nenhum país encontrado.",
  showClear = false,
  disabled = false,
  className,
}: CountryComboboxProps) {
  const isControlled = value !== undefined;

  const toItem = (code: string | null | undefined): ICountry | null =>
    code ? (ALL_COUNTRIES.find((c) => c.isoCode === code) ?? null) : null;

  const handleChange = (item: ICountry | null) => {
    onValueChange?.(item?.isoCode ?? null);
  };

  return (
    <div className="contents">
      <Combobox
        items={ALL_COUNTRIES}
        {...(isControlled
          ? { value: toItem(value), onValueChange: handleChange }
          : {
              defaultValue: toItem(defaultValue),
              onValueChange: handleChange,
            })}
        itemToStringValue={(c: ICountry) => c.name}
      >
        <ComboboxTrigger
          showClear={showClear}
          render={
            <Button
              variant="input"
              className={cn("h-10 w-full justify-between", className)}
              disabled={disabled}
            />
          }
        >
          <ComboboxValue>
            {(item: ICountry | null) =>
              item ? (
                <span className="flex items-center gap-2">
                  <span>{item.flag}</span>
                  <span>{item.name}</span>
                </span>
              ) : (
                <span className="text-muted-foreground/50">{placeholder}</span>
              )
            }
          </ComboboxValue>
        </ComboboxTrigger>

        <ComboboxContent className="max-w-(--anchor-width) min-w-(--anchor-width)">
          <ComboboxInput
            showTrigger={false}
            placeholder={searchPlaceholder}
            disabled={disabled}
          />
          <ComboboxEmpty className="py-3">{emptyMessage}</ComboboxEmpty>
          <ComboboxList>
            {(item: ICountry) => (
              <ComboboxItem key={item.isoCode} value={item} className="min-h-9">
                <span>{item.flag}</span>
                <span>{item.name}</span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

// --- State ---

interface StateComboboxProps extends BaseComboboxProps {
  /**
   * isoCode do país para filtrar os estados.
   * Pode ser dinâmico (vindo de `CountryCombobox`) ou fixo (ex: `"BR"`).
   */
  countryCode?: string;
}

function StateCombobox({
  countryCode,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Selecione um estado",
  searchPlaceholder = "Buscar estado...",
  emptyMessage = "Nenhum estado encontrado.",
  showClear = false,
  disabled = false,
  className,
}: StateComboboxProps) {
  const isControlled = value !== undefined;

  const items = React.useMemo(
    () => (countryCode ? State.getStatesOfCountry(countryCode) : []),
    [countryCode],
  );

  const toItem = (code: string | null | undefined): IState | null =>
    code ? (items.find((s) => s.isoCode === code) ?? null) : null;

  const handleChange = (item: IState | null) => {
    onValueChange?.(item?.isoCode ?? null);
  };

  return (
    <div className="contents">
      {/*
       * key={countryCode}: remonta o Combobox quando o país muda.
       * Garante que o defaultValue seja resolvido após os dados do pai estarem disponíveis,
       * e que a seleção anterior seja limpa automaticamente.
       */}
      <Combobox
        key={countryCode}
        items={items}
        {...(isControlled
          ? { value: toItem(value), onValueChange: handleChange }
          : {
              defaultValue: toItem(defaultValue),
              onValueChange: handleChange,
            })}
        itemToStringValue={(s: IState) => s.name}
      >
        <ComboboxTrigger
          showClear={showClear}
          render={
            <Button
              variant="input"
              className={cn("h-10 w-full justify-between", className)}
              disabled={disabled}
            />
          }
        >
          <ComboboxValue>
            {(item: IState | null) =>
              item ? (
                <span>{item.name}</span>
              ) : (
                <span className="text-muted-foreground/50">{placeholder}</span>
              )
            }
          </ComboboxValue>
        </ComboboxTrigger>

        <ComboboxContent className="max-w-(--anchor-width) min-w-(--anchor-width)">
          <ComboboxInput
            showTrigger={false}
            placeholder={searchPlaceholder}
            disabled={disabled}
          />
          <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
          <ComboboxList>
            {(item: IState) => (
              <ComboboxItem key={item.isoCode} value={item} className="min-h-9">
                {item.name}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

// --- City ---

interface CityComboboxProps extends BaseComboboxProps {
  /**
   * isoCode do estado para filtrar as cidades.
   * Pode ser dinâmico (vindo de `StateCombobox`) ou fixo (ex: `"SP"`).
   * Sem este valor, a lista fica vazia.
   */
  stateCode?: string;
  /**
   * isoCode do país correspondente ao estado.
   * Necessário em conjunto com `stateCode`.
   */
  countryCode?: string;
}

function CityCombobox({
  stateCode,
  countryCode,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Selecione uma cidade",
  searchPlaceholder = "Buscar cidade...",
  emptyMessage = "Nenhuma cidade encontrada.",
  showClear = false,
  disabled = false,
  className,
}: CityComboboxProps) {
  const isControlled = value !== undefined;

  const items = React.useMemo(
    () =>
      stateCode && countryCode
        ? City.getCitiesOfState(countryCode, stateCode)
        : [],
    [stateCode, countryCode],
  );

  const toItem = (name: string | null | undefined): ICity | null =>
    name ? (items.find((c) => c.name === name) ?? null) : null;

  const handleChange = (item: ICity | null) => {
    onValueChange?.(item?.name ?? null);
  };

  return (
    <div className="contents">
      {/*
       * key={`${countryCode}-${stateCode}`}: remonta quando país ou estado mudam.
       * Garante que o defaultValue seja resolvido após os dados estarem disponíveis.
       */}
      <Combobox
        key={`${countryCode}-${stateCode}`}
        items={items}
        {...(isControlled
          ? { value: toItem(value), onValueChange: handleChange }
          : {
              defaultValue: toItem(defaultValue),
              onValueChange: handleChange,
            })}
        itemToStringValue={(c: ICity) => c.name}
      >
        <ComboboxTrigger
          showClear={showClear}
          render={
            <Button
              variant="input"
              className={cn("h-10 w-full justify-between", className)}
              disabled={disabled}
            />
          }
        >
          <ComboboxValue>
            {(item: ICity | null) =>
              item ? (
                <span>{item.name}</span>
              ) : (
                <span className="text-muted-foreground/50">{placeholder}</span>
              )
            }
          </ComboboxValue>
        </ComboboxTrigger>

        <ComboboxContent className="max-w-(--anchor-width) min-w-(--anchor-width)">
          <ComboboxInput
            showTrigger={false}
            placeholder={searchPlaceholder}
            disabled={disabled}
          />
          <ComboboxEmpty className="py-3">{emptyMessage}</ComboboxEmpty>
          <ComboboxList>
            {(item: ICity) => (
              <ComboboxItem
                key={`${item.stateCode}-${item.name}`}
                value={item}
                className="min-h-9"
              >
                {item.name}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

export { CountryCombobox, StateCombobox, CityCombobox };
export type { CountryComboboxProps, StateComboboxProps, CityComboboxProps };
