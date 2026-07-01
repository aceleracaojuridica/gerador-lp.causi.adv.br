"use client";

import {
  ArrowDropDown,
  Language as LanguageIcon,
} from "@material-symbols-svg/react/rounded/w600";
import {
  type ComponentProps,
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";
import * as BasePhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import pt_BR from "react-phone-number-input/locale/pt-BR";
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
import { Input } from "@/components/ui/input";
import { InputGroupInput } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

type PhoneInputSize = "sm" | "default" | "lg";

const PhoneInputContext = createContext<{
  variant: PhoneInputSize;
  popupClassName?: string;
  scrollAreaClassName?: string;
  isInputGroup?: boolean;
}>({
  variant: "default",
  popupClassName: undefined,
  scrollAreaClassName: undefined,
  isInputGroup: false,
});

type PhoneInputProps = Omit<
  ComponentProps<"input">,
  "onChange" | "value" | "ref"
> &
  Omit<
    BasePhoneInput.Props<typeof BasePhoneInput.default>,
    "onChange" | "variant" | "popupClassName" | "scrollAreaClassName"
  > & {
    onChange?: (value: BasePhoneInput.Value) => void;
    variant?: PhoneInputSize;
    popupClassName?: string;
    scrollAreaClassName?: string;
    isInputGroup?: boolean;
  };

function PhoneInput({
  className,
  variant,
  popupClassName,
  scrollAreaClassName,
  isInputGroup = false,
  onChange,
  value,
  ...props
}: PhoneInputProps) {
  const phoneInputSize = variant || "default";
  return (
    <PhoneInputContext.Provider
      value={{
        variant: phoneInputSize,
        popupClassName,
        scrollAreaClassName,
        isInputGroup,
      }}
    >
      <BasePhoneInput.default
        className={cn(
          "flex",
          props["aria-invalid"] &&
            "[&_*[data-slot=combobox-trigger]]:border-border",
          className,
        )}
        labels={pt_BR}
        flagComponent={FlagComponent}
        countrySelectComponent={CountrySelect}
        inputComponent={InputComponent}
        smartCaret={false}
        value={value || undefined}
        onChange={(value) => onChange?.(value || ("" as BasePhoneInput.Value))}
        {...props}
      />
    </PhoneInputContext.Provider>
  );
}

function InputComponent({ className, ...props }: ComponentProps<typeof Input>) {
  const { variant, isInputGroup } = useContext(PhoneInputContext);

  if (isInputGroup) {
    return (
      <InputGroupInput
        className={cn("rounded-none flex-1", className)}
        {...props}
      />
    );
  }

  return (
    <Input
      className={cn(
        "rounded-s-none focus:z-1",
        variant === "default" && "h-9",
        variant === "sm" && "h-7",
        variant === "lg" && "h-10",
        className,
      )}
      {...props}
    />
  );
}

type CountryEntry = {
  label: string;
  value: BasePhoneInput.Country | undefined;
};

type CountrySelectProps = {
  disabled?: boolean;
  value: BasePhoneInput.Country;
  options: CountryEntry[];
  onChange: (country: BasePhoneInput.Country) => void;
};

function CountrySelect({
  disabled,
  value: selectedCountry,
  options: countryList,
  onChange,
}: CountrySelectProps) {
  const { variant, popupClassName, isInputGroup } =
    useContext(PhoneInputContext);
  const [searchValue, setSearchValue] = useState("");

  const filteredCountries = useMemo(() => {
    if (!searchValue) return countryList;
    return countryList.filter(({ label }) =>
      label.toLowerCase().includes(searchValue.toLowerCase()),
    );
  }, [countryList, searchValue]);

  return (
    <Combobox
      items={filteredCountries}
      value={selectedCountry || ""}
      onValueChange={(country: BasePhoneInput.Country | null) => {
        if (country) {
          onChange(country);
        }
      }}
    >
      <ComboboxTrigger
        render={
          <Button
            variant="outline-light"
            size={variant}
            className={cn(
              "rounded-s-lg rounded-e-none flex gap-0.5 border-e-0 !px-2 py-0 leading-none bg-transparent focus:z-10 data-pressed:bg-transparent",
              isInputGroup &&
                "rounded-none border-0 border-r-1 h-auto mt-[1px] mb-[1px]",
              disabled && "opacity-50",
            )}
            disabled={disabled}
          >
            <span className="sr-only">
              <ComboboxValue />
            </span>
            <FlagComponent
              country={selectedCountry}
              countryName={selectedCountry}
            />
            <ArrowDropDown className="size-4 shrink-0 mr-[-5px]" />
            {/* <span className="text-sm text-foreground">
              +{BasePhoneInput.getCountryCallingCode(selectedCountry)}
            </span> */}
          </Button>
        }
      />
      <ComboboxContent
        className={cn(
          "w-xs *:data-[slot=input-group]:bg-transparent",
          popupClassName,
        )}
      >
        <ComboboxInput
          placeholder="Buscar países"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          showTrigger={false}
        />
        <ComboboxEmpty>Nenhum país encontrado.</ComboboxEmpty>
        <ComboboxList>
          {filteredCountries.map((item: CountryEntry) =>
            item.value ? (
              <ComboboxItem
                key={item.value}
                value={item.value}
                className={"min-h-9"}
              >
                <FlagComponent country={item.value} countryName={item.label} />
                <span className="text-sm truncate">{item.label}</span>
                <span className="text-foreground/50 text-xs">
                  {`+${BasePhoneInput.getCountryCallingCode(item.value)}`}
                </span>
              </ComboboxItem>
            ) : null,
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function FlagComponent({ country, countryName }: BasePhoneInput.FlagProps) {
  const Flag = flags[country];

  return (
    <span className="flex h-4 w-4 items-center justify-center [&_svg:not([class*='size-'])]:size-full! [&_svg:not([class*='size-'])]:rounded-[5px]">
      {Flag ? (
        <Flag title={countryName} />
      ) : (
        <LanguageIcon className="size-4 opacity-60" />
      )}
    </span>
  );
}

function InputGroupPhoneInput({
  ...props
}: Omit<PhoneInputProps, "isInputGroup">) {
  return <PhoneInput {...props} isInputGroup />;
}

export { PhoneInput, InputGroupPhoneInput };
