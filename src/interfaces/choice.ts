// for some reason, enquirer doesn't export this interface
export type Choice = {
  disabled?: boolean | string;
  hint?: string;
  message?: string;
  name: string;
  value?: string;
};
