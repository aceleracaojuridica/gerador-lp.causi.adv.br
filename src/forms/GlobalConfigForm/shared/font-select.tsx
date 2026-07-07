import { FormControl } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEFAULT_FONT_VALUE = "__default__";

export function FontSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { id: string; label: string }[];
}) {
  return (
    <Select
      value={value || DEFAULT_FONT_VALUE}
      onValueChange={(nextValue) =>
        onChange(nextValue === DEFAULT_FONT_VALUE ? "" : nextValue)
      }
    >
      <FormControl>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        <SelectGroup>
          <SelectItem value={DEFAULT_FONT_VALUE}>Padrao do site</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
