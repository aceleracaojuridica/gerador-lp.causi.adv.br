"use client";

import type { ComponentProps, Ref } from "react";
import { IMaskMixin } from "react-imask";
import { Input } from "@/components/ui/input";

type InputMaskBaseProps = ComponentProps<typeof Input> & {
  inputRef?: Ref<HTMLInputElement>;
};

const InputMask = IMaskMixin(({ inputRef, ...props }: InputMaskBaseProps) => (
  <Input {...props} ref={inputRef} />
));

export { InputMask };
